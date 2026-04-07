import React, { useState, useEffect } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";
import { useNavigate } from "react-router-dom";
import Search from "../../components/register/Search";
import ChatRoom from "./ChatRoomPage";
import ChatList from "../../components/chat/Sidebar/ChatList";
import IncomingCallModal from "../video/IncomingCallModal";
import ProfilePanel from "../../components/profile/ProfilePanel";
import { WS_URL } from "../../config/api";
import { LogOut, History, User as UserIcon, MessageSquare } from "lucide-react";

function HomePage() {
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [refreshProfile, setRefreshProfile] = useState(0);

  useEffect(() => { fetchUserProfile(); }, [refreshProfile]);

  const fetchUserProfile = async () => {
    try {
      const res = await AxiosInstance.get("/auth/profile/");
      setUser(res.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("access");
    const notificationWs = new WebSocket(`${WS_URL}/ws/notifications/?token=${token}`);
    notificationWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'refresh_chat_list' || data.action === 'refresh') {
        window.dispatchEvent(new CustomEvent('refreshChatList'));
      }
      if (data.type === 'incoming_call') setIncomingCall(data);
      else if (data.type === 'call_cancelled' || data.type === 'call_ended') setIncomingCall(null);
    };
    return () => notificationWs.close();
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSelectChat = (chatOrId, chatName) => {
    if (typeof chatOrId === 'object') {
      setActiveChat(chatOrId.id);
      setActiveChatName(chatOrId.other_user.name);
      setActiveChatUser(chatOrId.other_user);
    } else {
      setActiveChat(chatOrId);
      setActiveChatName(chatName);
      setActiveChatUser(null);
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      
      {showProfile && (
        <ProfilePanel 
          user={user} onClose={() => setShowProfile(false)} onLogout={handleLogout}
          onProfileUpdated={(u) => { setUser(u); setRefreshProfile(p => p + 1); }}
        />
      )}

      
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[380px] bg-[#0f0f0f] border-r border-[#2a2a2a] z-30 shadow-2xl`}>
        
       
        <div className="p-6 bg-gradient-to-b from-[#161616] to-[#0f0f0f]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfile(true)}>
              <div className="w-12 h-12 rounded-full border-2 border-[#d4af37] p-0.5 group-hover:rotate-12 transition-all duration-500">
                <img 
                  src={user.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                  className="w-full h-full rounded-full object-cover" 
                  alt="me" 
                />
              </div>
              <div>
                <p className="text-xs text-[#d4af37] font-bold uppercase tracking-widest">Premium</p>
                <h3 className="font-bold text-white group-hover:text-[#d4af37] transition-colors">{user.name}</h3>
              </div>
            </div>
            
            <div className="flex gap-1">
              <button onClick={() => navigate('/call-history')} className="p-2 hover:bg-[#d4af37] hover:text-black rounded-lg transition-all text-[#d4af37]">
                <History size={18} />
              </button>
              <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all text-gray-500">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <Search onSelectChat={handleSelectChat} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-2">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-4">Direct Messages</h4>
            <ChatList onSelectChat={handleSelectChat} />
          </div>
        </div>
      </div>

      
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-1 flex-col relative`}>
        {activeChat ? (
          <ChatRoom chatId={activeChat} chatName={activeChatName} currentUser={user} otherUser={activeChatUser} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-10">
            <div className="w-24 h-24 bg-[#161616] border border-[#d4af37]/30 rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <MessageSquare size={48} className="text-[#d4af37] -rotate-12" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">House of <span className="text-[#d4af37]">Anbu</span></h2>
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed">Select a conversation from the sidebar to start messaging with end-to-end encryption style security.</p>
            
            <div className="mt-12 grid grid-cols-3 gap-8 opacity-40">
                <div className="flex flex-col items-center gap-2"><div className="w-1 h-1 bg-[#d4af37] rounded-full"></div><span className="text-[10px] uppercase tracking-widest">Secure</span></div>
                <div className="flex flex-col items-center gap-2"><div className="w-1 h-1 bg-[#d4af37] rounded-full"></div><span className="text-[10px] uppercase tracking-widest">Fast</span></div>
                <div className="flex flex-col items-center gap-2"><div className="w-1 h-1 bg-[#d4af37] rounded-full"></div><span className="text-[10px] uppercase tracking-widest">Private</span></div>
            </div>
          </div>
        )}
      </div>

      {incomingCall && (
        <IncomingCallModal callData={incomingCall} onReject={() => setIncomingCall(null)} onCallEnded={() => setIncomingCall(null)} />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4af37; }
      `}</style>
    </div>
  );
}

export default HomePage;