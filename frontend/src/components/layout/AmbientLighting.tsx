export default function AmbientLighting() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top-right warm orb */}
      <div
        className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full animate-drift"
        style={{
          background: "radial-gradient(circle, rgba(141,200,176,0.18) 0%, rgba(141,200,176,0.06) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Bottom-left cool orb */}
      <div
        className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(173,156,213,0.15) 0%, rgba(173,156,213,0.05) 40%, transparent 70%)",
          filter: "blur(80px)",
          animation: "drift 30s ease-in-out 10s infinite",
        }}
      />
      {/* Center subtle warm glow */}
      <div
        className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(253,239,242,0.12) 0%, transparent 60%)",
          filter: "blur(100px)",
          animation: "drift 35s ease-in-out 20s infinite",
        }}
      />
    </div>
  );
}
