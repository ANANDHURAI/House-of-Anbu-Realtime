import React, { useState } from 'react';
import AxiosInstance from '../../../api/AxiosInterCepters'; 
import { Plus, CheckCircle2 } from 'lucide-react';

export default function RoomCreationForm({ onRoomCreated }) {
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) return;
        
        setLoading(true);
        setSuccessMessage(''); 
        setErrorMessage('');
        
        try {
            const res = await AxiosInstance.post('/chat/create-room/', { 
                name: roomName
            });
            setRoomName('');
            if (onRoomCreated) onRoomCreated(res.data);
            
            setSuccessMessage(`Room created! Check "Your Rooms" below.`);
            
            setTimeout(() => {
                setSuccessMessage('');
            }, 4000);

        } catch (error) {
            setErrorMessage(error.response?.data?.error || "Failed to create room");
            setTimeout(() => setErrorMessage(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl mx-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold mb-3">Create Room</h4>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Chat room name..."
                    className="flex-1 bg-[#0a0a0a] text-white text-sm px-3 py-2 rounded-xl border border-[#2a2a2a] focus:outline-none focus:border-[#d4af37] transition-colors"
                />
                <button 
                    type="submit" 
                    disabled={loading || !roomName.trim()}
                    className="bg-[#d4af37] text-black p-2 rounded-xl hover:bg-[#f3cf58] disabled:opacity-50 transition-all"
                >
                    <Plus size={20} />
                </button>
            </div>

            {successMessage && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-400/10 p-2 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={14} />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="mt-3 text-xs text-red-400 bg-red-400/10 p-2 rounded-lg animate-in fade-in slide-in-from-top-2">
                    {errorMessage}
                </div>
            )}
        </form>
    );
}