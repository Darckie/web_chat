// import { create } from "zustand";
// import axios from "axios";
// import { useUIStore } from "./uiStore";
// import { useAuthStore } from "./auth";

// import { User, User2, UserCheck } from "lucide-react";
// import type { Message, Chat } from "../types";

// const apiUrl = import.meta.env.VITE_API_URL;
// const filePath = import.meta.env.VITE_API_FILE_PATH;

// const avatars = [User, User2, UserCheck];
// const getRandomAvatarIcon = () =>
//   avatars[Math.floor(Math.random() * avatars.length)];

// interface ChatState {
//   chats: Chat[];
//   activeChats: string[];
//   selectedChatId: string | null;
//   fetchMessages: (chatId: string) => Promise<void>;

//   messagePollingIntervalRef: { current: any | null }; // <-- ref for interval
//   startPolling: (chatId: string, number: string) => void;
//   clearPolling: () => void;

//   addChat: (chat: Chat) => void;
//   removeChat: (chatId: string) => void;

//   activateTab: (chatId: string) => void;
//   deactivateTab: (chatId: string) => void;

//   setSelectedChat: (chatId: string) => void;

//   addMessage: (chatId: string, msg: Message) => void;
//   loadMessages: (chatId: string, number: string) => Promise<Message[]>;
//   openChat: (chatId: string, number: string) => Promise<void>;
//   sendMessage: (chatId: string, payload: Message) => Promise<void>;
// }

// export const useChatStore = create<ChatState>((set, get) => ({
//   chats: [],
//   activeChats: [],
//   selectedChatId: null,
//   fetchMessages: async (chatId: string) => {
//     const chat = get().chats.find((c) => c.id === chatId);
//     if (!chat) return;

//     try {
//       const res = await axios.get(`${apiUrl}/${chat.mobile_no}`);
//       const data = res?.data?.data ?? [];

//       const customerName = data[0]?.customer_name || `User-${chat.mobile_no}`;

//       const messages: Message[] = data.map((msg: any) => ({
//         id: String(msg.id),
//         text: msg.message ?? "",
//         timestamp: msg.api_call_time
//           ? new Date(msg.api_call_time).getTime()
//           : Date.now(),
//         isOwn: msg.type === "outgoing",
//         status: msg.status ?? "delivered",
//         type:
//           msg.action === "image"
//             ? "image"
//             : msg.action === "document"
//             ? "document"
//             : "text",
//         fileUrl: msg.file_path ? `${filePath}/${msg.file_path}` : undefined,
//         customer_name: customerName,
//         agent_id: msg.agent_id ?? null,
//       }));

//       set((state) => ({
//         chats: state.chats.map((c) =>
//           c.id === chatId
//             ? { ...c, name: customerName, customer_name: customerName, messages }
//             : c
//         ),
//       }));
//     } catch (err) {
//       console.error(" fetchMessages failed:", err);
//     }
//   },

//   // ------------------- POLLING -------------------
//   messagePollingIntervalRef: { current: null }, // use ref instead of state

//   clearPolling: () => {
//     if (get().messagePollingIntervalRef.current) {
//       clearInterval(get().messagePollingIntervalRef.current);
//       get().messagePollingIntervalRef.current = null;
//     }
//   },

//   startPolling: (chatId: string, number: string) => {
//     // Clear previous interval
//     get().clearPolling();

//     // Start new interval
//     get().messagePollingIntervalRef.current = setInterval(async () => {
//       if (get().selectedChatId === chatId) {
//         await get().loadMessages(chatId, number);
//       }
//     }, 20000); // 20s
//   },

//   // ------------------- EXISTING CODE -------------------
//   addChat: (chat) =>
//     set((state) => {
//       const filtered = state.chats.filter((c) => c.id !== chat.id);
//       return { chats: [chat, ...filtered] };
//     }),

//   removeChat: (chatId) =>
//     set((state) => ({
//       chats: state.chats.filter((c) => c.id !== chatId),
//       activeChats: state.activeChats.filter((id) => id !== chatId),
//       selectedChatId:
//         state.selectedChatId === chatId ? null : state.selectedChatId,
//     })),

//   activateTab: (chatId) =>
//     set((state) => ({
//       activeChats: [
//         chatId,
//         ...state.activeChats.filter((id) => id !== chatId),
//       ].slice(0, 3),
//     })),

