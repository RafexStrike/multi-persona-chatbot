"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getPersonaName, type Persona } from "@/lib/personas";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  persona: Persona;
  messages: Message[];
  createdAt: number;
  firstQuestion: string;
}

const STORAGE_KEY = "chat-sessions";

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>("piyush");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  const saveCurrentSession = useCallback(
    (msgs: Message[], currentPersona: Persona) => {
      if (msgs.length === 0) return;

      const firstUserMsg = msgs.find((m) => m.role === "user");
      const firstQuestion = firstUserMsg
        ? firstUserMsg.content.slice(0, 4)
        : "Chat";

      setSessions((prev) => {
        let updated: ChatSession[];
        if (activeSessionId) {
          updated = prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: msgs, persona: currentPersona }
              : s
          );
        } else {
          const newSession: ChatSession = {
            id: Date.now().toString(),
            persona: currentPersona,
            messages: msgs,
            createdAt: Date.now(),
            firstQuestion,
          };
          updated = [newSession, ...prev];
          setActiveSessionId(newSession.id);
        }
        saveSessions(updated);
        return updated;
      });
    },
    [activeSessionId]
  );

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          persona,
          history: messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      saveCurrentSession(finalMessages, persona);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
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
    if (newPersona !== persona) {
      setPersona(newPersona);
      setMessages([]);
      setError(null);
      setInput("");
      setActiveSessionId(null);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
    setActiveSessionId(null);
  };

  const handleLoadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setPersona(session.persona);
    setActiveSessionId(session.id);
    setError(null);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveSessions(updated);
      return updated;
    });
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen bg-[#221D27]">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="border-b border-[#28242E] pb-4">
            <button
              onClick={handleNewChat}
              disabled={isLoading}
              className="w-full bg-[#43162C] hover:bg-[#3B2134] text-[#D3C2AB] p-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + New chat
            </button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Personas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={persona === "piyush" && !activeSessionId}
                      onClick={() => handlePersonaChange("piyush")}
                      disabled={isLoading}
                    >
                      {getPersonaName("piyush")}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={persona === "hitesh" && !activeSessionId}
                      onClick={() => handlePersonaChange("hitesh")}
                      disabled={isLoading}
                    >
                      {getPersonaName("hitesh")}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {sessions.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sessions.map((session) => (
                      <SidebarMenuItem key={session.id}>
                        <SidebarMenuButton
                          isActive={activeSessionId === session.id}
                          onClick={() => handleLoadSession(session)}
                          className="group flex items-center justify-between w-full"
                        >
                          <span className="truncate">
                            {session.firstQuestion}
                          </span>
                          <span className="text-[10px] text-[#D3C2AB]/40 ml-2">
                            {getPersonaName(session.persona).split(" ")[0]}
                          </span>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="ml-1 opacity-0 group-hover:opacity-100 text-[#D3C2AB]/40 hover:text-[#D3C2AB] transition-opacity text-xs"
                          >
                            ×
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="text-xs text-[#D3C2AB]/40">
            AI Chat v1.0
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b border-[#28242E] bg-[#140E12] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-[#D3C2AB]">Persona</h1>
            </div>
            <div className="bg-[#3B2134] text-[#D3C2AB] px-3 py-1 rounded-full text-sm font-medium">
              {getPersonaName(persona)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-full text-[#D3C2AB]/60 text-center">
                <div>
                  <p className="text-xl">How can I help you today?</p>
                  <p className="text-sm mt-2 text-[#D3C2AB]/40">
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
                        ? "bg-[#3B2134] text-[#D3C2AB] rounded-br-sm"
                        : "bg-[#28242E] text-[#D3C2AB] rounded-bl-sm"
                    }`}
                    style={{ animation: "slideIn 0.3s ease-out" }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#28242E] text-[#D3C2AB]/60 p-4 rounded-xl rounded-bl-sm italic">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-[#3B2134] rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-[#3B2134] rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-[#3B2134] rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
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

          <div className="border-t border-[#28242E] bg-[#140E12] p-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 p-4 rounded-xl border border-[#28242E] bg-[#28242E] text-[#D3C2AB] placeholder-[#D3C2AB]/40 resize-none max-h-[100px] transition-all focus:outline-none focus:border-[#3B2134] focus:ring-2 focus:ring-[#3B2134]/20"
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#3B2134] hover:bg-[#43162C] text-[#D3C2AB] px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
