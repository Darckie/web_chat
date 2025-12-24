// chatStore.ts
import { create } from "zustand";
import axios from "axios";
import { useUIStore } from "./uiStore";
import { useAuthStore } from "./auth";

import { User, User2, UserCheck } from "lucide-react";
import type { Message, Chat } from "../types";

const apiUrl = import.meta.env.VITE_API_URL;

// ------------------- Avatars -------------------
const avatars = [User, User2, UserCheck];
const getRandomAvatarIcon = () =>
  avatars[Math.floor(Math.random() * avatars.length)];

// ------------------- Helper: Map API -> Message -------------------
const mapToMessage = (msg: any): Message => ({
  id: String(msg.id),
  text: msg.message ?? "",
  timestamp: msg.api_call_time || msg.update_time
    ? new Date(msg.api_call_time || msg.update_time).getTime()
    : Date.now(),
  isOwn: msg.type === "outgoing",
  status: (msg.status as Message["status"]) ?? "delivered",
  type:
    msg.action === "image"
      ? "image"
      : msg.action === "document"
      ? "document"
      : "text",
  fileUrl: msg.file_path ?? undefined,
  customer_name: msg.customer_name ?? "",
  agent_id: msg.agent_id ?? null,
  session_id: msg.session_id,
  activity: msg.activity ?? "YES",
});

// ------------------- Helper: Sound -------------------
const playIncomingSound = () => {
  const audio = new Audio("/sounds/new-message.mp3");
  audio.volume = 0.6;
  audio.play().catch(() => {});
};