//   deactivateTab: (chatId) =>
//     set((state) => ({
//       activeChats: state.activeChats.filter((id) => id !== chatId),
//       selectedChatId:
//         state.selectedChatId === chatId
//           ? state.activeChats.filter((id) => id !== chatId)[0] || null
//           : state.selectedChatId,
//     })),

//   setSelectedChat: (chatId) => set({ selectedChatId: chatId }),

//   addMessage: (chatId, message) =>
//     set((state) => ({
//       chats: state.chats.map((chat) =>
//         chat.id === chatId
//           ? { ...chat, messages: [...chat.messages, message] }
//           : chat
//       ),
//     })),

//   loadMessages: async (chatId, number) => {
//     try {
//       const res = await axios.get(`${apiUrl}/${number}`);
//       const data = res?.data?.data ?? [];
//       const customerName = data[0]?.customer_name || `User-${number}`;

//       const messages: Message[] = data.map((msg: any) => ({
//         id: String(msg.id),
//         text: msg.message ?? "",
//         timestamp: msg.api_call_time
//           ? new Date(msg.api_call_time).getTime()
//           : Date.now(),
//         isOwn: msg.type === "outgoing",
//         status: msg.status ?? "delivered",
//         type:
//           msg.action === "image"
//             ? "image"
//             : msg.action === "document"
//             ? "document"
//             : "text",
//         fileUrl: msg.file_path ? `${filePath}/${msg.file_path}` : undefined,
//         customer_name: customerName,
//         agent_id: msg.agent_id ?? null,
//       }));

//       set((state) => ({
//         chats: state.chats.map((c) =>
//           c.id === chatId
//             ? { ...c, messages, name: customerName, customer_name: customerName }
//             : c
//         ),
//       }));

//       return messages;
//     } catch (err) {
//       console.error("❌ Failed to load messages", err);
//       return [];
//     }
//   },

//   openChat: async (chatId, number) => {
//     try {
//       const agentId = useAuthStore.getState().agentId ?? null;
//       useUIStore.getState().open();

//       const state = get();
//       const existing = state.chats.find((c) => c.id === chatId);

//       let chatObj: any;
//       if (existing) {
//         const filtered = state.chats.filter((c) => c.id !== chatId);
//         chatObj = existing;
//         set({ chats: [existing, ...filtered] });
//       } else {
//         chatObj = {
//           id: chatId,
//           name: `User-${number}`,
//           customer_name: `User-${number}`,
//           mobile_no: number,
//           agentid: agentId,
//           avatar: getRandomAvatarIcon(),
//           status: "online",
//           lastSeen: Date.now(),
//           messages: [],
//           isTyping: false,
//         };

//         set((state) => ({
//           chats: [chatObj, ...state.chats.filter((c) => c.id !== chatId)],
//         }));
//       }

//       get().activateTab(chatId);
//       get().setSelectedChat(chatId);

//       const messages = await get().loadMessages(chatId, number);

//       set((state) => ({
//         chats: state.chats.map((c) =>
//           c.id === chatId ? { ...c, messages } : c
//         ),
//       }));

//       // Clear old polling
//       get().clearPolling();

//       // Start new polling for this chat
//       get().startPolling(chatId, number);

//     } catch (err) {
//       console.error("❌ openChat error:", err);
//     }
//   },

//   sendMessage: async (chatId, payload) => {
//     try {
//       const chat = get().chats.find((c) => c.id === chatId);
//       if (!chat) return console.error("❌ Chat not found", chatId);

//       const agentId = useAuthStore.getState().agentId ?? null;
//       const finalPayload: Message = {
//         ...payload,
//         mobile_no: chat.mobile_no,
//         customer_name: chat.customer_name ?? chat.name,
//         agent_id: agentId,
//       };

//       const formData = new FormData();
//       formData.append("receiver", finalPayload.mobile_no ?? "");
//       formData.append("type", finalPayload.type ?? "text");
//       if (finalPayload.customer_name)
//         formData.append("customer_name", finalPayload.customer_name);
//       if (agentId) formData.append("agent_id", agentId);
//       if (finalPayload.text) formData.append("text", finalPayload.text);
//       if (finalPayload.file)
//         formData.append("file", finalPayload.file as File);

