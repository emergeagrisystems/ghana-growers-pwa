// Browser memory only. A full reload or a different tab cannot retrieve a draft.
// The random receipt identifies one navigation and contains no question text.
export const HOME_DRAFT_LIMIT = 500;
const lifetime = 60_000;
let pending: { receipt: string; question: string; expires: number } | undefined;

export function prepareHomeDraft(question: string) {
  const text = question.trim();
  if (!text || text.length > HOME_DRAFT_LIMIT) throw new Error("Enter a question of up to 500 characters.");
  const receipt = crypto.randomUUID();
  pending = { receipt, question: text, expires: Date.now() + lifetime };
  return receipt;
}

export function takeHomeDraft(receipt: string | null) {
  const draft = pending;
  pending = undefined;
  return draft && draft.receipt === receipt && Date.now() < draft.expires ? draft.question : "";
}
