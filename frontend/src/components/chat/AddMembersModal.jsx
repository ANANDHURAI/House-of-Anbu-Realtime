import React, { useState } from 'react';
import AxiosInstance from '../../api/AxiosInterCepters';
import { X, Search as SearchIcon, UserPlus, Check } from 'lucide-react';

export default function AddMembersModal({ room, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);


    const handleSearch = async (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        
        try {
            const res = await AxiosInstance.post('/chat/search-user/', { query: val });
            setResults(res.data.results);
        } catch (error) {
            console.error("Search failed", error);
        }
    };


    const toggleUser = (user) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    
    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;
        
        try {
            const userIds = selectedUsers.map(u => u.id);
            await AxiosInstance.post(`/chat/rooms/${room.id}/add-participants/`, { user_ids: userIds });
            onClose();
        } catch (error) {
            alert(error.response?.data?.error || "Failed to add members");
        }
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#161616] border border-[#2a2a2a] w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <UserPlus size={20} className="text-[#d4af37]" /> Add Members
                </h2>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={query}
                        onChange={handleSearch}
                        placeholder="Search users to add..."
                        className="w-full bg-[#0a0a0a] text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-[#2a2a2a] focus:outline-none focus:border-[#d4af37]"
                    />
                </div>

                {/* Search Results */}
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 mb-6">
                    {results.map(user => {
                        const isSelected = selectedUsers.find(u => u.id === user.id);
                        return (
                            <div 
                                key={user.id} 
                                onClick={() => toggleUser(user)}
                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'border-[#d4af37] bg-[#d4af37]/5' : 'border-transparent hover:bg-[#1e1e1e]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {user.profile_image ? (
                                        <img src={user.profile_image} className="w-8 h-8 rounded-full object-cover" alt="profile" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-white">{user.name}</span>
                                </div>
                                {isSelected && <Check size={16} className="text-[#d4af37]" />}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleAddMembers}
                    disabled={selectedUsers.length === 0}
                    className="w-full py-3 bg-[#d4af37] text-black font-bold rounded-xl hover:bg-[#f3cf58] disabled:opacity-30 transition-all"
                >
                    Add {selectedUsers.length > 0 ? selectedUsers.length : ''} Members
                </button>
            </div>
        </div>
    );
}