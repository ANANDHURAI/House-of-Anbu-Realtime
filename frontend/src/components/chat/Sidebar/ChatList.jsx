import AxiosInstance from "../../../api/AxiosInterCepters";
import { useEffect, useState } from "react";

function ChatList({ onSelectChat }) {
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
  <div className="relative">
    {chats.length === 0 ? (
      <div className="p-12 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse opacity-20"></div>
          <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <p className="text-slate-400 font-medium">No chats yet</p>
        <p className="text-slate-300 text-sm mt-1">Start a conversation!</p>
      </div>
    ) : (
      <div className="divide-y divide-slate-100">
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="group relative p-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 cursor-pointer transition-all duration-300 flex items-center gap-4"
            style={{
              animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
            }}
          >
           
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
            
         
            <div 
              className="relative flex-shrink-0 cursor-pointer transform group-hover:scale-110 transition-transform duration-300"
              onClick={(e) => handleProfileClick(e, chat.other_user)}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-0 group-hover:opacity-75 blur transition-opacity duration-300"></div>
              {chat.other_user?.profile_image ? (
                <img
                  src={chat.other_user.profile_image}
                  alt={chat.other_user.name}
                  className="relative w-14 h-14 rounded-full object-cover ring-2 ring-white group-hover:ring-emerald-300 transition-all duration-300 shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              ) : (
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-lg ring-2 ring-white group-hover:ring-emerald-300 transition-all duration-300">
                  {chat.other_user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>

           
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors duration-300 truncate text-base">
                  {chat.other_user?.name}
                </h3>
                {chat.last_message_time && (
                  <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                    {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300 truncate">
                {chat.last_message || "Start the conversation..."}
              </p>
            </div>

           
            {chat.unread_count > 0 && (
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 px-2.5 flex items-center justify-center shadow-lg">
                  {chat.unread_count > 99 ? '99+' : chat.unread_count}
                </div>
              </div>
            )}

            
            <svg 
              className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    )}

   
    {selectedProfile && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        onClick={() => setSelectedProfile(null)}
      >
        <div 
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
         
          <button
            onClick={() => setSelectedProfile(null)}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:rotate-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center">
         
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
              {selectedProfile.profile_image ? (
                <img
                  src={selectedProfile.profile_image}
                  alt={selectedProfile.name}
                  className="relative w-32 h-32 rounded-full object-cover ring-4 ring-emerald-200 shadow-2xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              ) : (
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white flex items-center justify-center text-5xl font-bold ring-4 ring-emerald-200 shadow-2xl">
                  {selectedProfile.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
            </div>

      
            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
              {selectedProfile.name}
            </h2>
            
            <div className="flex items-center gap-2 text-slate-500 mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{selectedProfile.email}</span>
            </div>
            
            {selectedProfile.about_me && (
              <div className="w-full">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-slate-600">About</h3>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200 shadow-inner">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {selectedProfile.about_me}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    <style jsx>{`
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `}</style>
  </div>
);
}

export default ChatList;