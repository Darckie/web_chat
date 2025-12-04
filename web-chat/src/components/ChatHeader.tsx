"use client"

import { X, MoreVertical, Phone, Video, User } from "lucide-react"
import type { Chat } from "../types/index"

interface ChatHeaderProps {
  chat: Chat
  onClose: () => void
}

export const ChatHeader = ({ chat, onClose }: ChatHeaderProps) => {
  const getStatusColor = (status: string) => {
    return status === "online" ? "bg-green-500" : "bg-gray-400"
  }

  const formatLastSeen = (lastSeen?: number) => {
    if (!lastSeen) return ""
    const now = Date.now()
    const diff = now - lastSeen
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Active now"
    if (minutes < 60) return `Active ${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Active ${hours}h ago`
    return "Offline"
  }

  return (
    <div className="flex items-center justify-between p-1 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2.5 flex-1">
        <div className="relative">
        <User/>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
              chat.status,
            )}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{chat.name}</h3>
          <p className="text-xs text-gray-600">
            {chat.status === "online" ? "Active now" : formatLastSeen(chat.lastSeen)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <Phone size={18} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <Video size={18} />
        </button> */}
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <MoreVertical size={18} />
        </button>
        {/* <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <X size={18} />
        </button> */}
      </div>
    </div>
  )
}
