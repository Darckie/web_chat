import type { Message } from "../types"
import { Check, CheckCheck, AlertCircle, FileIcon } from "lucide-react"
import { Loader } from "lucide-react"

interface MessageBubbleProps {
  message: Message
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const renderFile = () => {
    if (!message.fileUrl) return null

    if (message.type === "image") {
      return (
        <img
          src={message.fileUrl}
          alt="Sent file"
          className="rounded-lg max-h-64 object-cover mb-2"
        />
      )
    }

    return (
      <a
        href={message.fileUrl}
        target="_blank"
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border mt-1 hover:bg-gray-100"
      >
        <FileIcon size={18} />
        <span className="text-sm font-medium">
          {message.fileName || "Download File"}
        </span>
      </a>
    )
  }

  const renderStatusIcon = () => {
    if (!message.isOwn) return null

    switch (message.status) {
      case "read":
        return <CheckCheck size={14} className="text-blue-300" />

      case "delivered":
        return <CheckCheck size={14} />

      case "sent":
        return <Check size={14} />

      case "pending":
        return (
          <Loader
            size={14}
            className="animate-spin text-gray-300"
          />

        )

      case "unknown":
        return <Check size={14} className="opacity-30" />

      case "failed":
        return <AlertCircle size={14} className="text-red-500" />

      default:
        return <Check size={14} className="opacity-20" />
    }
  }

  return (
    <div className={`flex w-full min-w-[70%] mb-3 ${message.isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-1.5 max-w-full ${message.isOwn ? "flex-row-reverse" : "flex-row"}`}>

        <div
          className={`px-4 py-2 rounded-2xl shadow-sm break-words transition-all duration-200
            ${message.isOwn
              ? "bg-blue-500 text-white rounded-br-sm max-w-[80%]"
              : "bg-gray-100 text-gray-900 rounded-bl-sm max-w-[80%]"
            }`}

        >
          {/* FILE preview */}
          {renderFile()}

          {/* TEXT */}
          {message.text && (
            <p className="text-sm leading-relaxed mb-1">{message.text}</p>
          )}

          {/* FAILED LABEL */}
          {message.status === "failed" && (
            <div className="mt-1 flex items-center gap-1 bg-red-600/90 text-white text-xs px-2 py-1 rounded-md">
              <AlertCircle size={12} />
              <span>Failed: {message.errorMessage || "Message not sent"}</span>
            </div>
          )}

          {/* TIME + STATUS */}
          <div className="text-xs min-w-[100px] mr-4 mt-1 flex opacity-70 flex items-center gap-1 justify-end">
            <span>{formatTime(message.timestamp)} </span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  )
}
