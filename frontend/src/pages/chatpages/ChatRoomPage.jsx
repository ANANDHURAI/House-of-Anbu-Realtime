
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../api/AxiosInterCepters";


function ChatRoomPage({ chatId, chatName, currentUser, otherUser }) {

  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name;
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await AxiosInstance.get(`/chat/${chatId}/messages/`);
        setMessages(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load messages:", err);
        setLoading(false);
      }
    };
    
    fetchMessages();
    const token = localStorage.getItem("access");
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${chatId}/?token=${token}`);

    setSocket(ws);

    ws.onopen = () => console.log("Connected to WebSocket");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data]);
    };
    ws.onerror = (error) => console.error("WebSocket error:", error);
    ws.onclose = () => console.log("Disconnected from WebSocket");

    return () => ws.close();
  }, [chatId]);

  const sendMessage = () => {
    if (!socket || input.trim() === "") return;
    socket.send(JSON.stringify({ message: input, sender_id: currentUserId }));
    setInput("");
  };


  const startVideoCall = async () => {
    try {
      const res = await AxiosInstance.post("/videocall/start/", {
        receiver_id: otherUser.id,
      });
      const { room_name, call_id } = res.data;
      
     
      sessionStorage.setItem('current_call_id', call_id);
      
      navigate(`/videocall/${room_name}#init`);
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Failed to start video call. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {otherUser?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                {chatName || otherUser?.name || "Chat"}
              </h2>
              <p className="text-xs text-green-500">● Online</p>
            </div>
          </div>
          <button
            onClick={startVideoCall}
            className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md transition"
            title="Start Video Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"
              />
            </svg>
          </button>
        </div>
      </div>


   
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-16 h-16 mb-3"
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
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isCurrentUser = msg.sender === currentUserName || msg.sender_name === currentUserName;
            
        
            if (msg.message_type === 'call' || msg.message_type === 'call_missed') {
              const isMissed = msg.message_type === 'call_missed';
              return (
                <div key={idx} className="flex justify-center my-3">
                  <div className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${
                    isMissed ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="font-medium">{msg.content}</span>
                  </div>
                </div>
              );
            }
            
           
            return (
              <div
                key={idx}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm max-w-xs md:max-w-md break-words shadow-sm ${
                    isCurrentUser
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                  }`}
                >
                  {msg.message || msg.content}
                  <div className={`text-xs mt-1 ${isCurrentUser ? "text-indigo-100" : "text-gray-400"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

   
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-full hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ChatRoomPage;