// src/store/chatStore.ts
import { create } from "zustand";
import axios from "axios";
import { useUIStore } from "./uiStore";
import { useAuthStore } from "./auth";

import { User, User2, UserCheck } from "lucide-react";
import type { Message ,Chat} from "../types";

// ---------------------------
// Types
// ---------------------------



// export type Chat = {
//   id: string;
//   name: string;
//   mobile_no: string;
//   avatar?: any;
//   status?: string;
//   lastSeen?: number;
//   messages: Message[];
//   isTyping?: boolean;
//   customer_name?: string | null;
//   agent_id?: string | null;
//   [key: string]: any;
// };

// ---------------------------
// Utility
// ---------------------------
const avatars = [User, User2, UserCheck];
const getRandomAvatarIcon = () =>
  avatars[Math.floor(Math.random() * avatars.length)];

// ---------------------------
// Zustand Store
// ---------------------------
interface ChatState {
  chats: Chat[];
  activeChats: string[];

  addChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;

  activateChat: (chatId: string) => void;
  deactivateChat: (chatId: string) => void;

  addMessage: (chatId: string, message: Message) => void;

  loadMessages: (chatId: string, number: string) => Promise<void>;
  openChat: (chatId: string, number: string) => Promise<void>;

  sendMessage: (chatId: string, payload: Message) => Promise<void>;
}

// ---------------------------
// Chat Store Implementation
// ---------------------------
export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChats: [],

  //------------------------------------------------------------------
  addChat: (chat) =>
    set((state) => ({
      chats: [...state.chats, chat],
    })),

  //------------------------------------------------------------------
  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      activeChats: state.activeChats.filter((id) => id !== chatId),
    })),

  //------------------------------------------------------------------
  activateChat: (chatId) =>
    set((state) => ({
      activeChats: state.activeChats.includes(chatId)
        ? state.activeChats
        : [...state.activeChats].slice(-2).concat(chatId),
    })),

  deactivateChat: (chatId) =>
    set((state) => ({
      activeChats: state.activeChats.filter((id) => id !== chatId),
    })),

  //------------------------------------------------------------------
  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      ),
    })),

  //------------------------------------------------------------------
  loadMessages: async (chatId, number) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/chat/${number}`);

      const data = res?.data?.data ?? [];
      console.log("📥 LOAD MESSAGES RAW:", data);

      const customerName = data[0]?.customer_name || `User-${number}`;

      const messages: Message[] = data.map((msg: any) => ({
        id: String(msg.id),
        text: msg.message ?? "",
        timestamp: msg.api_call_time
          ? new Date(msg.api_call_time).getTime()
          : Date.now(),
        isOwn: msg.type === "outgoing",
        status: msg.status ?? "delivered",
        type:
          msg.action === "image"
            ? "image"
            : msg.action === "document"
              ? "document"
              : "text",
        fileUrl: msg.file_path
          ? `http://localhost:3000${msg.file_path}`
          : undefined,
        customer_name: customerName,
        agent_id: msg.agent_id ?? null,
      }));

      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? {
              ...chat,
              messages,
              name: customerName,
              customer_name: customerName,
            }
            : chat
        ),
      }));
    } catch (err) {
      console.error("❌ Failed to load messages", err);
    }
  },

  //------------------------------------------------------------------
  openChat: async (chatId, number) => {
    try {
      const agentId = useAuthStore.getState().agentId ?? null;

      useUIStore.getState().open();

      const existing = get().chats.find((c) => c.id === chatId);

      // --------------------------
      // Create temporary chat first
      // --------------------------
      if (!existing) {
        get().addChat({
          id: chatId,
          name: `User-${number}`,
          customer_name: `User-${number}`,
          mobile_no: number,
          agentid: agentId,
          avatar: getRandomAvatarIcon(),
          status: "online",
          lastSeen: Date.now(),
          messages: [],
          isTyping: false,
        });
      }

      get().activateChat(chatId);

      // --------------------------
      // Now load real messages + real name
      // --------------------------
      await get().loadMessages(chatId, number);
    } catch (err) {
      console.error("❌ openChat error:", err);
    }
  },

  //------------------------------------------------------------------
  sendMessage: async (chatId, payload) => {
    try {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat) return console.error("❌ Chat not found", chatId);

      const agentId = useAuthStore.getState().agentId ?? null;

      const finalPayload: Message = {
        ...payload,
        mobile_no: chat.mobile_no,
        customer_name: chat.customer_name ?? chat.name,
        agent_id: agentId,
      };

      console.log("📤 FINAL PAYLOAD:", finalPayload);

      const formData = new FormData();
      formData.append("receiver", finalPayload.mobile_no ?? "");
      formData.append("type", finalPayload.type ?? "text");
      if (finalPayload.customer_name)
        formData.append("customer_name", finalPayload.customer_name);
      if (agentId) formData.append("agent_id", agentId);
      if (finalPayload.text) formData.append("text", finalPayload.text);
      if (finalPayload.file)
        formData.append("file", finalPayload.file as File);

      await axios.post("http://localhost:3000/api/chat/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // UI Update
      get().addMessage(chatId, finalPayload);
    } catch (error) {
      console.error("❌ Send message failed", error);
    }
  },
}));
