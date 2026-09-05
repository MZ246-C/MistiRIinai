import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";

const fieldBase =
  "w-full rounded-xl border border-booth-plum-200/70 bg-white/70 px-3.5 py-2.5 text-sm text-booth-ink placeholder:text-booth-ink/40 transition-colors focus:border-booth-plum-400 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-booth-paper dark:placeholder:text-booth-paper/30 dark:focus:bg-white/10";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, error, className, id, ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-booth-ink/70 dark:text-booth-paper/70">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3 text-booth-ink/40 dark:text-booth-paper/40">{icon}</span>}
        <input
          ref={ref}
          id={id}
          className={clsx(fieldBase, icon && "pl-9", className)}
          {...props}
        />
      </span>
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, className, ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-booth-ink/70 dark:text-booth-paper/70">
          {label}
        </span>
      )}
      <textarea ref={ref} className={clsx(fieldBase, "min-h-[96px] resize-y", className)} {...props} />
    </label>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, className, children, ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-booth-ink/70 dark:text-booth-paper/70">
          {label}
        </span>
      )}
      <select ref={ref} className={clsx(fieldBase, "cursor-pointer", className)} {...props}>
        {children}
      </select>
    </label>
  );
});
