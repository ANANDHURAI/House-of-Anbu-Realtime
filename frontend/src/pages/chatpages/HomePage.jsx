
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
  <div className="flex h-screen bg-gray-100">

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
      } md:flex flex-col w-full md:w-96 bg-white border-r shadow-lg`}
    >
      <div className="bg-green-600 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
              onError={(e) => {
                console.log("Image failed to load:", user.profile_image);
                e.target.onerror = null;
                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold border-2 border-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-xs text-green-100">● Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/call-history')}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
            title="Call History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
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

      <Search onSelectChat={handleSelectChat} />

      <div className="flex-1 overflow-y-auto bg-white">
        <ChatList onSelectChat={handleSelectChat} />
      </div>
    </div>

    <div
      className={`${
        activeChat ? "flex" : "hidden md:flex"
      } flex-1 flex flex-col`}
    >
      {activeChat ? (
        <>
          <div className="md:hidden bg-white border-b px-4 py-3 shadow-sm">
            <button
              onClick={() => setActiveChat(null)}
              className="flex items-center gap-2 text-green-600 font-semibold"
            >
              <svg
                className="w-6 h-6"
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
              <span>Back</span>
            </button>
          </div>

          <ChatRoom
            chatId={activeChat}
            chatName={activeChatName}
            currentUser={user}
            otherUser={activeChatUser}
            onMessageSent={() => fetchChats()}
          />
        </>
      ) : (
        <div className="hidden md:flex flex-col items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-16 h-16 text-green-600"
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
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Welcome to House of Anbu
            </h2>
            <p className="text-gray-600 mb-6">
              Search for users and start chatting instantly
            </p>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Tips:</h3>
              <ul className="text-sm text-left text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>Search for users in the left sidebar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>Click on any user to start chatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span>Real-time messaging with WebSocket</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>

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
  </div>
);
}

export default HomePage;