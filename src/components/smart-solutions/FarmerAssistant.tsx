"use client";

import { AlertTriangle, Bot, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { assistantSuggestions } from "@/data/smartTools";

const messageLimit = 800;

type Message = {
  role: "assistant" | "farmer";
  text: string;
};

const disclaimer = "This assistant provides general agricultural guidance only. Confirm important decisions with a qualified agricultural extension officer.";

function getAssistantSessionId() {
  if (typeof window === "undefined") {
    return "server-rendered";
  }

  const storageKey = "ghana-growers-assistant-session";
  const existing = window.localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

export function FarmerAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();

    if (!trimmed || isLoading) {
      return;
    }

    if (trimmed.length > messageLimit) {
      setErrorMessage(`Please keep your question under ${messageLimit} characters so the assistant can respond clearly.`);
      return;
    }

    const conversation = messages;
    setMessages((current) => [...current, { role: "farmer", text: trimmed }]);
    setQuestion("");
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/farmer-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, messages: conversation, sessionId: getAssistantSessionId() })
      });
      const data = (await response.json().catch(() => ({}))) as { answer?: string; error?: string };
      const answer = data.answer;

      if (!response.ok || !answer) {
        setErrorMessage(data.error || "The Farm Help Assistant is temporarily unavailable. Please try again.");
        throw new Error("Assistant request failed");
      }

      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch {
      setErrorMessage((current) => current || "The Farm Help Assistant is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="assistant" className="scroll-mt-28 rounded-md border border-leaf-900/10 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black text-ink">Ask Farm Assistant</h2>
      <p className="mt-2 text-base leading-7 text-ink/65">Ask a farming question.</p>

      {messages.length > 0 || isLoading ? (
        <div className="mt-5 max-h-80 overflow-y-auto rounded-md bg-leaf-50 p-4">
          <div className="grid gap-3">
            {messages.map((message, index) => {
              const isFarmer = message.role === "farmer";
              const Icon = isFarmer ? UserRound : Bot;
              return (
                <div key={`${message.role}-${index}`} className={`flex gap-3 ${isFarmer ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-md p-3 ${isFarmer ? "bg-leaf-700 text-white" : "bg-white text-ink"}`}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase opacity-75">
                      <Icon size={15} aria-hidden="true" />
                      {isFarmer ? "Farmer" : "Assistant"}
                    </div>
                    <p className="text-sm leading-6">{message.text}</p>
                  </div>
                </div>
              );
            })}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-md bg-white p-3 text-ink">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase opacity-75">
                    <Bot size={15} aria-hidden="true" />
                    Assistant
                  </div>
                  <p className="text-sm leading-6">Thinking...</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 flex gap-2 rounded-md bg-tomato/10 p-3 text-sm font-bold leading-6 text-tomato">
          <AlertTriangle className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {assistantSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isLoading}
            onClick={() => ask(suggestion)}
            className="focus-ring rounded-md bg-earth-50 px-3 py-2 text-xs font-bold text-ink hover:bg-earth-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <input
          className="gg-field min-h-12 flex-1"
          placeholder="Ask a farming question..."
          value={question}
          maxLength={messageLimit}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="gg-button-primary gap-2"
        >
          <Send size={17} aria-hidden="true" />
          {isLoading ? "Thinking..." : "Ask"}
        </button>
      </form>
      <p className="mt-3 text-xs font-semibold leading-5 text-ink/55">{disclaimer}</p>
    </section>
  );
}
