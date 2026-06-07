export type FarmerAssistantMessage = {
  role: "assistant" | "farmer";
  text: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const farmerAssistantInstructions = [
  "You are the Ghana Growers AI Farmer Assistant for farmers, buyers, and agricultural suppliers in Ghana.",
  "Give practical, simple agricultural and market guidance grounded in Ghanaian farming context.",
  "Use clear steps, short paragraphs, and everyday language.",
  "Ask follow-up questions when location, crop stage, season, soil condition, pest symptoms, volume, or buyer needs are unclear.",
  "Do not pretend to diagnose crop disease with certainty.",
  "For crop disease, pest, or nutrient issues, recommend clear photos through the Crop Health Check tool or confirmation from a qualified agricultural extension officer.",
  "For chemical, pesticide, fertilizer, finance, buyer, storage, or market decisions, explain what to check before acting.",
  "Never claim to replace a qualified agricultural extension officer.",
  "Include this exact disclaimer at the end of every answer: This assistant provides general agricultural guidance only. Confirm important decisions with a qualified agricultural extension officer."
].join("\n");

function getOpenAIApiKey() {
  return process.env.OPENAI_API_KEY?.trim();
}

function toOpenAIInput(messages: FarmerAssistantMessage[], question: string) {
  const recentMessages = messages.slice(-8).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.text
  }));

  return [
    ...recentMessages,
    {
      role: "user",
      content: question
    }
  ];
}

function extractResponseText(data: OpenAIResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const nestedText = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n\n")
    .trim();

  return nestedText || "";
}

export async function createFarmerAssistantReply(question: string, messages: FarmerAssistantMessage[] = []) {
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: farmerAssistantInstructions,
      input: toOpenAIInput(messages, question),
      max_output_tokens: 700
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error("OpenAI assistant request failed.");
  }

  const answer = extractResponseText((await response.json()) as OpenAIResponse);

  if (!answer) {
    throw new Error("OpenAI assistant returned an empty response.");
  }

  return answer;
}
