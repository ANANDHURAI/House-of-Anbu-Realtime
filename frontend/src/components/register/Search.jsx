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
    <div className="relative p-4 bg-white border-b border-slate-200/50">
      {/* Search Input */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-500"></div>
        
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-4 pointer-events-none z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-sm opacity-0 group-focus-within:opacity-50 transition-opacity duration-300"></div>
              <svg 
                className="relative h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-all duration-300 group-focus-within:scale-110" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Input Field - Enhanced visibility */}
          <input
            type="text"
            placeholder="Search for users to chat..."
            value={query}
            onChange={handleSearch}
            onFocus={() => query && setIsOpen(true)}
            className="relative w-full pl-12 pr-10 py-3.5 rounded-xl border-2 border-slate-300 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm transition-all duration-300 hover:border-emerald-400 bg-white font-medium text-slate-700 shadow-sm hover:shadow-md placeholder:text-slate-400 placeholder:font-normal"
          />
          
          {/* Clear Button */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSearchingData([]);
                setIsOpen(false);
              }}
              className="absolute right-3 p-1.5 hover:bg-slate-100 rounded-full transition-all duration-300 hover:scale-110 group/clear z-10"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover/clear:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop - Only covers the sidebar */}
          <div 
            className="fixed top-0 left-0 w-full md:w-96 h-screen bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Results Container */}
          <div className="absolute left-4 right-4 top-[4.5rem] bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[calc(100vh-8rem)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-b border-emerald-100 z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm">Search Results</span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-emerald-100 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-90"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Results Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-transparent">
              {loading && (
                <div className="p-12 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-500 font-medium">Searching...</p>
                </div>
              )}
              
              {!loading && searchingData.length === 0 && query && (
                <div className="p-12 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full"></div>
                    <svg className="relative w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-semibold mb-1">No users found</p>
                  <p className="text-slate-400 text-sm">Try searching with a different name or email</p>
                </div>
              )}
              
              {!loading && searchingData.length > 0 && (
                <div className="divide-y divide-slate-100">
                  {searchingData.map((user, index) => (
                    <div
                      key={user.id}
                      onClick={() => startChat(user.id, user.name)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 cursor-pointer transition-all duration-300 group/item"
                      style={{
                        animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                      }}
                    >
                      {/* Profile Image */}
                      <div className="relative flex-shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-0 group-hover/item:opacity-75 blur transition-opacity duration-300"></div>
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.name}
                            className="relative w-12 h-12 rounded-full object-cover ring-2 ring-white group-hover/item:ring-emerald-300 shadow-md transition-all duration-300 group-hover/item:scale-110"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                            }}
                          />
                        ) : (
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-lg font-bold ring-2 ring-white group-hover/item:ring-emerald-300 shadow-md transition-all duration-300 group-hover/item:scale-110">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover/item:text-emerald-600 transition-colors duration-300">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>

                      {/* Action Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 bg-emerald-100 group-hover/item:bg-gradient-to-br group-hover/item:from-emerald-500 group-hover/item:to-teal-500 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm">
                          <svg 
                            className="w-4 h-4 text-emerald-600 group-hover/item:text-white transition-colors duration-300" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && searchingData.length > 0 && (
              <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2.5 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click to start chatting
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

export default Search;