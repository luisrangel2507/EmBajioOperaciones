export function CubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M24 4 43 15v18L24 44 5 33V15Z" />
      <path d="M24 4v18M24 22 5 15M24 22l19-7M24 22v22" strokeLinecap="round" />
    </svg>
  );
}
