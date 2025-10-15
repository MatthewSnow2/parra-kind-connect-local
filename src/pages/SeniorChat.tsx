/**
 * Senior Chat Component
 *
 * Landing page with mode selection and chat interface.
 * Features two modes:
 * - Talk: Voice-based interaction using Web Speech API
 * - Type: Text-based interaction
 *
 * @example
 * Navigate to /senior/chat to access this page
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { callSupabaseFunctionStreaming } from "@/lib/supabase-functions";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Save, Type as TypeIcon, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { sanitizeChatMessage } from "@/lib/validation/sanitization";
import { checkRateLimit, recordRateLimitedAction, RATE_LIMITS } from "@/lib/validation/rate-limiting";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const SeniorChat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") as 'talk' | 'type' | null;
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

  // Voice chat using OpenAI pipeline (Whisper + GPT-4 + TTS)
  const {
    isRecording,
    isProcessing,
    isSpeaking,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useVoiceChat({
    onTranscript: (text) => {
      // Add user message
      const userMessage: Message = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMessage]);
    },
    onResponse: (text) => {
      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Voice Chat Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use authenticated user's ID
  const patientId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ref to track if we should auto-send
  const autoSendRef = useRef(false);

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
        sentiment_score: null,
        mood_detected: null,
        topics_discussed: [],
        safety_concern_detected: false,
      };

      if (checkInId) {
        const { error } = await supabase
          .from("check_ins")
          .update(checkInData)
          .eq("id", checkInId)
          .eq("patient_id", patientId);

        if (error) throw error;
      } else {
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

  useEffect(() => {
    if (messages.length > 1 && messages.length % 5 === 0) {
      void saveCheckIn();
    }
  }, [messages.length]);

  const streamChat = async (userMessage: Message) => {
    try {
      const resp = await callSupabaseFunctionStreaming({
        functionName: "senior-chat",
        body: {
          messages: [...messages, userMessage],
          mode: mode || 'type' // Send the interaction mode to backend
        },
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

    const trimmedInput = input.trim();

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

    const rateLimitCheck = checkRateLimit('chat_message', user.id, RATE_LIMITS.CHAT_MESSAGE);
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limit",
        description: `Too many messages. Please wait ${Math.ceil(rateLimitCheck.resetIn / 1000)} seconds.`,
        variant: "destructive",
      });
      return;
    }

    const sanitizedContent = sanitizeChatMessage(validation.data);
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

  // Auto-send effect for voice mode
  useEffect(() => {
    if (autoSendRef.current && input.trim() && !isLoading) {
      autoSendRef.current = false; // Reset flag
      handleSend();
    }
  }, [input, isLoading]);

  const handleModeSelect = (selectedMode: 'talk' | 'type') => {
    setSearchParams({ mode: selectedMode });
  };

  const handleModeSwitchClick = (selectedMode: 'talk' | 'type') => {
    if (selectedMode !== mode) {
      setSearchParams({ mode: selectedMode });
    }
  };

  // Landing page (no mode selected)
  if (!mode) {
    return (
      <div className="min-h-screen bg-[#C9EBC0] flex flex-col">
        <header className="fixed top-0 left-0 right-0 bg-[#2F4733] z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-heading font-bold text-white">parra</h1>
            <HamburgerMenu />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 pt-32">
          <h1 className="text-[#2F4733] text-5xl md:text-6xl font-bold mb-16 text-center">
            Chat with Parra
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <button
              onClick={() => handleModeSelect('talk')}
              className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center gap-6 hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="w-32 h-32 rounded-full border-4 border-[#2F4733] flex items-center justify-center">
                <Mic className="w-16 h-16 text-[#2F4733]" />
              </div>
              <span className="text-[#2F4733] text-4xl font-semibold">Talk</span>
            </button>

            <button
              onClick={() => handleModeSelect('type')}
              className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center gap-6 hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="w-32 h-32 rounded-full border-4 border-[#2F4733] flex items-center justify-center">
                <TypeIcon className="w-16 h-16 text-[#2F4733]" />
              </div>
              <span className="text-[#2F4733] text-4xl font-semibold">Type</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Chat interface with mode selected
  return (
    <div className="min-h-screen bg-[#C9EBC0] flex flex-col">
      {/* Header with mini mode cards */}
      <header className="fixed top-0 left-0 right-0 bg-[#2F4733] z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-white">parra</h1>

          <div className="flex items-center gap-3">
            {/* Mini mode selector cards */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleModeSwitchClick('talk')}
                className={`bg-white rounded-lg p-2 flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                  mode === 'talk' ? 'ring-2 ring-[#FF8882]' : 'opacity-70 hover:opacity-100'
                }`}
                title="Talk mode"
              >
                <div className={`w-8 h-8 rounded-full border-2 ${mode === 'talk' ? 'border-[#FF8882]' : 'border-[#2F4733]'} flex items-center justify-center`}>
                  <Mic className={`w-4 h-4 ${mode === 'talk' ? 'text-[#FF8882]' : 'text-[#2F4733]'}`} />
                </div>
                <span className="text-[#2F4733] text-sm font-semibold pr-2">Talk</span>
              </button>

              <button
                onClick={() => handleModeSwitchClick('type')}
                className={`bg-white rounded-lg p-2 flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                  mode === 'type' ? 'ring-2 ring-[#FF8882]' : 'opacity-70 hover:opacity-100'
                }`}
                title="Type mode"
              >
                <div className={`w-8 h-8 rounded-full border-2 ${mode === 'type' ? 'border-[#FF8882]' : 'border-[#2F4733]'} flex items-center justify-center`}>
                  <TypeIcon className={`w-4 h-4 ${mode === 'type' ? 'text-[#FF8882]' : 'text-[#2F4733]'}`} />
                </div>
                <span className="text-[#2F4733] text-sm font-semibold pr-2">Type</span>
              </button>
            </div>

            <HamburgerMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24 pb-6 px-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <Card className="bg-white flex-1 flex flex-col shadow-xl">
            {/* Chat Header */}
            <div className="border-b border-[#2F4733]/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-heading font-bold text-[#2F4733] mb-2">
                    Chat with Parra
                  </h2>
                  <p className="text-lg text-[#2F4733]/70">
                    {mode === "talk"
                      ? "🎤 Voice mode - Ready"
                      : "⌨️ Text mode - Type your message"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={saveCheckIn}
                  className="gap-2 border-[#2F4733]"
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
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xl ${
                      message.role === "user"
                        ? "bg-[#2F4733] text-white"
                        : "bg-[#C9EBC0] text-[#2F4733]"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#C9EBC0] rounded-2xl p-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-[#2F4733] rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-[#2F4733] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-3 h-3 bg-[#2F4733] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-[#C9EBC0] rounded-2xl p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2F4733]" />
                    <span className="text-[#2F4733] italic">Processing voice...</span>
                  </div>
                </div>
              )}
              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-[#C9EBC0] rounded-2xl p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2F4733]" />
                    <span className="text-[#2F4733] italic">Parra is speaking...</span>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl p-4 text-xl bg-[#2F4733]/30 text-[#2F4733] italic flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    Recording...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#2F4733]/20 p-6">
              {/* Processing indicator for voice mode */}
              {mode === "talk" && isProcessing && (
                <div className="mb-3 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2F4733]" />
                  <span className="text-[#2F4733] text-lg font-medium">
                    Processing voice...
                  </span>
                </div>
              )}
              {/* Parra speaking indicator */}
              {mode === "talk" && isSpeaking && (
                <div className="mb-3 flex items-center justify-center">
                  <span className="text-[#2F4733] text-xl font-medium flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Parra is speaking...
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                {mode === "talk" && (
                  <Button
                    size="lg"
                    variant="outline"
                    className={`shrink-0 h-14 w-14 border-2 transition-all ${
                      isRecording
                        ? 'border-[#FF8882] bg-[#FF8882] text-white hover:bg-[#FF8882]/90'
                        : 'border-[#2F4733] hover:bg-[#2F4733]/10'
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isProcessing || isSpeaking}
                  >
                    {isRecording ? <MicOff className="h-6 w-6 animate-pulse" /> : <Mic className="h-6 w-6" />}
                  </Button>
                )}
                <Input
                  placeholder={mode === 'talk' ? "Listening... or type here" : "Type your message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  className="flex-1 text-xl h-14 px-6 border-2 border-[#2F4733]/30 focus:border-[#2F4733]"
                  disabled={isLoading}
                />
                <Button
                  size="lg"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="h-14 px-8 bg-[#FF8882] hover:bg-[#FF8882]/90 text-white"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
              {mode === 'talk' && voiceError && (
                <p className="text-sm text-[#FF8882] mt-2">
                  Voice error: {voiceError}. Please try again.
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SeniorChat;
