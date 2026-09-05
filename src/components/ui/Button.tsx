import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const VARIANTS: Record<string, string> = {
  primary:
    "bg-booth-plum-600 text-booth-ivory hover:bg-booth-plum-700 shadow-soft dark:bg-booth-gold-500 dark:text-booth-night dark:hover:bg-booth-gold-400",
  secondary:
    "bg-white/70 text-booth-plum-700 border border-booth-plum-200 hover:bg-white dark:bg-white/5 dark:text-booth-paper dark:border-white/10 dark:hover:bg-white/10",
  ghost: "bg-transparent text-booth-plum-600 hover:bg-booth-plum-50 dark:text-booth-paper/80 dark:hover:bg-white/5",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const SIZES: Record<string, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3 rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
});
