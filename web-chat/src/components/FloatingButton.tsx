"use client"

import { MessageCircle } from "lucide-react"
import { useUIStore } from "../store/uiStore"
import { useChatStore } from "../store/chatStore"

export const FloatingButton = () => {
  const { isMinimized, toggleMinimize } = useUIStore()
  
  const { chats, activateChat, activeChats } = useChatStore()

  const handleClick = () => {
    console.log(isMinimized)
    if (isMinimized) {
      toggleMinimize()
    } else if (activeChats.length === 0) {
      activateChat(chats[0].id)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-40 ${isMinimized
          ? "bg-blue-500 hover:bg-blue-600 text-white scale-100"
          : "bg-gray-200 text-gray-600 scale-75 opacity-0 pointer-events-none"
        }`}
    >
      <MessageCircle size={28} />
    </button>
  )
}
