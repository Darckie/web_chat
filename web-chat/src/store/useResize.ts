"use client"

import type React from "react"

import { useRef, useCallback } from "react"
import { useUIStore } from "../store/uiStore"

export const useResize = (elementRef: React.RefObject<HTMLDivElement>) => {
  const startX = useRef(0)
  const startY = useRef(0)
  const startWidth = useRef(0)
  const startHeight = useRef(0)
  const { setWidth, setHeight } = useUIStore()

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // IMPORTANT: Only allow resize from bottom-right corner
      const target = e.target as HTMLElement
      if (!target.classList.contains("resize-handle")) return

      e.stopPropagation() // <— prevents interfering with DRAG

      if (!elementRef.current) return

      startX.current = e.clientX
      startY.current = e.clientY
      startWidth.current = elementRef.current.offsetWidth
      startHeight.current = elementRef.current.offsetHeight

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX.current
        const deltaY = e.clientY - startY.current

        setWidth(Math.max(300, startWidth.current + deltaX))
        setHeight(Math.max(300, startHeight.current + deltaY))
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [elementRef, setWidth, setHeight],
  )

  return { handleMouseDown }
}
