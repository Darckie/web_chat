"use client";

import { useRef, useCallback } from "react";
import { useUIStore } from "../store/uiStore";

export const useResize = (elementRef: React.RefObject<HTMLDivElement>) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);
  const frame = useRef<number | null>(null);

  const { setWidth, setHeight } = useUIStore();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;

    // Disable text selection while resizing
    document.body.style.userSelect = "none";

    startX.current = e.clientX;
    startY.current = e.clientY;
    startWidth.current = elementRef.current.offsetWidth;
    startHeight.current = elementRef.current.offsetHeight;

    const handleMouseMove = (e: MouseEvent) => {
      if (frame.current) cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        const newWidth = Math.max(320, startWidth.current + (e.clientX - startX.current));  
        const newHeight = Math.max(350, startHeight.current + (e.clientY - startY.current));

        setWidth(newWidth);
        setHeight(newHeight);
      });
    };

    const handleMouseUp = () => {
      document.body.style.userSelect = ""; // restore
      if (frame.current) cancelAnimationFrame(frame.current);

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  return { handleMouseDown };
};
