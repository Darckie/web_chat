import { create } from "zustand"
import type { Theme } from "../types"
import { theme as defaultTheme } from "../theme"

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: defaultTheme,
  setTheme: (theme) => set({ theme }),
}))
