import { cn } from "../../utils/cn";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-white/[0.06] border border-white/[0.08] text-slate-200 hover:bg-white/[0.1] hover:border-white/[0.12] active:bg-white/[0.04]",
  secondary:
    "bg-white/[0.03] border border-white/[0.04] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300",
  danger:
    "bg-rose-500/10 border border-rose-400/15 text-rose-200 hover:bg-rose-500/20 active:bg-rose-500/5",
};

export default function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-6 py-2.5 rounded-xl font-medium transition-all duration-300",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
