"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, File as FileIcon, Image as ImageIcon, Paperclip, FileText } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/auth";

interface ChatInputProps {
  chatId: string;
  mobile_no: string;
}

type TemplateButton = {
  type: string;
  text: string;
};

type TemplateInfo = {
  name: string;
  language: string;
  status: string;
  placeholders: string[];
  buttons: TemplateButton[];
  category: string;
};

const apiUrl = import.meta.env.VITE_API_URL;

export const ChatInput = ({ chatId, mobile_no }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Template states
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
  const [showPlaceholderDialog, setShowPlaceholderDialog] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, sendTemplateMessage, chats } = useChatStore();

  const agentId = useAuthStore((s) => s.agentId);
  const chat = chats.find((c) => c.id === chatId);
  const customerName = chat?.name || "Unknown User";

  // ---------------- EXTRACT PLACEHOLDERS ----------------
  const extractPlaceholders = (bodyText: string): string[] => {
    const placeholderPattern = /\{\{(\d+)\}\}/g;
    const matches = bodyText.matchAll(placeholderPattern);
    const placeholders: string[] = [];

    for (const match of matches) {
      const index = parseInt(match[1]);
      placeholders.push(`variable_${index}`);
    }

    return placeholders;
  };

  // ---------------- FETCH TEMPLATES ----------------
  useEffect(() => {
    const fetchTemplates = () => {
      fetch(apiUrl + "/get-template")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.templates) {
            const mappedTemplates: TemplateInfo[] = data.templates.map((t: any) => {
              let placeholders: string[] = [];
              let buttons: TemplateButton[] = [];

              if (t.raw?.structure?.body?.text) {
                placeholders = extractPlaceholders(t.raw.structure.body.text);
              }

              // CHANGE: Extract buttons from raw.structure.buttons
              if (t.raw?.structure?.buttons && Array.isArray(t.raw.structure.buttons)) {
                buttons = t.raw.structure.buttons;
              }

              return {
                name: t.name,
                language: t.language,
                status: t.raw?.status || t.status || "UNKNOWN",
                placeholders: placeholders,
                buttons: buttons, // Now correctly extracted
                category: t.category || "MARKETING",
              };
            });

            setTemplates(mappedTemplates);
          } else {
            setTemplates([]);
          }
        })
        .catch(err => {
          console.error("Error fetching templates:", err);
          setTemplates([]);
        });
    };

    fetchTemplates();
  }, []);

  // ---------------- SEND TEXT ----------------
  const handleSendText = () => {
    if (!message.trim() || selectedFile || selectedTemplate) return;

    sendMessage(chatId, {
      id: `msg-${Date.now()}`,
      text: message,
      timestamp: Date.now(),
      isOwn: true,
      status: "pending",
      type: "text",
      mobile_no: mobile_no,
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
      mobile_no: mobile_no,
      file: selectedFile,
      agent_id: agentId,
      customer_name: customerName,
    });

    setSelectedFile(null);
    setMessage("");
  };

  // ---------------- HANDLE TEMPLATE SELECTION ----------------
  const handleTemplateSelect = (template: TemplateInfo) => {
    setSelectedTemplate(template);
    setShowTemplateMenu(false);
    
    // Show template name in input field
    setMessage(`📄 Template: ${template.name}`);

    // If template has placeholders, we'll show dialog on send click
    // Otherwise it will be sent directly on send click
  };

  // ---------------- SEND TEMPLATE ----------------
  const handleSendTemplate = async (template: TemplateInfo, placeholders: Record<string, string>) => {
    try {
      await sendTemplateMessage(chatId, {
        template_name: template.name,
        language: template.language,
        category: template.category,
        placeholders: placeholders,
        buttons: template.buttons,
        mobile_no: mobile_no,
        customer_name: customerName,
        agent_id: agentId,
      });

      // Reset states
      setSelectedTemplate(null);
      setPlaceholderValues({});
      setShowPlaceholderDialog(false);
      setMessage("");

    } catch (error) {
      console.error("Error sending template:", error);
    }
  };

  // ---------------- HANDLE PLACEHOLDER SUBMIT ----------------
  const handlePlaceholderSubmit = () => {
    if (!selectedTemplate) return;

    // Check all placeholders are filled
    const allFilled = selectedTemplate.placeholders.every(p => placeholderValues[p]?.trim());
    if (!allFilled) {
      alert("Please fill all placeholder values");
      return;
    }

    handleSendTemplate(selectedTemplate, placeholderValues);
  };

  // ---------------- PICK FILE ----------------
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowMenu(false);
  };

  // ---------------- HANDLE SEND CLICK ----------------
  const handleSendClick = () => {
    // Priority: Template > File > Text
    if (selectedTemplate) {
      // Check if template has placeholders
      if (selectedTemplate.placeholders.length > 0) {
        setShowPlaceholderDialog(true);
      } else {
        // No placeholders, send directly
        handleSendTemplate(selectedTemplate, {});
      }
    } else if (selectedFile) {
      handleSendFile();
    } else {
      handleSendText();
    }
  };

  // ---------------- SEND ON ENTER ----------------
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  // ---------------- CLEAR TEMPLATE SELECTION ----------------
  const clearTemplateSelection = () => {
    setSelectedTemplate(null);
    setMessage("");
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="relative flex items-end gap-2 p-3 bg-white border-t border-gray-200">
        {/* PAPERCLIP BUTTON WITH DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            disabled={!!selectedTemplate}
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

        {/* TEMPLATE BUTTON */}
        <div className="relative">
          <button
            onClick={() => setShowTemplateMenu((p) => !p)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Send Template"
            disabled={!!selectedFile}
          >
            <FileText size={20} />
          </button>

          {showTemplateMenu && (
            <div className="absolute left-0 bottom-12 bg-white shadow-lg rounded-md border w-72 max-h-96 overflow-y-auto z-50">
              <div className="p-2 border-b bg-gray-50 font-semibold text-sm">
                Select Template
              </div>
              {templates.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No templates available
                </div>
              ) : (
                <div className="p-1">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left p-3 hover:bg-gray-100 rounded text-sm border-b last:border-b-0"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>({template.language})</span>
                        {template.placeholders.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {template.placeholders.length} vars
                          </span>
                        )}
                        {template.buttons.length > 0 && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {template.buttons.length} buttons
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

        {/* TEMPLATE PREVIEW (IF SELECTED) */}
        {selectedTemplate && (
          <div className="absolute bottom-16 left-3 right-3 bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <div>
                <span className="text-sm font-medium text-blue-900">{selectedTemplate.name}</span>
                {selectedTemplate.placeholders.length > 0 && (
                  <span className="text-xs text-blue-700 ml-2">
                    ({selectedTemplate.placeholders.length} variables required)
                  </span>
                )}
              </div>
            </div>

            <button onClick={clearTemplateSelection}>
              <X size={18} className="text-blue-500 hover:text-red-500" />
            </button>
          </div>
        )}

        {/* INPUT FIELD */}
        <input
          ref={inputRef}
          type="text"
          placeholder={
            selectedFile 
              ? "Ready to send file..." 
              : selectedTemplate 
              ? `Template: ${selectedTemplate.name}` 
              : "Type a message..."
          }
          value={message}
          disabled={!!selectedFile || !!selectedTemplate}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className={`flex-1 px-4 py-2 rounded-full bg-gray-100 text-sm outline-none 
            ${selectedFile || selectedTemplate ? "opacity-40 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:bg-white"}
            transition-all`}
        />

        {/* SEND BUTTON */}
        <button
          onClick={handleSendClick}
          disabled={!message.trim() && !selectedFile && !selectedTemplate}
          className="p-2 rounded-full transition-all disabled:opacity-50 hover:bg-blue-100"
        >
          <Send size={20} className="text-blue-500" />
        </button>
      </div>

      {/* PLACEHOLDER DIALOG */}
      {showPlaceholderDialog && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Fill Template Variables</h3>
              <p className="text-sm text-gray-600 mt-1">Template: {selectedTemplate.name}</p>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {selectedTemplate.placeholders.map((placeholder, index) => (
                <div key={placeholder} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Variable {index + 1} ({placeholder.replace(/_/g, " ")})
                  </label>
                  <input
                    type="text"
                    placeholder={`Enter value for variable ${index + 1}`}
                    value={placeholderValues[placeholder] || ""}
                    onChange={(e) => setPlaceholderValues(prev => ({
                      ...prev,
                      [placeholder]: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPlaceholderDialog(false);
                  setPlaceholderValues({});
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceholderSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Send Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};