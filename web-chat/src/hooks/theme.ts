import type { Theme } from "../types"

export const theme: Theme = {
  colors: {
    primary: "#0084ff",
    secondary: "#f0f2f5",
    accent: "#31a24c",
    background: "#ffffff",
    foreground: "#050505",
    border: "#e5e7eb",
    muted: "#95989c",
    bubble: {
      self: "#0084ff",
      other: "#e5e7eb",
      textSelf: "#ffffff",
      textOther: "#050505",
    },
  },
  radius: {
    sm: "0.375rem",
    md: "0.75rem",
    lg: "1.5rem",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  },
}
