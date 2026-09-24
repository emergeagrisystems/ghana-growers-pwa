// Presentation only: do not apply to protocol keys, signed context or identifiers.
export function mamaGPublicText(text: string): string {
  return text.replace(/\bGG FarmMate\b/g, "Ask Mama G").replace(/\bAsk FarmMate\b/g, "Ask Mama G").replace(/\bFarmMate\b/g, "Mama G");
}
