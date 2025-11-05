
import React, { useState } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";


function Search({ onSelectChat }) {

  const [query, setQuery] = useState("");
  const [searchingData, setSearchingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (!value.trim()) {
      setSearchingData([]);
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      const response = await AxiosInstance.post("/chat/search-user/", {
        query: value,
      });
      setSearchingData(response.data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (userId, userName) => {
    try {
      const res = await AxiosInstance.post("/chat/get-or-create-chat/", {
        user_id: userId,
      });
      const chatId = res.data.chat_id;
      
      setQuery("");
      setSearchingData([]);
      setIsOpen(false);
      
      onSelectChat(chatId, userName);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };
  

  return (
    <div className="relative p-3 border-b bg-white">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleSearch}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute left-3 right-3 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto z-50">
          {loading && (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          )}
          
          {!loading && searchingData.length === 0 && query && (
            <div className="p-6 text-center text-sm text-gray-500">No users found</div>
          )}
          
          {!loading && searchingData.length > 0 && (
            <div className="py-1">
              {searchingData.map((user) => (
                <div
                  key={user.id}
                  onClick={() => startChat(user.id, user.name)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                >
                  <img
                    src={user.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;