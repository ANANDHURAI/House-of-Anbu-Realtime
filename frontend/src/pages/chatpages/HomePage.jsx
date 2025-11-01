// pages/chat/HomePage.jsx
import React, { useState, useEffect } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";
import { useNavigate } from "react-router-dom";
import Search from "../../components/register/Search";
import ChatRoom from "./ChatRoomPage";
import ChatList from "../../components/chat/Sidebar/ChatList";


function HomePage() {
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSelectChat = (chatOrId, chatName) => {
    if (typeof chatOrId === 'object') {
      // Called from ChatList - receives chat object
      setActiveChat(chatOrId.id);
      setActiveChatName(chatOrId.other_user.name);
    } else {
      // Called from Search - receives chatId and chatName as separate params
      setActiveChat(chatOrId);
      setActiveChatName(chatName);
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
    {/* Sidebar - WhatsApp Style - Always visible on desktop */}
    <div
      className={`${
        activeChat ? "hidden md:flex" : "flex"
      } md:flex flex-col w-full md:w-96 bg-white border-r shadow-lg`}
    >
      {/* Sidebar Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
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

      {/* Search Component */}
      <Search onSelectChat={handleSelectChat} />

      {/* ✅ Chat List replaces Empty State */}
      <div className="flex-1 overflow-y-auto bg-white">
        <ChatList onSelectChat={handleSelectChat} />
      </div>
    </div>

    {/* Chat Area */}
    <div
      className={`${
        activeChat ? "flex" : "hidden md:flex"
      } flex-1 flex flex-col`}
    >
      {activeChat ? (
        <>
          {/* Mobile Back Button */}
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
          {/* Chat Room Component */}
          <ChatRoom
            chatId={activeChat}
            chatName={activeChatName}
            currentUser={user}
          />
        </>
      ) : (
        /* Desktop Empty State */
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
  </div>
);

}

export default HomePage;