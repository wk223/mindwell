import { cn } from "../../utils/cn";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "echo";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export default function NightButton({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  type = "button",
}: Props) {
  const base = cn(
    "group relative overflow-hidden font-medium tracking-wide transition-all duration-500 select-none",
    "disabled:opacity-30 disabled:cursor-not-allowed",
  );

  const variants: Record<string, string> = {
    echo: cn(
      "h-[60px] px-10 rounded-full text-[15px]",
      "night-glass animate-night-glow-pulse",
      "hover:-translate-y-0.5",
      "active:scale-[0.97]",
    ),
    primary: cn(
      "h-[52px] px-7 rounded-[26px] text-[15px]",
      "bg-gradient-to-r from-sky-500 to-indigo-500 text-white",
      "shadow-[0_8px_30px_rgba(56,189,248,0.25)]",
      "hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(56,189,248,0.45),0_12px_40px_rgba(56,189,248,0.25)]",
      "active:scale-[0.97]",
    ),
    secondary: cn(
      "h-[44px] px-6 rounded-[22px] text-[13px]",
      "night-glass text-slate-300",
      "hover:bg-white/8 hover:text-white",
      "active:bg-white/10",
    ),
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[variant], className)}
    >
      {/* Glow sweep line for echo variant */}
      {variant === "echo" && (
        <span
          className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/8 to-transparent pointer-events-none"
          style={{ animation: "night-glow-wave 2.5s ease-in-out infinite" }}
        />
      )}
      {/* Ripple on click */}
      <span className="absolute inset-0 rounded-inherit pointer-events-none overflow-hidden">
        <span className="absolute inset-0 bg-white/15 rounded-full scale-0 group-active:animate-night-ripple" />
      </span>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
