import { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]",
          "text-slate-200 placeholder:text-slate-600",
          "focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.06]",
          "transition-all duration-300 text-sm",
          error && "border-rose-400/30 focus:border-rose-400/50",
          className
        )}
        {...props}
      />
      {error && <p className="text-rose-300 text-sm mt-1.5">{error}</p>}
    </div>
  );
}
