import { getSampleAssistantResponse } from "@/data/smartTools";

export async function createFarmerAssistantReply(question: string) {
  // Future OpenAI integration point:
  // 1. Read OPENAI_API_KEY from server environment variables only.
  // 2. Call OpenAI from this server-side layer or from the API route.
  // 3. Never expose API keys in client components.
  return getSampleAssistantResponse(question);
}
