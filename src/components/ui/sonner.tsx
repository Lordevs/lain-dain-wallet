import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Sonner themed to match the app's own palette (see index.css's CSS
 * variables) — this app only ever renders in light mode, so theme is
 * fixed rather than read from a theme provider.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans! rounded-2xl! shadow-[0px_10px_30px_rgba(0,0,0,0.08)]! border!",
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

          "--error-bg": "#FDF3F3",
          "--error-border": "color-mix(in srgb, var(--tertiary) 25%, transparent)",
          "--error-text": "var(--tertiary)",

          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
