// import { create } from "zustand"
// import type { UIState } from "../types"

// interface UIStore extends UIState {
//   minimize: () => void
//   toggleMinimize: () => void
//   maximize: () => void
//   setWidth: (width: number) => void
//   setHeight: (height: number) => void
//   setPosition: (x: number, y: number) => void
// }

// export const useUIStore = create<UIStore>((set) => ({
//   isMinimized: true,
//   isMaximized: false,
//   width: 340,
//   height: 500,
//   position: { x: 0, y: 0 },

//   minimize: () => set({ isMinimized: true }),
//   maximize: () =>
//     set((state) => ({ isMaximized: !state.isMaximized })),
//   // NEW → this correctly toggles
//   toggleMinimize: () =>
//     set((state) => ({ isMinimized: !state.isMinimized })),
//   setWidth: (width) => set({ width }),
//   setHeight: (height) => set({ height }),
//   setPosition: (x, y) => set({ position: { x, y } }),
// }))

import { create } from "zustand"
import type { UIState } from "../types"

interface UIStore extends UIState {
  minimize: () => void
  open: () => void
  toggleMinimize: () => void
  maximize: () => void
  setWidth: (width: number) => void
  setHeight: (height: number) => void
  setPosition: (x: number, y: number) => void
  // optional: save previous size when maximizing
  prevSize?: { width: number; height: number } | null
  setPrevSize: (size: { width: number; height: number } | null) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  isMinimized: false,
  isMaximized: false,
  width: 350,
  height: 510,
  position: { x: 0, y: 0 },

  prevSize: null,
  setPrevSize: (size) => set({ prevSize: size }),

  // hide window (minimized)
  minimize: () => set({ isMinimized: true }),

  // open window
  open: () => set({ isMinimized: false }),

  // toggle minimize / open
  toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),

  // maximize toggles and preserves previous size
  maximize: () =>
    set((s) => {
      if (!s.isMaximized) {
        // save current size and maximize to viewport-ish
        const vw = typeof window !== "undefined" ? window.innerWidth : 1024
        const vh = typeof window !== "undefined" ? window.innerHeight : 768
        const maxW = Math.min(vw - 40, vw * 0.9)
        const maxH = Math.min(vh - 40, vh * 0.9)
        return {
          isMaximized: true,
          prevSize: { width: s.width, height: s.height },
          width: Math.round(maxW),
          height: Math.round(maxH),
        }
      } else {
        // restore
        const prev = s.prevSize ?? { width: 350, height: 500 }
        return { isMaximized: false, width: prev.width, height: prev.height, prevSize: null }
      }
    }),

  setWidth: (width) => set({ width }),
  setHeight: (height) => set({ height }),
  setPosition: (x, y) => set({ position: { x, y } }),
}))