//       await axios.post(apiUrl + "/send", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       get().addMessage(chatId, finalPayload);
//     } catch (error) {
//       console.error("❌ Send message failed", error);
//     }
//   },
// }));



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
  fetchMessages: (chatId: string) => Promise<void>;

  messagePollingIntervalRef: { current: any | null }; // <-- ref for interval
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
  sendTemplateMessage: (chatId: string, templateData: any) => Promise<void>; // NEW
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChats: [],
  selectedChatId: null,
  fetchMessages: async (chatId: string) => {
    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) return;

    try {
      const res = await axios.get(`${apiUrl}/${chat.mobile_no}`);
      const data = res?.data?.data ?? [];

      const customerName = data[0]?.customer_name || `User-${chat.mobile_no}`;

      const messages: Message[] = data.map((msg: any) => ({
        id: String(msg.id),
        text: msg.message ?? "",
        timestamp: msg.api_call_time || msg.update_time
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
        fileUrl: msg.file_path ? msg.file_path : undefined,
        customer_name: customerName,
        agent_id: msg.agent_id ?? null,
      }));

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, name: customerName, customer_name: customerName, messages }
            : c
        ),
      }));
    } catch (err) {
      console.error("❌ fetchMessages failed:", err);
    }
  },

  // ------------------- POLLING -------------------
  messagePollingIntervalRef: { current: null }, // use ref instead of state

  clearPolling: () => {
    if (get().messagePollingIntervalRef.current) {
      clearInterval(get().messagePollingIntervalRef.current);
      get().messagePollingIntervalRef.current = null;
    }
  },

  startPolling: (chatId: string, number: string) => {
    // Clear previous interval
    get().clearPolling();

    // Start new interval
    get().messagePollingIntervalRef.current = setInterval(async () => {
      if (get().selectedChatId === chatId) {
        await get().loadMessages(chatId, number);
      }
    }, 20000); // 20s
  },

  // ------------------- EXISTING CODE -------------------
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
      activeChats: [
        chatId,
        ...state.activeChats.filter((id) => id !== chatId),
      ].slice(0, 3),
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
        timestamp: msg.api_call_time || msg.update_time
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
            fileUrl: msg.file_path ? msg.file_path : undefined,
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

      let chatObj: any;
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

        set((state) => ({
          chats: [chatObj, ...state.chats.filter((c) => c.id !== chatId)],
        }));
      }

      get().activateTab(chatId);
      get().setSelectedChat(chatId);

      const messages = await get().loadMessages(chatId, number);

      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === chatId ? { ...c, messages } : c
        ),
      }));

      // Clear old polling
      get().clearPolling();

      // Start new polling for this chat
      get().startPolling(chatId, number);

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
      if (finalPayload.customer_name)
        formData.append("customer_name", finalPayload.customer_name);
      if (agentId) formData.append("agent_id", agentId);
      if (finalPayload.text) formData.append("text", finalPayload.text);
      if (finalPayload.file)
        formData.append("file", finalPayload.file as File);

      await axios.post(apiUrl + "/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      get().addMessage(chatId, finalPayload);
    } catch (error) {
      console.error("❌ Send message failed", error);
    }
  },

  // ------------------- NEW: SEND TEMPLATE MESSAGE -------------------
  sendTemplateMessage: async (chatId, templateData) => {
    try {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat) return console.error("❌ Chat not found", chatId);

      const agentId = useAuthStore.getState().agentId ?? null;

      // Build the payload with all template information
      const payload: any = {
        agent_id: agentId,
        customer_name: templateData.customer_name || chat.customer_name || chat.name,
        mobile_no: templateData.mobile_no || chat.mobile_no,
        templateName: templateData.template_name, // FIXED: Use template_name (snake_case)
        language: templateData.language,
        category: templateData.category,
      };

      // Add placeholders if they exist
      if (templateData.placeholders && Object.keys(templateData.placeholders).length > 0) {
        payload.placeholders = templateData.placeholders;
      }

      // Add buttons if they exist
      if (templateData.buttons && templateData.buttons.length > 0) {
        payload.buttons = templateData.buttons;
      }

      console.log("📤 Sending template with payload:", payload);

      await axios.post(apiUrl + "/send-template", payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("✅ Template sent successfully");

      // Optionally reload messages after sending
      setTimeout(() => {
        get().loadMessages(chatId, chat.mobile_no);
      }, 1000);

    } catch (error) {
      console.error("❌ Send template failed", error);
    }
  },

}));