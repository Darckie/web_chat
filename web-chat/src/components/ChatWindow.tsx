"use client";

import { useState, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { useUIStore } from "../store/uiStore";
import { useResize } from "../hooks/useResize";
import { useDrag } from "../hooks/useDrag";
import {  MessageCircleCode,  Minimize2,  MinimizeIcon } from "lucide-react";

import { ChatTabs } from "./ChatTabs";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export const ChatWindow = () => {
  const { chats, activeChats, activateChat, deactivateChat } = useChatStore();
  const { isMinimized, minimize, width, height } = useUIStore();

  const [selectedChatId, setSelectedChatId] = useState(activeChats[0] || "");

  const windowRef:any = useRef<HTMLDivElement>(null);
  const { handleMouseDown: handleResize } = useResize(windowRef);
  const { handleDragStart } = useDrag(windowRef);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  if (!selectedChat) return null;

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    activateChat(chatId);
  };

  const handleCloseChat = () => {
    deactivateChat(selectedChatId);
    const remaining = activeChats.filter((id) => id !== selectedChatId);
    if (remaining.length > 0) setSelectedChatId(remaining[0]);
  };

  return (
    <div
      ref={windowRef}
      className={`fixed bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-300 z-50 ${
        isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        bottom: "20px",
        right: "20px",
        position: "fixed",
      }}
    >
      {/* Header for dragging */}
      <div
        data-drag-handle
        onMouseDown={handleDragStart}
        className="flex items-center justify-between p-1 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 cursor-move"
      >
        <h2 className="text-sm font-bold text-gray-900"><MessageCircleCode className="text-teal-700"/></h2>

        <div className="flex items-center gap-1">
          {/* <button onClick={maximize} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
            {useUIStore.getState().isMaximized ? (
              <Minimize2 size={16} className="text-gray-600" />
            ) : (
              <Maximize2 size={16} className="text-gray-600" />
            )}
          </button> */}

          <button 
            onClick={minimize} 
            className="p-1.5 rounded-full hover:bg-gray-200 cursor-pointer transition-colors text-gray-600"
          >
            <Minimize2/>
          </button>
        </div>
      </div>

      {activeChats.length > 0 && (
        <ChatTabs
          activeChats={activeChats}
          chats={chats}
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChatId}
        />
      )}

      <ChatHeader chat={selectedChat} onClose={handleCloseChat} />

      <MessageList chat={selectedChat} />

      <ChatInput chatId={selectedChat.id}  mobile_no={selectedChat.mobile_no} />

      {/* Resize Handle */}
      <div
        onMouseDown={handleResize}
        title="resize"
        className="absolute  bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gradient-to-tl from-blue-800 to-transparent rounded-tl-lg  hover:opacity-100 transition-opacity"
      />

    </div>
  );
};
