import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

function ChatLayout() {
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await AxiosInstance.get("/auth/profile/");
        setUser(res.data);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate]);

  const handleSelectChat = (chatId, chatName) => {
    setActiveChat(chatId);
    setActiveChatName(chatName);
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load user data</p>
          <button onClick={handleLogout} className="px-6 py-2 bg-green-500 text-white rounded-lg">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} md:flex flex-col w-full md:w-96 bg-white border-r`}>
        {/* Sidebar Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
            <div>
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-xs text-green-100">● Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

      
        <Search onSelectChat={handleSelectChat} />

        <div className="flex-1 overflow-y-auto">
          {!activeChat && (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Start Chatting</h3>
              <p className="text-sm text-gray-600">Search for users above to begin a conversation</p>
            </div>
          )}
        </div>
      </div>

    
      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col`}>
        {activeChat ? (
          <>
          
            <div className="md:hidden bg-white border-b px-4 py-2">
              <button
                onClick={() => setActiveChat(null)}
                className="flex items-center gap-2 text-green-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Back</span>
              </button>
            </div>
            <ChatRoom chatId={activeChat} chatName={activeChatName} currentUser={user} />
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full bg-gray-50">
            <div className="text-center p-8">
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">Welcome to Chat App</h2>
              <p className="text-gray-600 mb-6">Search for users and start chatting instantly</p>
              <div className="bg-white p-6 rounded-lg shadow-sm max-w-md mx-auto">
                <h3 className="font-semibold text-gray-800 mb-3">Quick Tips:</h3>
                <ul className="text-sm text-left text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Search for users in the sidebar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Click to start a conversation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Real-time messaging with WebSocket</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}