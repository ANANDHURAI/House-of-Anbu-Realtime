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
    e.stopPropagation(); // Prevent chat selection
    setSelectedProfile(user);
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {chats.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">No chats available</div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="p-3 hover:bg-gray-100 cursor-pointer border-b flex items-center gap-3"
          >
            {/* Profile Image - Clickable */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={(e) => handleProfileClick(e, chat.other_user)}
            >
              {chat.other_user?.profile_image ? (
                <img
                  src={chat.other_user.profile_image}
                  alt={chat.other_user.name}
                  className="w-12 h-12 rounded-full object-cover hover:ring-2 hover:ring-green-500 transition"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold hover:ring-2 hover:ring-green-500 transition">
                  {chat.other_user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{chat.other_user?.name}</div>
              <div className="text-sm text-gray-500 truncate">
                {chat.last_message || "No messages yet"}
              </div>
            </div>

            {/* Unread Badge */}
            {chat.unread_count > 0 && (
              <div className="bg-green-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center flex-shrink-0">
                {chat.unread_count}
              </div>
            )}
          </div>
        ))
      )}

      {/* Profile Popup Modal */}
      {selectedProfile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedProfile(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Profile Info</h3>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col items-center">
              {selectedProfile.profile_image ? (
                <img
                  src={selectedProfile.profile_image}
                  alt={selectedProfile.name}
                  className="w-40 h-40 rounded-full object-cover mb-4 border-4 border-green-500"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-green-600 text-white flex items-center justify-center text-6xl font-bold mb-4 border-4 border-green-500">
                  {selectedProfile.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedProfile.name}
              </h2>
              
              <p className="text-gray-600 mb-1">{selectedProfile.email}</p>
              
              {selectedProfile.about_me && (
                <div className="mt-4 w-full">
                  <p className="text-sm text-gray-500 mb-1">About</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedProfile.about_me}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatList;