/**
 * Public display name for a reviewer: first name and last initial
 * ("Ngozi Eze" → "Ngozi E."). Reviewers type their full name so staff can
 * recognise them, but the website shows only this shorter form.
 */
export function reviewerDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Anonymous";
  const [first, ...rest] = parts;
  const last = rest.at(-1);
  return last ? `${first} ${last[0]!.toUpperCase()}.` : first!;
}
