// Ambient grid overlay reused from design/dashboard_preview.html's backdrop.
// The glow blobs from that file are folded into PAGE_BACKGROUND instead of duplicated here.
export function AmbientBackground() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none opacity-55"
      style={{
        backgroundImage:
          "linear-gradient(rgba(140,160,220,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(140,160,220,0.05) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.3) 70%)",
      }}
    />
  );
}
