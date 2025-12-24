// // ChatWindow.tsx
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useChatStore } from "../store/chatStore";
// import { useUIStore } from "../store/uiStore";
// import { useResize } from "../hooks/useResize";
// import { useDrag } from "../hooks/useDrag";
// import { MessageCircleCode, Minimize2 } from "lucide-react";

// import { ChatTabs } from "./ChatTabs";
// import { ChatHeader } from "./ChatHeader";
// import { MessageList } from "./MessageList";
// import { ChatInput } from "./ChatInput";

// export const ChatWindow = () => {
//   const { chats, activeChats, activateTab, deactivateTab } = useChatStore();
//   const { isMinimized, minimize, width, height } = useUIStore();

//   const [selectedChatId, setSelectedChatId] = useState(activeChats[0] || "");

//   useEffect(() => {
//     if (activeChats.length > 0) {
//       setSelectedChatId(activeChats[0]);
//     }
//   }, [activeChats]);

//   const windowRef: any = useRef<HTMLDivElement>(null);
//   const { handleMouseDown: handleResize } = useResize(windowRef);
//   const { handleDragStart } = useDrag(windowRef);

//   const selectedChat = chats.find((chat) => chat.id === selectedChatId);
//   if (!selectedChat) return null;

//   // 🔹 derive sessionClosed from last message's activity
//   const lastMsg = selectedChat.messages?.[selectedChat.messages.length - 1];
//   const sessionClosed = lastMsg?.activity === "NO";

//   const handleSelectChat = (chatId: string) => {
//     setSelectedChatId(chatId);
//     activateTab(chatId);
//   };

//   const handleCloseChat = () => {
//     deactivateTab(selectedChatId);
//     const remaining = activeChats.filter((id) => id !== selectedChatId);
//     if (remaining.length > 0) setSelectedChatId(remaining[0]);
//   };

//   return (
//     <div
//       ref={windowRef}
//       className={`fixed bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-300 z-50 ${
//         isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
//       }`}
//       style={{
//         width: `${width}px`,
//         height: `${height}px`,
//         bottom: "20px",
//         right: "20px",
//         position: "fixed",
//       }}
//     >
//       {/* HEADER / DRAG HANDLE */}
//       <div
//         data-drag-handle
//         onMouseDown={handleDragStart}
//         className="flex items-center justify-between p-1 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 cursor-move"
//       >
//         <h2 className="text-sm font-bold text-gray-900">
//           <MessageCircleCode className="text-teal-700" />
//         </h2>

//         <button
//           onClick={minimize}
//           className="p-1.5 rounded-full hover:bg-gray-200 cursor-pointer transition-colors text-gray-600"
//         >
//           <Minimize2 />
//         </button>
//       </div>

//       {/* TABS */}
//       {activeChats.length > 0 && (
//         <ChatTabs
//           activeChats={activeChats}
//           chats={chats}
//           onSelectChat={handleSelectChat}
//           selectedChatId={selectedChatId}
//         />
//       )}

//       {/* CHAT CONTENT */}
//       <ChatHeader chat={selectedChat} onClose={handleCloseChat} />

//       <MessageList chat={selectedChat} />

//       {/* 🔹 Optional banner when closed */}
//       {sessionClosed && (
//         <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-t border-red-200 text-center">
//           This chat has been closed. Customer must send a new
//           message to start a fresh session.
//         </div>
//       )}

//       <ChatInput
//         chatId={selectedChat.id}
//         mobile_no={selectedChat.mobile_no}
//         // 🔹 pass flag down
//         sessionClosed={sessionClosed}
//       />

//       {/* RESIZER */}
//       <div
//         onMouseDown={handleResize}
//         title="resize"
//         className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gradient-to-tl from-blue-800 to-transparent rounded-tl-lg hover:opacity-100 transition-opacity"
//       />
//     </div>
//   );
// };


// ChatWindow.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { useUIStore } from "../store/uiStore";
import { useResize } from "../hooks/useResize";
import { useDrag } from "../hooks/useDrag";
import { MessageCircleCode, Minimize2 } from "lucide-react";

import { ChatTabs } from "./ChatTabs";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useAuthStore } from "../store/auth";

export const ChatWindow = () => {
  const { chats, activeChats, activateTab, deactivateTab } = useChatStore();
  const { isMinimized, minimize, width, height } = useUIStore();

  const [selectedChatId, setSelectedChatId] = useState(activeChats[0] || "");

  useEffect(() => {
    if (activeChats.length > 0) {
      setSelectedChatId(activeChats[0]);
    }
  }, [activeChats]);

  const windowRef: any = useRef<HTMLDivElement>(null);
  const { handleMouseDown: handleResize } = useResize(windowRef);
  const { handleDragStart } = useDrag(windowRef);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  if (!selectedChat) return null;

  // 🔹 derive sessionClosed from last message's activity
  const lastMsg = selectedChat.messages?.[selectedChat.messages.length - 1];
  const sessionClosed = lastMsg?.activity === "NO";

  // 🔹 derive transferredAway: last message belongs to another agent

  const currentAgentId = useAuthStore((s) => s.agentId);
  

  const lastAgentId = lastMsg?.agent_id;
  const transferredAway =
    !!lastAgentId && !!currentAgentId && String(lastAgentId) !== String(currentAgentId);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    activateTab(chatId);
  };

  const handleCloseChat = () => {
    deactivateTab(selectedChatId);
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
      {/* HEADER / DRAG HANDLE */}
      <div
        data-drag-handle
        onMouseDown={handleDragStart}
        className="flex items-center justify-between p-1 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 cursor-move"
      >
        <h2 className="text-sm font-bold text-gray-900">
          <MessageCircleCode className="text-teal-700" />
        </h2>

        <button
          onClick={minimize}
          className="p-1.5 rounded-full hover:bg-gray-200 cursor-pointer transition-colors text-gray-600"
        >
          <Minimize2 />
        </button>
      </div>

      {/* TABS */}
      {activeChats.length > 0 && (
        <ChatTabs
          activeChats={activeChats}
          chats={chats}
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChatId}
        />
      )}

      {/* CHAT CONTENT */}
      <ChatHeader chat={selectedChat} onClose={handleCloseChat} />

      <MessageList chat={selectedChat} />

      {/* 🔹 Banner when closed */}
      {sessionClosed && (
        <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-t border-red-200 text-center">
          This chat has been closed. Customer must send a new
          message to start a fresh session.
        </div>
      )}

      {/* 🔹 Banner when transferred away */}
      {!sessionClosed && transferredAway && (
        <div className="px-3 py-2 text-xs text-orange-700 bg-orange-50 border-t border-orange-200 text-center">
          This chat has been transferred to another agent. You can view history,
          but cannot send new messages.
        </div>
      )}

      {/* 🔹 Only render input if session NOT closed and NOT transferred away */}
      {!sessionClosed && !transferredAway && (
        <ChatInput
          chatId={selectedChat.id}
          mobile_no={selectedChat.mobile_no}
          sessionClosed={sessionClosed}
        />
      )}

      {/* RESIZER */}
      <div
        onMouseDown={handleResize}
        title="resize"
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gradient-to-tl from-blue-800 to-transparent rounded-tl-lg hover:opacity-100 transition-opacity"
      />
    </div>
  );
};
