import { create } from "zustand";

interface AuthState {
  agentId: string;
  setAgentId: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  agentId: "",

  setAgentId: (id) =>
    set(() => ({
      agentId: id,
    })),
}));
