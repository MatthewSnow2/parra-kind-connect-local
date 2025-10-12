/**
 * Senior Chat Component
 *
 * Secure chat interface with comprehensive input validation and sanitization.
 *
 * Security Features:
 * - Message validation using Zod schemas
 * - Input sanitization to prevent XSS
 * - Rate limiting to prevent spam
 * - Secure message storage
 * - Content length limits
 * - User authentication required
 *
 * @example
 * Navigate to /senior/chat to access this page
 */

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { callSupabaseFunctionStreaming } from "@/lib/supabase-functions";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { chatMessageSchema, chatMessageObjectSchema, type ChatMessage } from "@/lib/validation/schemas";
import { sanitizeChatMessage, sanitizeText } from "@/lib/validation/sanitization";
import { checkRateLimit, recordRateLimitedAction, RATE_LIMITS } from "@/lib/validation/rate-limiting";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const SeniorChat = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "type";
  const { user, profile } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm Parra, your friendly companion. How are you feeling today?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkInStarted] = useState(new Date().toISOString());
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use authenticated user's ID
  const patientId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveCheckIn = async () => {
    if (!patientId) {
      sonnerToast.error("Unable to save: User not authenticated");
      return;
    }

    try {
      const messagesWithTimestamps = messages.map((msg, idx) => ({
        ...msg,
        timestamp: msg.timestamp || new Date(Date.now() - (messages.length - idx) * 1000).toISOString()
      }));

      const checkInData = {
        patient_id: patientId,
        interaction_type: mode === "talk" ? "voice" as const : "text" as const,
        started_at: checkInStarted,
        ended_at: new Date().toISOString(),
        messages: messagesWithTimestamps,
        sentiment_score: null, // TODO: Add sentiment analysis
        mood_detected: null, // TODO: Add mood detection
        topics_discussed: [], // TODO: Extract topics
        safety_concern_detected: false,
      };

      if (checkInId) {
        // Update existing check-in
        const { error } = await supabase
          .from("check_ins")
          .update(checkInData)
          .eq("id", checkInId)
          .eq("patient_id", patientId); // Security: Ensure user owns this check-in

        if (error) throw error;
      } else {
        // Create new check-in
        const { data, error } = await supabase
          .from("check_ins")
          .insert(checkInData)
          .select()
          .single();

        if (error) throw error;
        if (data) setCheckInId(data.id);
      }

      sonnerToast.success("Check-in saved successfully");
    } catch (error) {
      console.error("Error saving check-in:", error);
      sonnerToast.error("Failed to save check-in");
    }
  };

  // Auto-save every 5 messages
  useEffect(() => {
    if (messages.length > 1 && messages.length % 5 === 0) {
      void saveCheckIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const streamChat = async (userMessage: Message) => {
    try {
      // Use secure function calling with proper authentication
      const resp = await callSupabaseFunctionStreaming({
        functionName: "senior-chat",
        body: { messages: [...messages, userMessage] },
      });

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;

            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];

                if (lastMsg?.role === "assistant") {
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg,
                    content: assistantContent,
                  };
                } else {
                  newMessages.push({
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date().toISOString()
                  });
                }

                return newMessages;
              });
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user?.id) return;

    // Validate message length
    const trimmedInput = input.trim();

    // Validate with Zod schema
    const validation = chatMessageSchema.safeParse(trimmedInput);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid message";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit('chat_message', user.id, RATE_LIMITS.CHAT_MESSAGE);
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limit",
        description: `Too many messages. Please wait ${Math.ceil(rateLimitCheck.resetIn / 1000)} seconds.`,
        variant: "destructive",
      });
      return;
    }

    // Sanitize message content
    const sanitizedContent = sanitizeChatMessage(validation.data);

    // Record rate limit action
    recordRateLimitedAction('chat_message', user.id);

    const userMessage: Message = {
      role: "user",
      content: sanitizedContent,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await streamChat(userMessage);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <Navigation />

      <main className="flex-1 pt-24 pb-6 px-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <Card className="bg-card flex-1 flex flex-col shadow-xl">
            {/* Chat Header */}
            <div className="border-b border-primary p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-heading font-bold text-secondary mb-2">
                    Chat with Parra
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {mode === "talk" ? "Voice mode (coming soon - using text for now)" : "Type your message below"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={saveCheckIn}
                  className="gap-2"
                  disabled={messages.length <= 1}
                >
                  <Save className="h-5 w-5" />
                  Save Chat
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xl ${
                      message.role === "user"
                        ? "bg-secondary text-background"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl p-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-secondary rounded-full animate-bounce delay-100" />
                      <div className="w-3 h-3 bg-secondary rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-primary p-6">
              <div className="flex gap-3">
                {mode === "talk" && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="shrink-0 h-14 w-14"
                    disabled={isLoading}
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                )}
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 text-xl h-14 px-6"
                  disabled={isLoading}
                />
                <Button
                  size="lg"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="h-14 px-8 bg-accent hover:bg-accent/90"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SeniorChat;
