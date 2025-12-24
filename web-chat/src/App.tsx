import {useAuthStore} from "./store/auth";
import { ChatWidget } from "./components/ChatWidget"
import ChatHistoryTable from "./dashboard/ChatTable"
import "./globals.css"
import { useEffect } from "react";

function App() {
  const setAgentId = useAuthStore((s) => s.setAgentId);
  //logic to set agent id in store
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("agentid");
    if (id) {
      setAgentId(id);
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl mb-0">Conversation History </h1>



        {/* Main Table + Form */}
        <ChatHistoryTable />
      </div>

      <ChatWidget />
    </div>
  )
}

export default App
