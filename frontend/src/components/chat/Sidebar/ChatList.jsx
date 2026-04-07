import AxiosInstance from "../../../api/AxiosInterCepters";
import { useEffect, useState } from "react";
import { MessageSquare, ChevronRight, User } from "lucide-react";

function ChatList({ onSelectChat, activeChatId }) {
  const [chats, setChats] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    fetchChats();
    const handleRefresh = () => fetchChats();
    window.addEventListener("refreshChatList", handleRefresh);
    return () => window.removeEventListener("refreshChatList", handleRefresh);
  }, []);

  const fetchChats = async () => {
    try {
      const response = await AxiosInstance.get("/chat/chat-list/");
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleProfileClick = (e, user) => {
    e.stopPropagation();
    setSelectedProfile(user);
  };

  return (
    <div className="relative h-full px-4 py-2 bg-[#0a0a0a]">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-40">
          <MessageSquare size={48} className="text-[#d4af37] mb-4" />
          <p className="text-[#d4af37] font-medium tracking-widest uppercase text-[10px]">No Conversations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat, index) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-500 border ${
                  isActive 
                  ? "bg-[#161616] border-[#d4af37]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
                  : "bg-[#0f0f0f] border-white/5 hover:bg-[#161616] hover:border-[#d4af37]/20"
                }`}
                style={{
                  animation: `slideIn 0.4s ease-out ${index * 0.05}s both`
                }}
              >
               
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#d4af37] rounded-r-full" />
                )}

                <div className="flex items-center gap-4">
                  {/* Avatar Container */}
                  <div 
                    className="relative flex-shrink-0"
                    onClick={(e) => handleProfileClick(e, chat.other_user)}
                  >
                    <div className={`absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 ${isActive ? 'bg-[#d4af37]/30 opacity-100' : 'bg-[#d4af37]/10'}`} />
                    {chat.other_user?.profile_image ? (
                      <img
                        src={chat.other_user.profile_image}
                        alt={chat.other_user.name}
                        className={`relative w-12 h-12 rounded-full object-cover border-2 transition-all duration-500 ${
                          isActive ? 'border-[#d4af37]' : 'border-white/10 group-hover:border-[#d4af37]/50'
                        }`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                        }}
                      />
                    ) : (
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#1e1e1e] to-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#d4af37] font-bold">
                        {chat.other_user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Status Dot */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a] shadow-sm"></div>
                  </div>

                  {/* Chat Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-sm font-bold truncate transition-colors duration-300 ${
                        isActive ? 'text-[#d4af37]' : 'text-gray-200 group-hover:text-[#d4af37]'
                      }`}>
                        {chat.other_user?.name}
                      </h3>
                      {chat.last_message_time && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-500 truncate group-hover:text-gray-400 transition-colors">
                        {chat.last_message || "Start a golden chat..."}
                      </p>
                      
                      {/* Unread Count Badge */}
                      {chat.unread_count > 0 && (
                        <div className="bg-[#d4af37] text-black text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse ml-2 shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                          {chat.unread_count}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={14} className={`hidden md:block transition-all duration-300 ${
                    isActive ? 'text-[#d4af37] translate-x-0' : 'text-gray-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

     
      {selectedProfile && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedProfile(null)}
        >
          <div 
            className="bg-[#121212] border border-[#d4af37]/30 rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
           
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />

            <div className="flex flex-col items-center relative z-10">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-[#d4af37]/20 rounded-full blur-xl animate-pulse" />
                <img
                  src={selectedProfile.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  className="relative w-28 h-28 rounded-full object-cover border-2 border-[#d4af37]"
                  alt={selectedProfile.name}
                />
              </div>

              <h2 className="text-xl font-black text-white tracking-tight">{selectedProfile.name}</h2>
              <p className="text-[#d4af37] text-[10px] uppercase tracking-widest font-bold mb-6">{selectedProfile.email}</p>
              
              <div className="w-full bg-[#0a0a0a] rounded-2xl p-4 border border-white/5">
                <p className="text-gray-400 text-xs text-center leading-relaxed">
                  {selectedProfile.about_me || "A mysterious House of Anbu member."}
                </p>
              </div>

              <button 
                onClick={() => setSelectedProfile(null)}
                className="mt-8 px-6 py-2 bg-[#d4af37] text-black text-xs font-black uppercase rounded-full hover:bg-white transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ChatList;