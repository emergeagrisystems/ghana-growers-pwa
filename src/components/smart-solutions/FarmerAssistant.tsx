"use client";

import { Bot, Send, UserRound } from "lucide-react";
import { useState } from "react";
import { assistantSuggestions, getSampleAssistantResponse } from "@/data/smartTools";

type Message = {
  role: "assistant" | "farmer";
  text: string;
};

export function FarmerAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello. Ask about farming tips, crop diseases, market access, storage, fertilizer use, or buyer connections."
    }
  ]);

  function ask(nextQuestion: string) {
    const trimmed = nextQuestion.trim();

    if (!trimmed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "farmer", text: trimmed },
      { role: "assistant", text: getSampleAssistantResponse(trimmed) }
    ]);
    setQuestion("");
  }

  return (
    <section className="rounded-md border border-leaf-900/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-black uppercase text-earth-700">AI Farmer Assistant</p>
      <h2 className="mt-2 text-2xl font-black text-ink">Ask practical farming questions</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Sample chatbot UI prepared for a future OpenAI API integration. Keep API keys server-side only.
      </p>

      <div className="mt-5 max-h-96 overflow-y-auto rounded-md bg-leaf-50 p-4">
        <div className="grid gap-3">
          {messages.map((message, index) => {
            const isFarmer = message.role === "farmer";
            const Icon = isFarmer ? UserRound : Bot;
            return (
              <div key={`${message.role}-${index}`} className={`flex gap-3 ${isFarmer ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-md p-3 ${isFarmer ? "bg-leaf-600 text-white" : "bg-white text-ink"}`}>
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase opacity-75">
                    <Icon size={15} aria-hidden="true" />
                    {isFarmer ? "Farmer" : "Assistant"}
                  </div>
                  <p className="text-sm leading-6">{message.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {assistantSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => ask(suggestion)}
            className="focus-ring rounded-md bg-earth-50 px-3 py-2 text-xs font-bold text-ink hover:bg-earth-500"
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
          className="focus-ring min-h-12 flex-1 rounded-md border border-leaf-900/15 px-3 py-3"
          placeholder="Ask a farming question..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-leaf-600 px-5 py-3 text-sm font-black text-white hover:bg-leaf-700">
          <Send size={17} aria-hidden="true" />
          Ask
        </button>
      </form>
    </section>
  );
}
