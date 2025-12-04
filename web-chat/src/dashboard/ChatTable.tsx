// "use client";

// import { useEffect, useState } from "react";
// import {
//     Table, TableBody, TableCell, TableHead,
//     TableHeader, TableRow
// } from "../components/ui/table";

// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import type { ColumnDef, SortingState } from "@tanstack/react-table";
// import {
//     flexRender,
//     getCoreRowModel,
//     getSortedRowModel,
//     useReactTable,
// } from "@tanstack/react-table";

// import {
//     ArrowUpDown,
//     MessageCircleReply,
//     Send
// } from "lucide-react";

// import {
//     Select, SelectTrigger, SelectValue,
//     SelectContent, SelectItem
// } from "../components/ui/select";

// import { useChatStore } from "../store/chatStore";
// import { useAuthStore } from "../store/auth";


// // ---------------------- Types ----------------------
// export type ChatHistoryItem = {
//     id: string;
//     chat: string;
//     name: string;
//     number: string;
//     template: string;
//     status: string;
//     message: string;
//     created_at: string;
// };

// // ---------------------- Styles ----------------------
// const btnStyle = {
//     textTransform: "none",
//     fontFamily: "system-ui",
//     borderRadius: "6px",
//     paddingInline: "18px",
//     paddingBlock: "6px",
//     fontSize: "14px",
//     fontWeight: 600,
//     backgroundColor: "rgba(0,128,0,0.08)",
//     color: "#2E7D32",
//     display: "flex",
//     gap: "8px",
//     cursor: "pointer",
// };

// // ---------------------- Open chat window ----------------------
// const fncTOopenChatWindow = (item: ChatHistoryItem) => {
//     useChatStore.getState().openChat(item.chat, item.number);
// };

// // ---------------------- Table Columns ----------------------
// const columns: ColumnDef<ChatHistoryItem>[] = [
//     {
//         accessorKey: "chat",
//         header: () => "Chat",
//         cell: ({ row }) => {
//             const item = row.original;
//             return (
//                 <MessageCircleReply
//                     className="text-green-500 cursor-pointer"
//                     onClick={() => fncTOopenChatWindow(item)}
//                     size={18}
//                 />
//             );
//         },
//     },
//     {
//         accessorKey: "name",
//         header: ({ column }) => (
//             <Button variant="ghost" onClick={() => column.toggleSorting()}>
//                 Name <ArrowUpDown size={14} />
//             </Button>
//         ),
//     },
//     { accessorKey: "number", header: () => "Number" },
//     { accessorKey: "template", header: () => "Template" },
//     {
//         accessorKey: "status",
//         header: () => "Status",
//         cell: ({ row }) => {
//             const s = row.original.status;
//             const color =
//                 s === "sent"
//                     ? "text-blue-500"
//                     : s === "delivered"
//                     ? "text-green-500"
//                     : s === "read"
//                     ? "text-purple-500"
//                     : "text-red-500";
//             return <span className={color}>{s}</span>;
//         },
//     },
//     { accessorKey: "created_at", header: () => "Date" },
// ];

// // ================================================================
// //                MAIN COMPONENT START
// // ================================================================
// export default function ChatHistoryTable() {
//     const [data, setData] = useState<ChatHistoryItem[]>([]);
//     const [sorting, setSorting] = useState<SortingState>([]);
//     const [name, setName] = useState("");
//     const [number, setNumber] = useState("");
//     const [template, setTemplate] = useState("");

//     const [templates, setTemplates] = useState<string[]>([]);
//     // const AGENT_ID = "AGT001"; // later you pass dynamically
//     const AGENT_ID=useAuthStore((s)=>s.agentId)

//     // ---------------------- Fetch templates ----------------------
//     useEffect(() => {
//         fetch("http://localhost:3000/api/chat/get-template")
//             .then((r) => r.json())
//             .then((data) => setTemplates(data.templates || []));
//     }, []);

//     // ---------------------- Fetch History From DB (Agent Based) ----------------------
//     useEffect(() => {
//         fetch(`http://localhost:3000/api/chat/history?agent_id=${AGENT_ID}`)
//             .then((r) => r.json())
//             .then((res) => {
//                 if (!res.success) return;
//                 const rows = res.data;

//                 // Convert DB → table structure
//                 const mapped: ChatHistoryItem[] = rows.map((row: any) => ({
//                     id: String(row.id),
//                     chat: row.mobile_no, // chatId = mobile number
//                     name: row.customer_name || "Unknown",
//                     number: row.mobile_no,
//                     template: row.action || "-",
//                     status: row.status || "sent",
//                     message: row.message,
//                     created_at: new Date(row.update_time || row.api_call_time).toLocaleString(),
//                 }));

//                 setData(mapped);
//             });
//     }, []);

//     // ---------------------- Send Template Message ----------------------
//     const sendMessage = () => {
//         if (!name || !number || !template) return alert("Fill all fields");

