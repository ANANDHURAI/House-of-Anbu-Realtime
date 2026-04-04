import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../api/AxiosInterCepters";
import { WS_URL } from "../../config/api";
import { Phone, Video, Send, MoreVertical, Shield, PhoneMissed, VideoOff } from "lucide-react";

function ChatRoomPage({ chatId, chatName, currentUser, otherUser }) {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const markMessagesAsRead = useCallback(async () => {
    if (!chatId) return;
    try {
      await AxiosInstance.post(`/chat/${chatId}/mark-read/`);
      window.dispatchEvent(new CustomEvent('refreshChatList'));
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const fetchMessages = async () => {
      try {
        const res = await AxiosInstance.get(`/chat/${chatId}/messages/`);
        setMessages(res.data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchMessages();
    markMessagesAsRead();

    const token = localStorage.getItem("access");
    const ws = new WebSocket(`${WS_URL}/ws/chat/${chatId}/?token=${token}`);
    setSocket(ws);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
      if (data.sender_id !== currentUserId || data.message_type === 'call' || data.message_type === 'call_missed') {
        markMessagesAsRead();
      }
    };
    return () => ws.close();
  }, [chatId, currentUserId, markMessagesAsRead]);

  const sendMessage = async () => {
    if (!socket || input.trim() === "") return;
    socket.send(JSON.stringify({ message: input, sender_id: currentUserId }));
    setInput("");
    window.dispatchEvent(new CustomEvent('refreshChatList'));
  };

  const startVideoCall = async () => {
    try {
      let receiverId = otherUser?.id;
      if (!receiverId) {
        const chatDetailRes = await AxiosInstance.get(`/chat/chat-details/${chatId}/`);
        receiverId = chatDetailRes.data.other_user.id;
      }
      const res = await AxiosInstance.post("/videocall/start/", { receiver_id: receiverId });
      const { room_name, call_id } = res.data;
      sessionStorage.setItem('current_call_id', call_id);
      navigate(`/videocall/${room_name}`, { replace: true });
    } catch (error) {
      alert("Failed to start video call.");
    }
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
      {/* Header */}
      <div className="bg-[#161616] border-b border-[#2a2a2a] px-6 py-4 shadow-xl z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {otherUser?.profile_image ? (
                <img src={otherUser.profile_image} className="w-12 h-12 rounded-full object-cover border-2 border-[#d4af37]/50" alt="User" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#aa8a2e] flex items-center justify-center text-black font-bold">
                  {otherUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#161616]"></div>
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide">{chatName || otherUser?.name || "Chat"}</h2>
              <p className="text-[10px] text-[#d4af37] uppercase tracking-widest font-semibold">Active Session</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={startVideoCall} className="p-3 rounded-full bg-[#1e1e1e] hover:bg-[#d4af37] hover:text-black text-[#d4af37] transition-all duration-300 border border-[#2a2a2a]">
              <Video size={20} />
            </button>
            <button className="p-3 rounded-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 border border-[#2a2a2a]">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] scrollbar-thin scrollbar-thumb-[#2a2a2a]">
        {messages.map((msg, idx) => {
          const isCurrentUser = msg.sender === currentUserName || msg.sender_name === currentUserName || msg.sender_id === currentUserId;
          
          // --- Meaningful Call UI ---
          if (msg.message_type === 'call' || msg.message_type === 'call_missed') {
            const isMissed = msg.message_type === 'call_missed';
            return (
              <div key={idx} className="flex justify-center my-6 animate-in zoom-in-95 duration-300">
                <div className={`flex flex-col items-center gap-3 px-8 py-5 rounded-3xl border bg-[#161616] shadow-2xl min-w-[240px] ${
                  isMissed ? "border-red-500/20" : "border-[#d4af37]/20"
                }`}>
                  <div className={`p-4 rounded-full ${isMissed ? "bg-red-500/10 text-red-500" : "bg-[#d4af37]/10 text-[#d4af37]"}`}>
                    {isMissed ? <PhoneMissed size={28} /> : <Video size={28} className={!isCurrentUser ? "animate-pulse" : ""} />}
                  </div>
                  
                  <div className="text-center">
                    <h4 className={`text-sm font-bold uppercase tracking-widest ${isMissed ? "text-red-500" : "text-[#d4af37]"}`}>
                      {isMissed ? "Missed Call" : "Video Call"}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {isCurrentUser ? "You started the call" : `${chatName || "User"} called you`}
                    </p>
                  </div>

                  {isMissed && !isCurrentUser && (
                    <button 
                      onClick={startVideoCall}
                      className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/20"
                    >
                      Call Back
                    </button>
                  )}

                  <span className="text-[9px] text-gray-600 font-bold mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          }

          // --- Standard Message UI ---
          return (
            <div key={idx} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-lg relative ${
                isCurrentUser 
                  ? "bg-gradient-to-br from-[#d4af37] to-[#aa8a2e] text-black rounded-tr-none font-medium" 
                  : "bg-[#1e1e1e] text-gray-200 border border-[#2a2a2a] rounded-tl-none"
              }`}>
                <p className="text-sm leading-relaxed">{msg.message || msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 opacity-70 ${isCurrentUser ? "text-black/70" : "text-[#d4af37]/70"}`}>
                  <span className="text-[9px] font-bold">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 bg-[#161616] border-t border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto flex items-center gap-3 bg-[#0a0a0a] p-2 rounded-2xl border border-[#2a2a2a]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Write a message..."
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
    </div>
  );
}

export default ChatRoomPage;