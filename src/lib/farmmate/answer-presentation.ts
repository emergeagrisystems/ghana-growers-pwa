/** Parse provider sections without making agronomic decisions or changing accounting. */
export function displayedAnswerSections(answer: string) {
  const headings = "What I think|What may be happening|What to do now|What to check|Next step|More detail";
  const clean = answer.replace(/^\s*(?:#{1,4}\s*)?\*\*([^*\n]+):\*\*\s*/gm, "$1: ");
  const parts = clean.split(new RegExp(`(?=^(?:${headings}):)`, "im")).filter(v => v.trim());
  const sections = parts.map(paragraph => {
    const match = paragraph.trim().match(new RegExp(`^(${headings}):\\s*([\\s\\S]*)$`, "i"));
    return { title: match?.[1] ?? "", body: (match?.[2] ?? paragraph).trim() };
  });
  const first = sections.find(s => /^(What I think|What may be happening)$/i.test(s.title)) ?? sections[0];
  const actions = sections.find(s => /^What to do now$/i.test(s.title));
  const next = sections.find(s => /^Next step$/i.test(s.title));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const actionLines = Array.from(new Set((actions?.body ?? "").split(/\n+/).map(v => v.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean)))
    .filter(v => norm(v) !== norm(next?.body ?? ""));
  const details = sections.filter(s => s !== first && s !== actions && s !== next);
  if (actionLines.length > 3) details.push({ title: "Additional guidance", body: actionLines.slice(3).join("\n") });
  return { first, actions: actions ? { ...actions, body: actionLines.slice(0, 3).join("\n") } : undefined, actionLines: actionLines.slice(0, 3), next, details };
}