//         fetch("http://localhost:3000/api/chats/send-template", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 agent_id: AGENT_ID,
//                 customer_name: name,
//                 mobile_no: number,
//                 template_name: template,
//             }),
//         });

//         // update UI instantly
//         setData((prev) => [
//             {
//                 id: String(Date.now()),
//                 chat: number,
//                 name,
//                 number,
//                 template,
//                 status: "sent",
//                 message: template,
//                 created_at: new Date().toLocaleString(),
//             },
//             ...prev,
//         ]);

//         setName("");
//         setNumber("");
//         setTemplate("");
//     };

//     // ---------------------- Table Setup ----------------------
//     const table = useReactTable({
//         data,
//         columns,
//         getCoreRowModel: getCoreRowModel(),
//         getSortedRowModel: getSortedRowModel(),
//         onSortingChange: setSorting,
//         state: { sorting },
//     });

//     return (
//         <div className="p-4 space-y-4">

//             {/* ---------------------- SEND TEMPLATE UI ---------------------- */}
//             <div className="grid grid-cols-4 gap-4 bg-white shadow-sm p-4 rounded-sm">
//                 <Input
//                     placeholder="Customer Name"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                 />
//                 <Input
//                     placeholder="Phone Number"
//                     value={number}
//                     onChange={(e) => setNumber(e.target.value)}
//                 />

//                 <Select value={template} onValueChange={setTemplate}>
//                     <SelectTrigger className="h-10">
//                         <SelectValue placeholder="Select Template" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         {templates.map((t) => (
//                             <SelectItem key={t} value={t}>
//                                 {t}
//                             </SelectItem>
//                         ))}
//                     </SelectContent>
//                 </Select>

//                 <Button
//                     style={btnStyle}
//                     className="bg-green-100 text-green-800 hover:bg-green-200"
//                     onClick={sendMessage}
//                 >
//                     <Send />
//                     Send
//                 </Button>
//             </div>

//             {/* ---------------------- CHAT TABLE ---------------------- */}
//             <Table className="border bg-white">
//                 <TableHeader className="bg-blue-50">
//                     {table.getHeaderGroups().map((group) => (
//                         <TableRow key={group.id}>
//                             {group.headers.map((header) => (
//                                 <TableHead key={header.id}>
//                                     {flexRender(header.column.columnDef.header, header.getContext())}
//                                 </TableHead>
//                             ))}
//                         </TableRow>
//                     ))}
//                 </TableHeader>

//                 <TableBody>
//                     {table.getRowModel().rows.length ? (
//                         table.getRowModel().rows.map((row) => (
//                             <TableRow key={row.id}>
//                                 {row.getVisibleCells().map((cell) => (
//                                     <TableCell key={cell.id}>
//                                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                                     </TableCell>
//                                 ))}
//                             </TableRow>
//                         ))
//                     ) : (
//                         <TableRow>
//                             <TableCell colSpan={columns.length} className="text-center py-6">
//                                 No chats found for this agent.
//                             </TableCell>
//                         </TableRow>
//                     )}
//                 </TableBody>
//             </Table>
//             {/* <ChatWidget/> */}
//         </div>
//     );
// }

"use client";

import { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "../components/ui/table";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    ArrowUpDown,
    MessageCircleReply,
    Send
} from "lucide-react";

import {
    Select, SelectTrigger, SelectValue,
    SelectContent, SelectItem
} from "../components/ui/select";

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
};

type TemplateInfo = {
    name: string;
    language: string;
    status: string;
    placeholders: string[];
};

// ---------------------- Styles ----------------------
const btnStyle = {
    textTransform: "none",
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
    useChatStore.getState().openChat(item.chat, item.number);
};

