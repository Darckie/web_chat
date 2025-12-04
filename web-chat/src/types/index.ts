export interface Message {
  id: string;
  text?: string;
  timestamp?: number | any;
  isOwn?: boolean;
  status: "sent" | "delivered" | "read" | "pending" | "failed" | "unknown";
  type: "text" | "image" | "document" | "audio" | "video" | "file"
  file?: File;
  fileUrl?: string;
  mobile_no?: string;
  customer_name?: string | null;
  agent_id?: string | null;
  [key: string]: any;
  fileName?: string
  errorMessage?: string
}

export interface Chat {
  id: string;
  name: string;
  avatar?: any;
  status: string;
  mobile_no:string;
  lastSeen: number;
  messages: Message[];
  isTyping: boolean;
  customer_name:string
  agentid:string
}

// export type Message = {
//   id?: string;
//   text?: string;
//   timestamp?: number;
//   isOwn?: boolean;
//   status?: "sent" | "delivered" | "read" | "failed" | "pending";
//   file?: File | null;      // use when sending file
//   file_path?: string | null; // URL returned from backend / stored in DB
//   type?: "text" | "image" | "document" | "template";
//   mobile_no?: string | any;
//   agent_id?: string;
//   templateId?:string;
// };

// export interface Chat {
//   id: string;
//   name: string;
//   avatar: string;
//   status: "online" | "offline";
//   lastSeen: number;
//   messages: Message[];
//   isTyping: boolean;
// }

export interface UIState {
  isMinimized: boolean
  isMaximized: boolean
  width: number
  height: number
  position: {
    x: number
    y: number
  }
}

export interface Theme {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    border: string
    muted: string
    bubble: {
      self: string
      other: string
      textSelf: string
      textOther: string
    }
  }
  radius: {
    sm: string
    md: string
    lg: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
}
