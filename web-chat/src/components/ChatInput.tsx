"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, X, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/auth";

interface ChatInputProps {
  chatId: string;
  mobile_no: string;
}

export const ChatInput = ({ chatId, mobile_no }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, chats } = useChatStore();

  const agentId = useAuthStore((s) => s.agentId);
  const chat = chats.find((c) => c.id === chatId);
  const customerName = chat?.name || "Unknown User";

  // ---------------- SEND TEXT ----------------
  const handleSendText = () => {
    if (!message.trim() || selectedFile) return;

    sendMessage(chatId, {
      id: `msg-${Date.now()}`,
      text: message,
      timestamp: Date.now(),
      isOwn: true,
      status: "pending",
      type: "text",
      mobile_no:mobile_no,
      agent_id: agentId,
      customer_name: customerName,
    });

    setMessage("");
    inputRef.current?.focus();
  };

  // ---------------- SEND FILE ----------------
  const handleSendFile = () => {
    if (!selectedFile) return;

    const fileType = selectedFile.type.startsWith("image") ? "image" : "document";

    sendMessage(chatId, {
      id: `msg-${Date.now()}`,
      text: selectedFile.name,
      timestamp: Date.now(),
      isOwn: true,
      status: "pending",
      type: fileType,
      mobile_no:mobile_no,
      file: selectedFile,
      agent_id: agentId,
      customer_name: customerName,
    });

    setSelectedFile(null);
    setMessage("");
  };



  // ---------------- PICK FILE ----------------
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowMenu(false);
  };

  // ---------------- SEND ON ENTER ----------------
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (selectedFile) handleSendFile();
      else handleSendText();
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-3 bg-white border-t border-gray-200">

      {/* EMOJI BUTTON */}
      {/* <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
        <Smile size={20} />
      </button> */}

      {/* PAPERCLIP BUTTON WITH DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((p) => !p)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          <Paperclip size={20} />
        </button>

        {showMenu && (
          <div className="absolute left-0 bottom-12 bg-white shadow-lg rounded-md border w-44 z-50 p-1">
            {/* FILE PICKER */}
            <label className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded text-sm cursor-pointer">
              <FileIcon size={16} /> Upload File / Image
              <input type="file" className="hidden" onChange={handleFilePick} />
            </label>
          </div>
        )}
      </div>

      {/* FILE PREVIEW (IF SELECTED) */}
      {selectedFile && (
        <div className="absolute bottom-16 left-3 right-3 bg-white shadow-md p-3 rounded-lg border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedFile.type.startsWith("image") ? (
              <ImageIcon size={18} className="text-blue-500" />
            ) : (
              <FileIcon size={18} className="text-green-600" />
            )}

            <span className="text-sm">{selectedFile.name}</span>
          </div>

          <button onClick={() => setSelectedFile(null)}>
            <X size={18} className="text-gray-500 hover:text-red-500" />
          </button>
        </div>
      )}

      {/* INPUT FIELD */}
      <input
        ref={inputRef}
        type="text"
        placeholder={selectedFile ? "Ready to send file..." : "Type a message..."}
        value={message}
        disabled={!!selectedFile}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        className={`flex-1 px-4 py-2 rounded-full bg-gray-100 text-sm outline-none 
          ${selectedFile ? "opacity-40 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:bg-white"}
          transition-all`}
      />

      {/* SEND BUTTON */}
      <button
        onClick={selectedFile ? handleSendFile : handleSendText}
        disabled={!message.trim() && !selectedFile}
        className="p-2 rounded-full transition-all disabled:opacity-50 hover:bg-blue-100"
      >
        <Send size={20} className="text-blue-500" />
      </button>
    </div>
  );
};
