
import React, { useState, useEffect , useRef } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";
import { useNavigate } from "react-router-dom";
import Search from "../../components/register/Search";
import ChatRoom from "./ChatRoomPage";
import ChatList from "../../components/chat/Sidebar/ChatList";
import IncomingCallModal from "../video/IncomingCallModal";
import ProfilePanel from "../../components/profile/ProfilePanel";

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

  const callNotificationSocket = useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, [refreshProfile]);

  const fetchUserProfile = async () => {
    try {
      const res = await AxiosInstance.get("/auth/profile/");
      setUser(res.data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("access");
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/call-notifications/?token=${token}`);
    callNotificationSocket.current = ws;

    ws.onopen = () => {
      console.log("Connected to call notifications");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Call notification received:", data);
      
      if (data.type === 'incoming_call') {
        setIncomingCall(data);
      } else if (data.type === 'call_cancelled') {
        
        console.log('Call cancelled by caller, closing modal');
        setIncomingCall(null);
      } else if (data.type === 'call_ended') {
      
        console.log('Call ended notification received');
        setIncomingCall(null);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from call notifications");
    };

    ws.onerror = (error) => {
      console.error("Call notification error:", error);
    };


    const notificationWs = new WebSocket(`ws://127.0.0.1:8000/ws/user-notifications/?token=${token}`);
    
    notificationWs.onopen = () => {
      console.log("Connected to user notifications");
    };
    
    notificationWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'refresh') {
        window.dispatchEvent(new CustomEvent('refreshChatList'));
      }
    };

    notificationWs.onclose = () => {
      console.log("Disconnected from user notifications");
    };

    notificationWs.onerror = (error) => {
      console.error("User notification error:", error);
    };

    return () => {
      ws?.close();
      notificationWs?.close();
    };
  }, [user]);

  

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <p className="text-gray-600 mb-4">Unable to load user data. Please log in again.</p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 overflow-hidden">
    
      {showProfile && (
        <ProfilePanel 
          user={user} 
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
            setRefreshProfile(prev => prev + 1);
          }}
        />
      )}

     
      <div
        className={`${
          activeChat ? "hidden md:flex" : "flex"
        } md:flex flex-col w-full md:w-96 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl`}
      >
        
        <div className="flex-shrink-0 relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-5 shadow-lg overflow-hidden z-20">
         
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-32 translate-y-32 animate-pulse delay-700"></div>
          </div>

          <div className="relative flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setShowProfile(true)}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-white rounded-full opacity-0 group-hover:opacity-25 blur transition-opacity duration-300"></div>
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt="Profile"
                    className="relative w-12 h-12 rounded-full object-cover border-3 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                    }}
                  />
                ) : (
                  <div className="relative w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold border-3 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              </div>
              <div>
                <h2 className="font-bold text-lg group-hover:scale-105 transition-transform duration-300 origin-left">
                  {user.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                  <span>Active now</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/call-history')}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-300 group relative"
                title="Call History"
              >
                <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <svg className="w-5 h-5 relative group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-300 group relative"
                title="Logout"
              >
                <div className="absolute inset-0 bg-white rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <svg
                  className="w-5 h-5 relative group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search + Chat List Container - This is the key fix */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Search - Sticky at top */}
          <div className="flex-shrink-0 z-20 bg-white/50 backdrop-blur-sm">
            <Search onSelectChat={handleSelectChat} />
          </div>

          {/* Chat List - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-transparent hover:scrollbar-thumb-emerald-400">
            <ChatList onSelectChat={handleSelectChat} />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          activeChat ? "flex" : "hidden md:flex"
        } flex-1 flex flex-col relative`}
      >
        {activeChat ? (
          <>
            {/* Mobile Back Button */}
            <div className="md:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-sm">
              <button
                onClick={() => setActiveChat(null)}
                className="flex items-center gap-2 text-emerald-600 font-semibold group"
              >
                <svg
                  className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back to chats</span>
              </button>
            </div>

            <ChatRoom
              chatId={activeChat}
              chatName={activeChatName}
              currentUser={user}
              otherUser={activeChatUser}
            />
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative text-center p-8 max-w-lg z-10">
              {/* Main Icon */}
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse opacity-20 blur-2xl"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                  <svg
                    className="w-20 h-20 text-emerald-600 animate-bounce-slow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>

              {/* Welcome Text */}
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                Welcome to House of Anbu
              </h2>
              <p className="text-slate-600 text-lg mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                Connect with friends and start meaningful conversations
              </p>

              {/* Quick Tips Card */}
              <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Quick Start Guide</h3>
                </div>
                
                <ul className="text-left space-y-4">
                  <li className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 font-medium">Search for users</p>
                      <p className="text-slate-500 text-sm">Find friends in the sidebar search</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 font-medium">Start chatting</p>
                      <p className="text-slate-500 text-sm">Click on any user to begin</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 font-medium">Real-time messages</p>
                      <p className="text-slate-500 text-sm">Instant delivery with WebSocket</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          callData={incomingCall}
          onReject={() => setIncomingCall(null)}
          onCallEnded={(message) => {
            if (message) alert(message);
            setIncomingCall(null);
          }}
        />
      )}

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #6ee7b7;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #34d399;
        }
      `}</style>
    </div>
  );
}

export default HomePage;