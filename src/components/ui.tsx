import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center rounded-xl px-4 py-2 font-semibold text-white transition-colors duration-200 ease-in-out ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;
export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500 ${className}`}
      {...props}
    />
  );
}

export type CardProps = HTMLAttributes<HTMLDivElement>;
export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`min-w-0 rounded-3xl p-6 shadow-xl ring-1 ring-white/10 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }: CardProps) {
  return (
    <h2 className={`text-2xl font-bold ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement>;
export function Badge({ children, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 p-5 text-center">
      <p className="font-bold text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
