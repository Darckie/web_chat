import { create } from "zustand";
import axios from "axios";
import { useUIStore } from "./uiStore";
import { useAuthStore } from "./auth";

import { User, User2, UserCheck } from "lucide-react";
import type { Message, Chat } from "../types";

const apiUrl = import.meta.env.VITE_API_URL;
const filePath = import.meta.env.VITE_API_FILE_PATH;

const avatars = [User, User2, UserCheck];
const getRandomAvatarIcon = () =>
  avatars[Math.floor(Math.random() * avatars.length)];

interface ChatState {
  chats: Chat[];
  activeChats: string[];
  selectedChatId: string | null;

  addChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;

  activateTab: (chatId: string) => void;
  deactivateTab: (chatId: string) => void;

  setSelectedChat: (chatId: string) => void;

  addMessage: (chatId: string, msg: Message) => void;
  loadMessages: (chatId: string, number: string) => Promise<Message[]>;
  openChat: (chatId: string, number: string) => Promise<void>;
  sendMessage: (chatId: string, payload: Message) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChats: [],
  selectedChatId: null,

  addChat: (chat) =>
    set((state) => {
      const filtered = state.chats.filter((c) => c.id !== chat.id);
      return { chats: [chat, ...filtered] };
    }),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      activeChats: state.activeChats.filter((id) => id !== chatId),
      selectedChatId:
        state.selectedChatId === chatId ? null : state.selectedChatId,
    })),

  activateTab: (chatId) =>
    set((state) => ({
      activeChats: [chatId, ...state.activeChats.filter((id) => id !== chatId)].slice(0, 3),
    })),

  deactivateTab: (chatId) =>
    set((state) => ({
      activeChats: state.activeChats.filter((id) => id !== chatId),
      selectedChatId:
        state.selectedChatId === chatId
          ? state.activeChats.filter((id) => id !== chatId)[0] || null
          : state.selectedChatId,
    })),

  setSelectedChat: (chatId) => set({ selectedChatId: chatId }),

  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      ),
    })),

  loadMessages: async (chatId, number) => {
    try {
      const res = await axios.get(`${apiUrl}/${number}`);
      const data = res?.data?.data ?? [];
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
        fileUrl: msg.file_path ? `${filePath}/${msg.file_path}` : undefined,
        customer_name: customerName,
        agent_id: msg.agent_id ?? null,
      }));

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages, name: customerName, customer_name: customerName }
            : c
        ),
      }));

      return messages;
    } catch (err) {
      console.error("❌ Failed to load messages", err);
      return [];
    }
  },

  openChat: async (chatId, number) => {
    try {
      const agentId = useAuthStore.getState().agentId ?? null;
      useUIStore.getState().open();

      const state = get();
      const existing = state.chats.find((c) => c.id === chatId);

      let chatObj:any;
      if (existing) {
        const filtered = state.chats.filter((c) => c.id !== chatId);
        chatObj = existing;
        set({ chats: [existing, ...filtered] });
      } else {
        chatObj = {
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
        };
        set((state) => ({ chats: [chatObj, ...state.chats.filter(c => c.id !== chatId)] }));
      }

      get().activateTab(chatId);
      get().setSelectedChat(chatId);

      const messages = await get().loadMessages(chatId, number);

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId ? { ...c, messages } : c
        ),
      }));
    } catch (err) {
      console.error("❌ openChat error:", err);
    }
  },

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

      const formData = new FormData();
      formData.append("receiver", finalPayload.mobile_no ?? "");
      formData.append("type", finalPayload.type ?? "text");
      if (finalPayload.customer_name) formData.append("customer_name", finalPayload.customer_name);
      if (agentId) formData.append("agent_id", agentId);
      if (finalPayload.text) formData.append("text", finalPayload.text);
      if (finalPayload.file) formData.append("file", finalPayload.file as File);

      await axios.post(apiUrl + "/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      get().addMessage(chatId, finalPayload);
    } catch (error) {
      console.error("❌ Send message failed", error);
    }
  },
}));
