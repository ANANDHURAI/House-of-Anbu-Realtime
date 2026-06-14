import React, { useEffect, useState, useRef } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";
import { WS_URL } from "../../config/api";
import { Send, Users, MoreVertical , UserPlus } from "lucide-react";
import AddMembersModal from "./AddMembersModal";


function GroupChatRoom({ room, currentUser }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id;
  const roomId = room?.id;

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;
    
    const fetchMessages = async () => {
      try {
        const res = await AxiosInstance.get(`/chat/rooms/${roomId}/messages/`);
        setMessages(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch room messages:", err);
        setLoading(false);
      }
    };
    
    fetchMessages();

    const token = localStorage.getItem("access");
    const ws = new WebSocket(`${WS_URL}/ws/room/${roomId}/?token=${token}`);
    setSocket(ws);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => ws.close();
  }, [roomId]);


  const sendMessage = async () => {
    if (!socket || input.trim() === "") return;
    socket.send(JSON.stringify({ message: input, sender_id: currentUserId }));
    setInput("");
    
    window.dispatchEvent(new CustomEvent('refreshChatList'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-gray-200">
      
      
      <div className="bg-[#161616] border-b border-[#2a2a2a] px-6 py-4 shadow-xl z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa8a2e] flex items-center justify-center text-black font-bold border-2 border-[#d4af37]/50">
                <Users size={24} />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#161616]"></div>
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide">{room.name}</h2>
              <p className="text-[10px] text-[#d4af37] uppercase tracking-widest font-semibold">Group Chat</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] hover:bg-[#d4af37]/10 text-[#d4af37] border border-[#2a2a2a] rounded-xl transition-all text-xs font-bold tracking-wide"
            >
                <UserPlus size={16} /> ADD
            </button>
            <button className="p-3 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 border border-[#2a2a2a] transition-all">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] scrollbar-thin scrollbar-thumb-[#2a2a2a]">
        
        {messages.length === 0 ? (
           <div className="flex justify-center items-center h-full text-gray-500 text-sm">
             Be the first to send a message in {room.name}!
           </div>
        ) : (
            messages.map((msg, idx) => {
            
            const isCurrentUser = String(msg.sender_id) === String(currentUser?.id) || msg.sender_name === currentUser?.name;

            return (
                <div key={idx} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-lg relative ${
                    isCurrentUser 
                    ? "bg-gradient-to-br from-[#d4af37] to-[#aa8a2e] text-black rounded-tr-none font-medium" 
                    : "bg-[#1e1e1e] text-gray-200 border border-[#2a2a2a] rounded-tl-none"
                }`}>
                    {/* Show sender name for group chats if it's not the current user */}
                    {!isCurrentUser && (
                        <p className="text-[10px] font-bold text-[#d4af37] mb-1 tracking-wider uppercase">
                            {msg.sender_name}
                        </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 opacity-70 ${isCurrentUser ? "text-black/70" : "text-[#d4af37]/70"}`}>
                    <span className="text-[9px] font-bold">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>
                </div>
                </div>
            );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      
      <div className="p-5 bg-[#161616] border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto flex items-center gap-3 bg-[#0a0a0a] p-2 rounded-2xl border border-[#2a2a2a]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Write a message to the group..."
            className="flex-1 bg-transparent px-4 py-2 text-sm text-white focus:outline-none placeholder:text-gray-600"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-[#d4af37] text-black p-3 rounded-xl hover:bg-[#f3cf58] disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      {showAddModal && (
        <AddMembersModal 
          room={room} 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </div>
  );
}

export default GroupChatRoom;