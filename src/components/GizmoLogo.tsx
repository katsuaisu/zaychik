export function GizmoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden="true">
        <path
          d="M12 2.5l2.9 5.9 6.6.95-4.75 4.63 1.12 6.52L12 17.4l-5.87 3.1 1.12-6.52L2.5 9.35l6.6-.95L12 2.5z"
          fill="#FCD34D"
          stroke="#111827"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight text-foreground">Gizmo</span>
    </div>
  );
}