// ---------------------- Table Columns ----------------------
const columns: ColumnDef<ChatHistoryItem>[] = [
    {
        accessorKey: "chat",
        header: () => "Chat",
        cell: ({ row }) => {
            const item = row.original;
            return (
                <MessageCircleReply
                    className="text-green-500 cursor-pointer"
                    onClick={() => fncTOopenChatWindow(item)}
                    size={18}
                />
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
    },
    { accessorKey: "number", header: () => "Number" },
    { accessorKey: "template", header: () => "Template" },
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
    { accessorKey: "created_at", header: () => "Date" },
];

// ================================================================
//                MAIN COMPONENT START
// ================================================================
export default function ChatHistoryTable() {
    const [data, setData] = useState<ChatHistoryItem[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
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

    const AGENT_ID = useAuthStore((s) => s.agentId);

    // ---------------------- Fetch templates ----------------------
    const fetchTemplates = () => {
        fetch("http://localhost:3000/api/chat/get-template")
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.templates) {
                    setTemplates(data.templates);
                }
            })
            .catch(err => console.error("Error fetching templates:", err));
    }

    const fetchHistory = () => {
        fetch(`http://localhost:3000/api/chat/history?agent_id=${AGENT_ID}`)
            .then((r) => r.json())
            .then((res) => {
                if (!res.success) return;
                const rows = res.data;

                // Convert DB → table structure
                const mapped: ChatHistoryItem[] = rows.map((row: any) => ({
                    id: String(row.id),
                    chat: row.mobile_no,
                    name: row.customer_name || "Unknown",
                    number: row.mobile_no,
                    template: row.action || "-",
                    status: row.status || "sent",
                    message: row.message,
                    created_at: new Date(row.update_time || row.api_call_time).toLocaleString(),
                }));

                setData(mapped);
            })
            .catch(err => console.error("Error fetching history:", err));
    }
    useEffect(() => {
        fetchTemplates();
        fetchHistory()
    }, []);

    // ---------------------- Fetch History From DB (Agent Based) ----------------------
    useEffect(() => {


    }, [AGENT_ID]);

    // ---------------------- Send Message (Text or Template) ----------------------
    const sendMessage = () => {
        if (!name || !number) return alert("Please enter name and number");

        if (messageType === "text") {
            // Send text message
            if (!textMessage.trim()) return alert("Please enter a message");

            fetch("http://localhost:3000/api/chat/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent_id: AGENT_ID,
                    customer_name: name,
                    receiver: number,
                    text: textMessage,
                    type: 'text'
                }),
            });

            // Update UI
            // setData((prev) => [
            //     {
            //         id: String(Date.now()),
            //         chat: number,
            //         name,
            //         number,
            //         template: "Text Message",
            //         status: "sent",
            //         message: textMessage,
            //         created_at: new Date().toLocaleString(),
            //     },
            //     ...prev,
            // ]);
            fetchHistory()

            setName("");
            setNumber("");
            setTextMessage("");
        } else {
            // Template message - check for placeholders
            if (!selectedTemplate) return alert("Please select a template");

            const template = templates.find(t => t.name === selectedTemplate);
            if (!template) return;

            if (template.placeholders && template.placeholders.length > 0) {
                // Show dialog for placeholders
                setShowPlaceholderDialog(true);
            } else {
                // No placeholders, send directly
                sendTemplateMessage(selectedTemplate, {});
            }
        }
    };

    // ---------------------- Send Template Message ----------------------
    const sendTemplateMessage = (templateName: string, placeholders: Record<string, string>) => {
        fetch("http://localhost:3000/api/chats/send-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                agent_id: AGENT_ID,
                customer_name: name,
                mobile_no: number,
                template_name: templateName,
                placeholders: placeholders,
            }),
        });

        // Update UI
        // setData((prev) => [
        //     {
        //         id: String(Date.now()),
        //         chat: number,
        //         name,
        //         number,
        //         template: templateName,
        //         status: "sent",
        //         message: templateName,
        //         created_at: new Date().toLocaleString(),
        //     },
        //     ...prev,
        // ]);

        // Reset form
        setName("");
        setNumber("");
        setSelectedTemplate("");
        setPlaceholderValues({});
        setShowPlaceholderDialog(false);
    };

    // ---------------------- Handle Placeholder Submit ----------------------
    const handlePlaceholderSubmit = () => {
        const template = templates.find(t => t.name === selectedTemplate);
        if (!template) return;

        // Check all placeholders are filled
        const allFilled = template.placeholders.every(p => placeholderValues[p]?.trim());
        if (!allFilled) return alert("Please fill all placeholder values");

        sendTemplateMessage(selectedTemplate, placeholderValues);
    };

    // ---------------------- Table Setup ----------------------
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: { sorting },
    });

    return (
        <div className="p-4 space-y-4">

            {/* ---------------------- SEND MESSAGE UI ---------------------- */}
            <div className="bg-white shadow-sm p-4 rounded-sm space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        placeholder="Customer Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        placeholder="Phone Number"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
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
                            {/* <SelectItem value="template">Template Message</SelectItem> */}
                        </SelectContent>
                    </Select>
                </div>

                {/* Conditional rendering based on message type */}
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
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select Template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t.name} value={t.name}>
                                        {t.name} ({t.language})
                                        {t.placeholders.length > 0 && ` - ${t.placeholders.length} variables`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <Button
                    style={btnStyle}
                    className="bg-green-100 text-green-800 hover:bg-green-200 w-full"
                    onClick={sendMessage}
                >
                    <Send />
                    Send {messageType === "text" ? "Message" : "Template"}
                </Button>
            </div>

            {/* ---------------------- PLACEHOLDER DIALOG ---------------------- */}
            <Dialog open={showPlaceholderDialog} onOpenChange={setShowPlaceholderDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Fill Template Placeholders</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {templates.find(t => t.name === selectedTemplate)?.placeholders.map((placeholder) => (
                            <div key={placeholder} className="space-y-2">
                                <Label htmlFor={placeholder}>
                                    {placeholder.replace(/_/g, " ").toUpperCase()}
                                </Label>
                                <Input
                                    id={placeholder}
                                    placeholder={`Enter ${placeholder}`}
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

            {/* ---------------------- CHAT TABLE ---------------------- */}
            <Table className="border bg-white">
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
        </div>
    );
}