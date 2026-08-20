type CornerAccentProps = {
  color?: string;
};

// Decorative corner flourish reused from design/dashboard_preview.html's card corners.
export function CornerAccent({ color = "#c99a4b" }: CornerAccentProps) {
  return (
    <svg
      width="46"
      height="20"
      viewBox="0 0 46 20"
      className="absolute pointer-events-none opacity-55"
      style={{ top: 10, right: 12 }}
    >
      <path d="M0 2 L30 2 L44 16 L44 18" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="44" cy="18" r="1.4" fill={color} />
    </svg>
  );
}
