"use client";

import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from "../components/ui/select";

import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  ArrowUpDown,
  MessageCircleReply,
  ChevronLeft,
  ChevronRight,
  Lock,
  Send,
  Info,
  Search
} from "lucide-react";

import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/auth";

// ---------------------- Types ----------------------
export type ChatHistoryItem = {
  id: string;
  chat: string;
  name: string;
  number: string;
  template: string;
  status: string;
  message: string;
  created_at: string;
  activity: string | null;
  agent: string | null
  error_details:string | null
};

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

// ---------------------- Styles ----------------------
const btnStyle = {
  textTransform: "none" as const,
  fontFamily: "system-ui",
  borderRadius: "6px",
  paddingInline: "18px",
  paddingBlock: "6px",
  fontSize: "14px",
  fontWeight: 600,
  backgroundColor: "rgba(0,128,0,0.08)",
  color: "#2E7D32",
  display: "flex",
  gap: "8px",
  cursor: "pointer",
};

// ---------------------- Open chat window ----------------------
const fncTOopenChatWindow = (item: ChatHistoryItem) => {
  // if (item.activity === "YES") {
  useChatStore.getState().openChat(item.chat, item.number);
  // }
};

// ---------------------- Table Columns ----------------------
const columns: ColumnDef<ChatHistoryItem>[] = [
  {
    accessorKey: "chat",
    header: () => "Chat",
    cell: ({ row }) => {
      const item = row.original;
      const enabled = item.activity === "YES";
      return (
        <div className="flex items-center gap-2">
          <MessageCircleReply
            className={enabled ? "text-green-500 cursor-pointer" : "text-gray-400"}
            onClick={() => fncTOopenChatWindow(item)}
            size={18}
            aria-label="Edit"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Name <ArrowUpDown size={14} />
      </Button>
    ),
    cell: ({ row }) => row.original.name || "Unknown",
  },
  { accessorKey: "number", header: () => "Number" },
  { accessorKey: "agent_id", header: () => "Agent" },
  { accessorKey: "template", header: () => "Type" },
  {
    accessorKey: "status",
    header: () => "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const color =
        s === "sent"
          ? "text-blue-500"
          : s === "delivered"
            ? "text-green-500"
            : s === "read"
              ? "text-purple-500"
              : "text-red-500";
      return <span className={color}>{s}</span>;
    },
  },
  { accessorKey: "error_details", header: () => "Error" },
  { accessorKey: "created_at", header: () => "Date" },
  {
    accessorKey: "activity",
    header: () => "Chat Closed?",
    cell: ({ row }) => {
      const act = row.original.activity;
      // Show "Open" when activity === "YES", otherwise "Closed"
      const isOpen = act === "YES";
      return (
        <div className="flex items-center gap-2">
          {isOpen ? (
            <span className="text-green-600 font-medium">Open</span>
          ) : (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <Lock size={14} /> Closed
            </span>
          )}
        </div>
      );
    },
  },
];

// ================================================================
//                MAIN COMPONENT START
// ================================================================
const apiUrl = import.meta.env.VITE_API_URL;