// ------------------- Date Formatting -------------------
export const formatMessageDate = (timestamp: number) => {
  const msgDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    msgDate.getFullYear() === today.getFullYear() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getDate() === today.getDate();

  const isYesterday =
    msgDate.getFullYear() === yesterday.getFullYear() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getDate() === yesterday.getDate();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return msgDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ------------------- Store -------------------
interface ChatState {
  chats: (Chat & { sessionClosed?: boolean })[];
  activeChats: string[];
  selectedChatId: string | null;
  messagePollingIntervalRef: { current: any | null };
  isFetching: Record<string, boolean>;

  fetchMessages: (chatId: string) => Promise<void>;
  checkForNewMessages: (chatId: string, number: string) => Promise<void>;
  startPolling: (chatId: string, number: string) => void;
  clearPolling: () => void;

  addChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;

  activateTab: (chatId: string) => void;
  deactivateTab: (chatId: string) => void;

  setSelectedChat: (chatId: string) => void;

  addMessage: (chatId: string, msg: Message) => void;
  loadMessages: (chatId: string, number: string) => Promise<Message[]>;
  openChat: (chatId: string, number: string) => Promise<void>;
  sendMessage: (chatId: string, payload: Message) => Promise<void>;
  sendTemplateMessage: (chatId: string, templateData: any) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChats: [],
  selectedChatId: null,
  messagePollingIntervalRef: { current: null },
  isFetching: {},

  // ------------------- Fetch Full Messages -------------------
  fetchMessages: async (chatId) => {
    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) return;

    if (get().isFetching[chatId]) return;

    set((state) => ({
      isFetching: { ...state.isFetching, [chatId]: true },
    }));

    try {
      const res = await axios.get(`${apiUrl}/${chat.mobile_no}`);
      const data: any[] = res?.data?.data ?? [];
      const customerName = data[0]?.customer_name || `User-${chat.mobile_no}`;
      const messages = data.map(mapToMessage);

      const lastRow = data[data.length - 1];
      const sessionClosed = lastRow?.activity === "NO";

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages,
                name: customerName,
                customer_name: customerName,
                sessionClosed,
              }
            : c
        ),
        isFetching: { ...state.isFetching, [chatId]: false },
      }));
    } catch (err) {
      console.error("fetchMessages failed:", err);
      set((state) => ({
        isFetching: { ...state.isFetching, [chatId]: false },
      }));
    }
  },

  // ------------------- Check Only New Messages -------------------
  checkForNewMessages: async (chatId, number) => {
    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) return;

    if (get().isFetching[chatId]) return;

    set((state) => ({
      isFetching: { ...state.isFetching, [chatId]: true },
    }));

    try {
      const res = await axios.get(`${apiUrl}/${number}`);
      const data: any[] = res?.data?.data ?? [];
      const allMessages = data.map(mapToMessage);

      const lastRow = data[data.length - 1];
      const sessionClosed = lastRow?.activity === "NO";

      const existingMessagesMap = new Map(chat.messages.map((m) => [m.id, m]));

      const newMessages: Message[] = [];
      const updatedMessages: Message[] = [];

      allMessages.forEach((apiMsg: Message) => {
        const existing = existingMessagesMap.get(apiMsg.id);

        if (!existing) {
          newMessages.push(apiMsg);
        } else if (existing.status !== apiMsg.status) {
          updatedMessages.push(apiMsg);
        }
      });

      if (newMessages.length === 0 && updatedMessages.length === 0) {
        set((state) => ({
          isFetching: { ...state.isFetching, [chatId]: false },
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, sessionClosed } : c
          ),
        }));
        return;
      }

      const hasIncoming = newMessages.some((m: Message) => !m.isOwn);
      if (hasIncoming) playIncomingSound();

      set((state) => ({
        chats: state.chats.map((c) => {
          if (c.id !== chatId) return c;

          let updatedMessageList = c.messages.map((msg) => {
            const updated = updatedMessages.find((u) => u.id === msg.id);
            return updated ? { ...msg, status: updated.status } : msg;
          });

          if (newMessages.length > 0) {
            updatedMessageList = [...updatedMessageList, ...newMessages];
          }

          return { ...c, messages: updatedMessageList, sessionClosed };
        }),
        isFetching: { ...state.isFetching, [chatId]: false },
      }));
    } catch (err) {
      console.error("checkForNewMessages failed:", err);
      set((state) => ({
        isFetching: { ...state.isFetching, [chatId]: false },
      }));
    }
  },

  // ------------------- Polling -------------------
  clearPolling: () => {
    if (get().messagePollingIntervalRef.current) {
      clearInterval(get().messagePollingIntervalRef.current);
      get().messagePollingIntervalRef.current = null;
    }
  },

  startPolling: (chatId, number) => {
    get().clearPolling();
    get().messagePollingIntervalRef.current = setInterval(() => {
      if (get().selectedChatId === chatId) {
        get().checkForNewMessages(chatId, number);
      }
    }, 5000);
  },

  // ------------------- Chat Management -------------------
  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats.filter((c) => c.id !== chat.id)],
    })),

  removeChat: (chatId) => {
    const state = get();
    if (state.selectedChatId === chatId) {
      get().clearPolling();
    }

    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      activeChats: state.activeChats.filter((id) => id !== chatId),
      selectedChatId:
        state.selectedChatId === chatId ? null : state.selectedChatId,
    }));
  },

  activateTab: (chatId) =>
    set((state) => ({
      activeChats: [chatId, ...state.activeChats.filter((id) => id !== chatId)].slice(0, 1),
    })),

  deactivateTab: (chatId) => {
    const state = get();
    if (state.selectedChatId === chatId) {
      get().clearPolling();
    }

    set((state) => ({
      activeChats: state.activeChats.filter((id) => id !== chatId),
      selectedChatId:
        state.selectedChatId === chatId
          ? state.activeChats.filter((id) => id !== chatId)[0] || null
          : state.selectedChatId,
    }));
  },

  setSelectedChat: (chatId) => set({ selectedChatId: chatId }),

  addMessage: (chatId, msg) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, msg] }
          : chat
      ),
    })),

  loadMessages: async (chatId, number) => {
    if (get().isFetching[chatId]) return [];

    set((state) => ({
      isFetching: { ...state.isFetching, [chatId]: true },
    }));

    try {
      const res = await axios.get(`${apiUrl}/${number}`);
      const data: any[] = res?.data?.data ?? [];
      const customerName = data[0]?.customer_name || `User-${number}`;
      const messages = data.map(mapToMessage);

      const lastRow = data[data.length - 1];
      const sessionClosed = lastRow?.activity === "NO";

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages,
                name: customerName,
                customer_name: customerName,
                sessionClosed,
              }
            : c
        ),
        isFetching: { ...state.isFetching, [chatId]: false },
      }));

      return messages;
    } catch (err) {
      console.error("loadMessages failed:", err);
      set((state) => ({
        isFetching: { ...state.isFetching, [chatId]: false },
      }));
      return [];
    }
  },

  openChat: async (chatId, number) => {
    try {
      const agentId = useAuthStore.getState().agentId ?? null;
      useUIStore.getState().open();

      const state = get();
      const existing = state.chats.find((c) => c.id === chatId);

      let chatObj: Chat & { sessionClosed?: boolean };
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
          agentid: agentId ?? "",
          avatar: getRandomAvatarIcon(),
          status: "online",
          lastSeen: Date.now(),
          messages: [],
          isTyping: false,
          session_id: "",
          sessionClosed: false,
        };
        set((state) => ({
          chats: [chatObj, ...state.chats.filter((c) => c.id !== chatId)],
        }));
      }

      get().activateTab(chatId);
      get().setSelectedChat(chatId);

      const messages = await get().loadMessages(chatId, number);

      const latestSessionId =
        messages
          .slice()
          .reverse()
          .find((m) => m.session_id)?.session_id ?? "";

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId ? { ...c, messages, session_id: latestSessionId } : c
        ),
      }));

      get().clearPolling();
      get().startPolling(chatId, number);
    } catch (err) {
      console.error("openChat failed:", err);
    }
  },

  sendMessage: async (chatId, payload) => {
    try {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat) return;
      if (chat.sessionClosed) return;

      const agentId = useAuthStore.getState().agentId ?? null;

      const formData = new FormData();
      formData.append("receiver", chat.mobile_no ?? "");
      formData.append("type", payload.type ?? "text");
      if (chat.customer_name) formData.append("customer_name", chat.customer_name);
      if (agentId) formData.append("agent_id", agentId);
      if (payload.text) formData.append("text", payload.text);
      if (payload.file) formData.append("file", payload.file as File);

      await axios.post(apiUrl + "/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTimeout(() => {
        get().checkForNewMessages(chatId, chat.mobile_no);
      }, 1000);
    } catch (err) {
      console.error("sendMessage failed:", err);
    }
  },

  sendTemplateMessage: async (chatId, templateData) => {
    try {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat) return;
      if (chat.sessionClosed) return;

      const agentId = useAuthStore.getState().agentId ?? null;

      const payload: any = {
        agent_id: agentId,
        customer_name:
          templateData.customer_name || chat.customer_name || chat.name,
        mobile_no: templateData.mobile_no || chat.mobile_no,
        templateName: templateData.template_name,
        language: templateData.language,
        category: templateData.category,
      };

      if (
        templateData.placeholders &&
        Object.keys(templateData.placeholders).length > 0
      ) {
        payload.placeholders = templateData.placeholders;
      }
      if (templateData.buttons && templateData.buttons.length > 0) {
        payload.buttons = templateData.buttons;
      }

      await axios.post(apiUrl + "/send-template", payload, {
        headers: { "Content-Type": "application/json" },
      });

      setTimeout(() => {
        get().checkForNewMessages(chatId, chat.mobile_no);
      }, 2000);
    } catch (err) {
      console.error("sendTemplateMessage failed:", err);
    }
  },
}));
