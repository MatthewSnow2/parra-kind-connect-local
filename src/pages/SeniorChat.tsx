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
  // QA: UI/UX fix 2025-10-15 - Default to 'type' mode to remove landing page per design spec
  const modeParam = searchParams.get("mode") as 'talk' | 'type' | null;
  const mode = modeParam || 'type'; // Default to type mode if no mode specified
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

  // QA: UI/UX REDESIGN 2025-10-15 - Redesigned to match ChatGPT voice interface with dark background and reactive orb
  // Chat interface renders immediately with default mode
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with mini mode cards */}
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-50 px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-heading font-bold text-white">parra</h1>

          <div className="flex items-center gap-3">
            {/* Mini mode selector cards */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleModeSwitchClick('talk')}
                className={`bg-white/10 backdrop-blur rounded-lg p-2 flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                  mode === 'talk' ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                }`}
                title="Talk mode"
              >
                <div className={`w-8 h-8 rounded-full border-2 ${mode === 'talk' ? 'border-white' : 'border-white/50'} flex items-center justify-center`}>
                  <Mic className={`w-4 h-4 ${mode === 'talk' ? 'text-white' : 'text-white/70'}`} />
                </div>
                <span className="text-white text-sm font-semibold pr-2">Talk</span>
              </button>

              <button
                onClick={() => handleModeSwitchClick('type')}
                className={`bg-white/10 backdrop-blur rounded-lg p-2 flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                  mode === 'type' ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                }`}
                title="Type mode"
              >
                <div className={`w-8 h-8 rounded-full border-2 ${mode === 'type' ? 'border-white' : 'border-white/50'} flex items-center justify-center`}>
                  <TypeIcon className={`w-4 h-4 ${mode === 'type' ? 'text-white' : 'text-white/70'}`} />
                </div>
                <span className="text-white text-sm font-semibold pr-2">Type</span>
              </button>
            </div>

            <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* QA: UI/UX REDESIGN 2025-10-15 - Replaced card-based chat with ChatGPT-style centered orb interface */}
      <main className="flex-1 pt-24 pb-6 px-6 flex items-center justify-center">
        <div className="w-full h-full flex flex-col">
          {/* Reactive Orb Container */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Animated reactive orb - scales and glows when active */}
              <div
                className={`
                  w-64 h-64 rounded-full relative
                  transition-all duration-500 ease-out
                  ${isRecording || isSpeaking ? 'scale-110 animate-pulse' : 'scale-100'}
                `}
                style={{
                  background: isRecording
                    ? 'radial-gradient(circle, rgba(255,136,130,1) 0%, rgba(255,136,130,0.6) 50%, rgba(255,136,130,0.2) 100%)'
                    : isSpeaking
                    ? 'radial-gradient(circle, rgba(100,200,255,1) 0%, rgba(70,150,255,0.6) 50%, rgba(50,100,200,0.2) 100%)'
                    : 'radial-gradient(circle, rgba(100,200,255,1) 0%, rgba(70,150,255,0.6) 50%, rgba(50,100,200,0.2) 100%)',
                  boxShadow: isRecording
                    ? '0 0 80px rgba(255,136,130,0.8), 0 0 120px rgba(255,136,130,0.4)'
                    : isSpeaking
                    ? '0 0 80px rgba(100,200,255,0.8), 0 0 120px rgba(100,200,255,0.4)'
                    : '0 0 40px rgba(100,200,255,0.5)',
                }}
              >
                {/* Pulsing rings for active states */}
                {(isRecording || isSpeaking) && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                    <div
                      className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"
                      style={{ animationDuration: '3s', animationDelay: '0.5s' }}
                    />
                  </>
                )}

                {/* Status text overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xl font-medium">
                    {isRecording && 'Listening...'}
                    {isSpeaking && 'Speaking...'}
                    {isProcessing && 'Processing...'}
                    {!isRecording && !isSpeaking && !isProcessing && mode === 'talk' && 'Tap to speak'}
                    {!isRecording && !isSpeaking && !isProcessing && mode === 'type' && 'Type below'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Latest message display - minimal */}
          {messages.length > 0 && (
            <div className="text-center mb-8 px-4">
              <p className="text-white/80 text-lg max-w-2xl mx-auto line-clamp-3">
                {messages[messages.length - 1].content}
              </p>
            </div>
          )}

          {/* Bottom Controls - Minimalist ChatGPT style */}
          <div className="w-full max-w-2xl mx-auto">
            {mode === "talk" ? (
              /* Voice Mode Controls */
              <div className="flex justify-center items-center gap-4 pb-8">
                <Button
                  size="lg"
                  className={`
                    h-20 w-20 rounded-full border-2 transition-all duration-300
                    ${isRecording
                      ? 'bg-red-500 border-red-400 hover:bg-red-600 scale-110'
                      : 'bg-white/10 border-white/30 hover:bg-white/20 backdrop-blur'
                    }
                  `}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isProcessing || isSpeaking}
                >
                  {isRecording ? (
                    <MicOff className="h-10 w-10 text-white animate-pulse" />
                  ) : (
                    <Mic className="h-10 w-10 text-white" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveCheckIn}
                  disabled={messages.length <= 1}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save
                </Button>
              </div>
            ) : (
              /* Type Mode Controls */
              <div className="flex gap-3 pb-8">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  className="flex-1 text-xl h-14 px-6 bg-white/10 border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/50 backdrop-blur"
                  disabled={isLoading}
                />
                <Button
                  size="lg"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="h-14 px-8 bg-white/20 hover:bg-white/30 text-white backdrop-blur border border-white/30"
                >
                  <Send className="h-6 w-6" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveCheckIn}
                  disabled={messages.length <= 1}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Error display */}
            {mode === 'talk' && voiceError && (
              <p className="text-sm text-red-400 text-center pb-4">
                Voice error: {voiceError}. Please try again.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeniorChat;
