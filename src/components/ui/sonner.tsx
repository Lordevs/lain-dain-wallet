import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, AlertTriangle, Bell } from "lucide-react"

/**
 * Sonner themed to match the app's own palette (see index.css's CSS
 * variables) — this app only ever renders in light mode, so theme is
 * fixed rather than read from a theme provider.
 *
 * Radius/border/shadow are driven entirely through sonner's own CSS-var
 * API (the `--*` custom properties below), not Tailwind utility classes —
 * a `rounded-2xl!`/`border!` combo used to fight these same properties for
 * control of the toast's shape, so there is deliberately only one source
 * of truth here now.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      richColors
      icons={{
        success: <CheckCircle2 size={20} strokeWidth={2.2} />,
        error: <AlertTriangle size={20} strokeWidth={2.2} />,
        info: <Bell size={20} strokeWidth={2.2} />,
      }}
      toastOptions={{
        classNames: {
          toast: "font-sans! shadow-[0px_4.88px_24.38px_rgba(0,0,0,0.06)]!",
          title: "font-bold!",
          description: "font-normal!",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-border": "var(--border-card)",
          "--normal-text": "var(--foreground)",

          "--success-bg": "var(--positive-soft-bg)",
          "--success-border": "color-mix(in srgb, var(--positive) 20%, transparent)",
          "--success-text": "var(--positive)",

          "--error-bg": "color-mix(in srgb, var(--destructive) 12%, var(--card))",
          "--error-border": "color-mix(in srgb, var(--destructive) 25%, transparent)",
          "--error-text": "var(--destructive)",

          "--info-bg": "var(--card)",
          "--info-border": "var(--border-card)",
          "--info-text": "var(--foreground)",

          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
