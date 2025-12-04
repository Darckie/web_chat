"use client"
import { ChatWindow } from "./ChatWindow"
import { FloatingButton } from "./FloatingButton"
import { useWebSocket } from "../hooks/useWebSocket"
import { useChatStore } from "../store/chatStore"

export const ChatWidget = () => {
  useWebSocket()
  const { activeChats } = useChatStore()

  return (
    <div className="fixed bottom-0 right-0 pointer-events-none">
      <div className="pointer-events-auto">

        {/* BUTTON ALWAYS VISIBLE */}
        <FloatingButton />

        {/* CHAT WINDOW ONLY IF ACTIVE */}
        {activeChats.length > 0 && <ChatWindow />}

      </div>
    </div>
  )
}
