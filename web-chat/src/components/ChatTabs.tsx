"use client"

import { User2, X } from "lucide-react"
import type { Chat } from "../types"
import { useChatStore } from "../store/chatStore"

interface ChatTabsProps {
  activeChats: string[]
  chats: Chat[]
  onSelectChat: (chatId: string) => void
  selectedChatId: string
}

export const ChatTabs = ({ activeChats, chats, onSelectChat, selectedChatId }: ChatTabsProps) => {
  const { deactivateTab } = useChatStore()

  const activeChatObjects = chats.filter((chat) => activeChats.includes(chat.id))

  return (
    <div className="flex items-center gap-1 bg-gray-50 border-b border-gray-200 overflow-x-auto">
      {activeChatObjects.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`flex items-center gap-2 px-1 py-2 cursor-pointer transition-all duration-200 whitespace-nowrap w-24 min-w-[110px] ${selectedChatId === chat.id
              ? "bg-white border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:bg-white/50"
            }`}
        >
          <User2 />
          <span className="text-xs font-medium truncate max-w-[80px]">{chat.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deactivateTab(chat.id)
            }}
            className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
