"use client";

import { useRef, useEffect, useState } from "react";
import { getPersonaName, type Persona } from "@/lib/personas";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>("piyush");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Show loading state
    setIsLoading(true);

    console.info("[chat page] sending message", { message: input.trim(), persona });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          persona: persona,
          history: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[chat page] API response error", { status: response.status, errorData });
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.info("[chat page] received reply", data.reply);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePersonaChange = (newPersona: Persona) => {
    // Only reset if persona is actually changing
    if (newPersona !== persona) {
      setPersona(newPersona);
      setMessages([]);
      setError(null);
      setInput("");
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4">
        <button
          onClick={() => {
            setMessages([]);
            setError(null);
            setInput("");
          }}
          disabled={isLoading}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + New chat
        </button>

        <div>
          <h4 className="text-slate-400 text-sm font-medium mb-2">Personas</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handlePersonaChange("piyush")}
              disabled={isLoading}
              className={`text-left p-2 rounded-lg border transition-colors ${
                persona === "piyush"
                  ? "bg-slate-800 border-slate-700"
                  : "border-slate-800 hover:bg-slate-800/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getPersonaName("piyush")}
            </button>
            <button
              onClick={() => handlePersonaChange("hitesh")}
              disabled={isLoading}
              className={`text-left p-2 rounded-lg border transition-colors ${
                persona === "hitesh"
                  ? "bg-slate-800 border-slate-700"
                  : "border-slate-800 hover:bg-slate-800/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getPersonaName("hitesh")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-white">Persona</h1>
          <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
            {getPersonaName(persona)}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-slate-400 text-center">
              <div>
                <p className="text-xl"></p>
                <p className="text-sm mt-2 text-slate-500">
                  Ask me anything about coding...
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-xl ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-100 rounded-bl-sm"
                  }`}
                  style={{ animation: "slideIn 0.3s ease-out" }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 p-4 rounded-xl rounded-bl-sm italic">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/50 text-red-300 p-4 rounded-xl border-l-4 border-red-500">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800 bg-slate-900 p-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 p-4 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-400 resize-none max-h-[100px] transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
