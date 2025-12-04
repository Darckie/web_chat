"use client"

import { useEffect, useRef } from "react"
import type { Chat } from "../types"
import { MessageBubble } from "./MessageBubble"
import { Loader } from "lucide-react"

interface MessageListProps {
  chat: Chat
}

export const MessageList = ({ chat }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages, chat.isTyping])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#f7ebdfab]">
      {chat.messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center">
          <div className="text-gray-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <>
          {chat.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {chat.isTyping && (
            <div className="flex items-center gap-1 mb-3 text-gray-500">
              <Loader size={14} className="animate-spin" />
              <span className="text-xs">{chat.name} is typing...</span>
            </div>
          )}
          <div ref={endRef} />
        </>
      )}
    </div>
  )
}
