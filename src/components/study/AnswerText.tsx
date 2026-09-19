/** Renders a card answer, supporting several lines and bullet points. */
export function AnswerText({ text, className }: { text: string; className?: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bulleted = lines.length > 1 && lines.every((l) => /^([-*•]|\d+[.)])\s+/.test(l));

  if (bulleted) {
    return (
      <ul className={`flex list-disc flex-col gap-2 pl-6 ${className ?? ""}`}>
        {lines.map((line, i) => (
          <li key={i}>{line.replace(/^([-*•]|\d+[.)])\s+/, "")}</li>
        ))}
      </ul>
    );
  }

  if (lines.length > 1) {
    return (
      <span className={`flex flex-col gap-2 ${className ?? ""}`}>
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}
