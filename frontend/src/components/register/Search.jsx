import React, { useState, useEffect } from "react";
import AxiosInstance from "../../api/AxiosInterCepters";
import useDebounce from "../../hooks/useDebounce";

function Search({ onSelectChat }) {
  const [query, setQuery] = useState("");
  const [searchingData, setSearchingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery.trim()) {
        setSearchingData([]);
        setIsOpen(false);
        return;
      }

      try {
        setLoading(true);
        setIsOpen(true);
        const response = await AxiosInstance.post("/chat/search-user/", {
          query: debouncedQuery,
        });
        setSearchingData(response.data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setSearchingData([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
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
    <div className="relative p-6 bg-[#0a0a0a] border-b border-[#1a1a1a]">
      {/* Search Input Container */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#D4AF37] transition-colors z-10">
          {loading ? (
            <div className="h-4 w-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search contacts..."
          className="w-full bg-[#121212] border border-[#222] pl-12 pr-4 py-4 rounded-2xl text-sm text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-gray-700 shadow-inner"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute left-6 right-6 top-[calc(100%-10px)] bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] animate-in slide-in-from-top-2 overflow-hidden">
          
          {/* Scrollable Area */}
          <div className="max-h-[320px] overflow-y-auto custom-search-scrollbar">
            {searchingData.length > 0 ? (
              searchingData.map((u, index) => (
                <div
                  key={u.id}
                  onClick={() => startChat(u.id, u.name)}
                  className="flex items-center gap-3 p-4 hover:bg-[#D4AF37] hover:text-black cursor-pointer transition-all group border-b border-[#222] last:border-none"
                  style={{ animation: `fadeIn 0.3s ease forwards ${index * 0.05}s` }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#333] border border-[#444] overflow-hidden shrink-0">
                    <img
                      src={u.profile_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      className="w-full h-full object-cover"
                      alt={u.name}
                    />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold truncate group-hover:text-black">{u.name}</p>
                    <p className="text-[10px] opacity-60 uppercase tracking-tighter group-hover:text-black/70">
                      {u.email || 'Click to message'}
                    </p>
                  </div>
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))
            ) : !loading && (
              <div className="p-8 text-center text-gray-600 text-xs uppercase tracking-widest">
                No users found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90]" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <style>{`
        .custom-search-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-search-scrollbar::-webkit-scrollbar-track {
          background: #0f0f0f;
        }
        .custom-search-scrollbar::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 10px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Search;