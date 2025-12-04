"use client";

import { useRef, useCallback } from "react";

export const useDrag = (ref: React.RefObject<HTMLDivElement>) => {
  const offset = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;

    // Prevent text selection globally while dragging
    document.body.style.userSelect = "none";

    offset.current = {
      x: e.clientX - ref.current.offsetLeft,
      y: e.clientY - ref.current.offsetTop,
    };

    const handleDragMove = (e: MouseEvent) => {
      if (!ref.current) return;

      if (frame.current) cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        ref.current!.style.left = `${e.clientX - offset.current.x}px`;
        ref.current!.style.top = `${e.clientY - offset.current.y}px`;
      });
    };

    const handleDragEnd = () => {
      document.body.style.userSelect = ""; // restore
      if (frame.current) cancelAnimationFrame(frame.current);

      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }, []);

  return { handleDragStart };
};
