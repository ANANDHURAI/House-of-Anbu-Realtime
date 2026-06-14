import React, { useState, useEffect } from 'react';
import AxiosInstance from '../../../api/AxiosInterCepters';
import { Hash, Video } from 'lucide-react';

export default function RoomList({ onSelectRoom }) {
    const [rooms, setRooms] = useState([]);

    const fetchRooms = async () => {
        try {
            const res = await AxiosInstance.get('/chat/rooms/');
            setRooms(res.data);
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        }
    };

   
    useEffect(() => {
        fetchRooms();
        window.addEventListener('refreshChatList', fetchRooms);
        return () => window.removeEventListener('refreshChatList', fetchRooms);
    }, []);

    if (rooms.length === 0) return null;

    return (
        <div className="mt-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-4">Your Rooms</h4>
            <div className="space-y-1">
                {rooms.map(room => (
                    <div 
                        key={`room-${room.id}`}
                        onClick={() => onSelectRoom(room)}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#1e1e1e] transition-all group"
                    >
                        <div className={`p-2 rounded-lg ${room.is_video_room ? 'bg-blue-500/10 text-blue-500' : 'bg-[#d4af37]/10 text-[#d4af37]'}`}>
                            {room.is_video_room ? <Video size={16} /> : <Hash size={16} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-bold text-white truncate group-hover:text-[#d4af37] transition-colors">
                                {room.name}
                            </h4>
                            <p className="text-[10px] text-gray-500">
                                {room.is_video_room ? 'Video Room' : 'Group Chat'} • by {room.created_by}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}