export default function ChatHistoryTable() {
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [data, setData] = useState<ChatHistoryItem[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  // Form inputs
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  // Message type selection
  const [messageType, setMessageType] = useState<"text" | "template">("text");
  const [textMessage, setTextMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  // Template data
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [showPlaceholderDialog, setShowPlaceholderDialog] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [selectedTemplateData, setSelectedTemplateData] = useState<TemplateInfo | null>(null);

  const AGENT_ID = useAuthStore((s) => s.agentId);

  // ---------------------- Extract Placeholders from Template Body ----------------------
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

  // ---------------------- Fetch templates ----------------------
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

            if (t.raw?.structure?.buttons && Array.isArray(t.raw.structure.buttons)) {
              buttons = t.raw.structure.buttons;
            }

            return {
              name: t.name,
              language: t.language,
              status: t.raw?.status || t.status || "UNKNOWN",
              placeholders,
              buttons,
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

  const fetchHistory = () => {
    fetch(`${apiUrl}/history?agent_id=${AGENT_ID}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        const rows = res.data;

        const mapped: ChatHistoryItem[] = rows.map((row: any) => ({
          id: String(row.id),
          chat: row.mobile_no,
          name: row.customer_name || "Unknown",
          number: row.mobile_no,
          template: row.action || "-",
          agent_id: row.agent_id,
          status: row.status || "sent",
          message: row.message,
          error_details:row.error_details,
          created_at: new Date(
            row.api_call_time.replace("Z", "")
          ).toLocaleString("en-IN")
,          
        
          activity: row.activity ?? null,
        }));

        setData(mapped);
      })
      .catch(err => console.error("Error fetching history:", err));
  };

  useEffect(() => {
    if(!AGENT_ID)return;
    fetchTemplates();
    fetchHistory();
    const intervalId = setInterval(() => {
      fetchHistory();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [AGENT_ID]);

  // useEffect(() => {
  //   if (AGENT_ID) {
  //     fetchHistory();
  //   }
  // }, [AGENT_ID]);

  // ---------------------- Send Message (Text or Template) ----------------------
  const sendMessage = () => {
    if (number.length !== 10) {
      alert("Please enter a valid 10-digit number");
      return;
    }
    if (!name || !number) return alert("Please enter name and number");

    if (messageType === "text") {
      if (!textMessage.trim()) return alert("Please enter a message");

      fetch(apiUrl + "/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: AGENT_ID,
          customer_name: name,
          receiver: number,
          text: textMessage,
          type: 'text'
        }),
      })
        .then(() => {
          fetchHistory();
          setName("");
          setNumber("");
          setTextMessage("");
        })
        .catch(err => console.error("Error sending message:", err));
    } else {
      if (!selectedTemplate) return alert("Please select a template");

      const template = templates.find(t => t.name === selectedTemplate);
      if (!template) return;

      setSelectedTemplateData(template);

      if (template.placeholders && template.placeholders.length > 0) {
        setShowPlaceholderDialog(true);
      } else {
        sendTemplateMessage(selectedTemplate, {});
      }
    }
  };

  // ---------------------- Send Template Message ----------------------
  const sendTemplateMessage = (templateName: string, placeholders: Record<string, string>) => {
    const template = templates.find(t => t.name === templateName);
    if (!template) return;

    const payload: any = {
      agent_id: AGENT_ID,
      customer_name: name,
      mobile_no: number,
      templateName: templateName,
      language: template.language,
      category: template.category,
    };

    if (Object.keys(placeholders).length > 0) {
      payload.placeholders = placeholders;
    }

    if (template.buttons && template.buttons.length > 0) {
      payload.buttons = template.buttons;
    }

    fetch(apiUrl + "/send-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        fetchHistory();
        setName("");
        setNumber("");
        setSelectedTemplate("");
        setPlaceholderValues({});
        setShowPlaceholderDialog(false);
        setSelectedTemplateData(null);
      })
      .catch(err => console.error("Error sending template:", err));
  };

  // ---------------------- Handle Placeholder Submit ----------------------
  const handlePlaceholderSubmit = () => {
    if (!selectedTemplateData) return;

    const allFilled = selectedTemplateData.placeholders.every(p => placeholderValues[p]?.trim());
    if (!allFilled) return alert("Please fill all placeholder values");

    sendTemplateMessage(selectedTemplate, placeholderValues);
  };

  // ---------------------- Table Setup ----------------------
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting

  });


  return (
    <div className="p-4 space-y-4">
      {/* MESSAGE SENDING FORM */}
      <div className="bg-white shadow-sm p-4 rounded-sm space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="Customer Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Phone Number (10 digits)"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            maxLength={10}
          />

          <Select value={messageType} onValueChange={(val: "text" | "template") => {
            setMessageType(val);
            setTextMessage("");
            setSelectedTemplate("");
          }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Message Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Message</SelectItem>
              <SelectItem value="template">Template Message</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {messageType === "text" ? (
            <Textarea
              placeholder="Type your message here..."
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          ) : (
            <div className="space-y-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-xs text-gray-500">({t.language})</span>
                        {t.placeholders.length > 0 && (
                          <span className="text-xs text-blue-600">
                            {t.placeholders.length} vars
                          </span>
                        )}
                        {t.buttons.length > 0 && (
                          <span className="text-xs text-purple-600">
                            {t.buttons.length} buttons
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-blue-900">
                        Template: {selectedTemplate}
                      </p>
                      {templates.find(t => t.name === selectedTemplate)?.placeholders.length! > 0 && (
                        <p className="text-blue-700">
                          This template requires {templates.find(t => t.name === selectedTemplate)?.placeholders.length} variable(s)
                        </p>
                      )}
                      {templates.find(t => t.name === selectedTemplate)?.buttons.length! > 0 && (
                        <div className="text-blue-700">
                          <p className="font-medium">Interactive buttons:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {templates.find(t => t.name === selectedTemplate)?.buttons.map((btn, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                                {btn.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          style={btnStyle}
          className="bg-green-100 text-green-800 hover:bg-green-200 w-full"
          onClick={sendMessage}
        >
          <Send size={16} />
          Send {messageType === "text" ? "Message" : "Template"}
        </Button>
      </div>

      {/* PLACEHOLDER DIALOG */}
      <Dialog open={showPlaceholderDialog} onOpenChange={setShowPlaceholderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fill Template Variables</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTemplateData?.placeholders.map((placeholder, index) => (
              <div key={placeholder} className="space-y-2">
                <Label htmlFor={placeholder}>
                  Variable {index + 1} ({placeholder.replace(/_/g, " ")})
                </Label>
                <Input
                  id={placeholder}
                  placeholder={`Enter value for variable ${index + 1}`}
                  value={placeholderValues[placeholder] || ""}
                  onChange={(e) => setPlaceholderValues(prev => ({
                    ...prev,
                    [placeholder]: e.target.value
                  }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPlaceholderDialog(false);
                setPlaceholderValues({});
                setSelectedTemplateData(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceholderSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Send Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHAT HISTORY TABLE */}



      <div className="flex flex-col items-end align-end justify-end ">
        <div className="mb-2 relative">
          <Search
            size={16}
            className="absolute text-black left-3 top-1/2 -translate-y-1/2 "
          />
          <Input
            placeholder="Search chats..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="
        h-10
        pl-9
        text-sm
        border-gray-300
        focus-visible:ring-2
        focus-visible:ring-blue-500
      "
          />
        </div>


        <Table className="border">
          <TableHeader className="bg-blue-50">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6">
                  No chats found for this agent.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-600">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

      </div>
    </div >
  );
}