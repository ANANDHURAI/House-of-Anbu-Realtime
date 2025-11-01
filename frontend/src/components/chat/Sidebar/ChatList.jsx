import AxiosInstance from "../../../api/AxiosInterCepters";
import { useEffect, useState } from "react";

function ChatList({ onSelectChat }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await AxiosInstance.get("/chat/chat-list/");
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  return (
    <div>
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat)}
          className="p-3 hover:bg-gray-100 cursor-pointer border-b"
        >
          <div className="font-medium">{chat.other_user.name}</div>
          <div className="text-sm text-gray-500">
            {chat.last_message || "No messages yet"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatList;
