import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../../api/AxiosInterCepters';
import IncomingCallModal from '../video/IncomingCallModal';
import { WS_URL } from "../../config/api";

function CallHistoryPage() {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null); // Added for calls
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));


  useEffect(() => {
    fetchCallHistory();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const notificationWs = new WebSocket(`${WS_URL}/ws/notifications/?token=${token}`);

    notificationWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'incoming_call') {
        console.log("Call received on History Page:", data);
        setIncomingCall(data);
      } else if (data.type === 'call_cancelled' || data.type === 'call_ended') {
        setIncomingCall(null);
      }
    };

    return () => {
      if (notificationWs.readyState === WebSocket.OPEN) {
        notificationWs.close();
      }
    };
  }, []);

  const fetchCallHistory = async () => {
    try {
      const res = await AxiosInstance.get('/videocall/call-history/');
      setCallHistory(res.data);
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getCallIcon = (call) => {
    const isOutgoing = call.caller === currentUser?.id;
    const isMissed = call.is_missed;

    if (isMissed) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      );
    }

    return isOutgoing ? (
      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      </svg>
    );
  };

  const handleCallAgain = async (receiverId) => {
    try {
      const res = await AxiosInstance.post("/videocall/start/", {
        receiver_id: receiverId,
      });
      const { room_name, call_id } = res.data;
      sessionStorage.setItem('current_call_id', call_id);
      navigate(`/videocall/${room_name}`);
    } catch (error) {
      console.error("Error starting call:", error);
      alert("Failed to start video call.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-200 border-b-emerald-600 shadow-lg"></div>
      </div>
    );
  }


return (
  <div className="min-h-screen bg-[#050505] text-white">
    <div className="bg-[#121212] border-b border-[#1a1a1a] p-6 shadow-xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="p-3 hover:bg-[#D4AF37] hover:text-black rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-2xl font-black tracking-tight">Call <span className="text-[#D4AF37]">History</span></h1>
        </div>
      </div>
    </div>

    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {callHistory.map((call) => (
        <div key={call.id} className="bg-[#121212] border border-[#222] rounded-3xl p-5 hover:border-[#D4AF37]/50 transition-all flex items-center gap-5">
          <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37]/30 p-0.5 shadow-lg">
             <img src={call.caller_image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${call.is_missed ? 'text-red-500' : 'text-white'}`}>{call.receiver_name || call.caller_name}</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">
              {call.is_missed ? 'Missed Call' : `${formatDuration(call.duration)} Duration`} • {formatDate(call.started_at)}
            </p>
          </div>
          <button onClick={() => handleCallAgain(call.receiver)} className="p-4 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
        </div>
      ))}
    </div>
  </div>
);
}

export default CallHistoryPage;