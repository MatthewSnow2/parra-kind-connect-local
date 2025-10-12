import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  sender: "senior" | "ai";
  timestamp: string;
}

const ChatInterface = () => {
  const [messages] = useState<Message[]>([
    {
      id: 1,
      text: "Good morning! How are you feeling today?",
      sender: "ai",
      timestamp: "9:00 AM"
    },
    {
      id: 2,
      text: "I'm feeling good, had a nice walk this morning 😊",
      sender: "senior",
      timestamp: "9:05 AM"
    },
    {
      id: 3,
      text: "That's wonderful! Did you remember to take your morning medication?",
      sender: "ai",
      timestamp: "9:06 AM"
    },
    {
      id: 4,
      text: "Yes, I took it with breakfast",
      sender: "senior",
      timestamp: "9:10 AM"
    }
  ]);

  const quickReplies = [
    "I'm feeling good",
    "I need help",
    "Took my medication",
    "Going for a walk"
  ];

  return (
    <Card className="p-6 bg-card">
      <h2
        id="chat-heading"
        className="text-2xl font-heading font-bold mb-4 text-foreground"
      >
        Daily Check-In Chat
      </h2>

      {/* Messages */}
      <div
        className="space-y-4 mb-6 max-h-96 overflow-y-auto"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "senior" ? "justify-start" : "justify-end"}`}
            role="article"
            aria-label={`Message from ${message.sender === "senior" ? "senior" : "AI assistant"} at ${message.timestamp}`}
          >
            <div className="max-w-[80%]">
              <div
                className="rounded-lg p-4 text-lg"
                style={{
                  backgroundColor: message.sender === "senior" ? "hsl(var(--chat-senior))" : "hsl(var(--chat-ai))",
                  color: "hsl(var(--chat-text))"
                }}
              >
                {message.text}
              </div>
              <p className="text-xs text-muted-foreground mt-1 px-1">
                <time dateTime={message.timestamp}>{message.timestamp}</time>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reply Buttons */}
      <div className="mb-4" role="group" aria-labelledby="quick-replies-label">
        <p id="quick-replies-label" className="text-sm text-muted-foreground mb-2">
          Quick replies:
        </p>
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((reply, index) => (
            <Button
              key={index}
              size="sm"
              className="text-base"
              style={{
                backgroundColor: "hsl(var(--chat-quick-reply-bg))",
                color: "hsl(var(--chat-quick-reply-text))"
              }}
              aria-label={`Quick reply: ${reply}`}
            >
              {reply}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        className="flex gap-2"
        role="search"
        aria-labelledby="chat-heading"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="chat-message-input" className="sr-only">
          Type your message
        </label>
        <Input
          id="chat-message-input"
          placeholder="Type your message..."
          className="flex-1 text-lg"
          style={{ minHeight: "48px" }}
          aria-label="Message input"
          aria-required="true"
        />
        <Button
          size="lg"
          type="submit"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </Card>
  );
};

export default ChatInterface;
