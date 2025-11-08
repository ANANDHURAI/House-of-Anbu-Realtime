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
    <div className="relative p-4 border-b bg-gradient-to-r from-white to-slate-50">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-emerald-500 transition-colors duration-300 group-focus-within:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleSearch}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-all duration-300 hover:border-slate-300 bg-white shadow-sm hover:shadow-md"
        />
      </div>

      {isOpen && (
        <div className="absolute left-4 right-4 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-b-emerald-600"></div>
            </div>
          )}
          
          {!loading && searchingData.length === 0 && query && (
            <div className="p-6 text-center text-sm text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No users found
            </div>
          )}
          
          {!loading && searchingData.length > 0 && (
            <div className="py-1">
              {searchingData.map((user) => (
                <div
                  key={user.id}
                  onClick={() => startChat(user.id, user.name)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors duration-200 group/item"
                >
                  <img
                    src={user.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover/item:ring-emerald-300 transition-all duration-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover/item:text-emerald-600 transition-colors duration-200">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover/item:text-emerald-500 transition-all duration-200 transform group-hover/item:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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