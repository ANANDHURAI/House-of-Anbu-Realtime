import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../../api/AxiosInterCepters';

function CallHistoryPage() {
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchCallHistory();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-200 border-b-emerald-600 shadow-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-slate-100 rounded-full transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Call History</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {callHistory.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-slate-200">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p className="text-slate-500 font-medium">No call history yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow duration-300">
            {callHistory.map((call, index) => {
              const otherUser = call.caller === currentUser?.id 
                ? { name: call.receiver_name, image: call.receiver_image }
                : { name: call.caller_name, image: call.caller_image };

              return (
                <div
                  key={call.id}
                  className={`flex items-center gap-4 p-5 hover:bg-emerald-50 transition-all duration-300 group cursor-pointer hover:shadow-md transform hover:scale-[1.01] ${
                    index !== callHistory.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  {otherUser.image ? (
                    <img
                      src={otherUser.image || "/placeholder.svg"}
                      alt={otherUser.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-emerald-300 transition-all duration-300 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-semibold shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      {otherUser.name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getCallIcon(call)}
                      <h3 className={`font-semibold transition-colors duration-300 ${call.is_missed ? 'text-red-600' : 'text-slate-800 group-hover:text-emerald-600'}`}>
                        {otherUser.name}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300">
                      {call.is_missed ? 'Missed' : formatDuration(call.duration)}
                    </p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-slate-500">{formatDate(call.started_at)}</p>
                  </div>

                  <button
                    className="p-2 hover:bg-emerald-100 rounded-full transition-all duration-300 text-emerald-600 hover:scale-110 shadow-sm hover:shadow-md"
                    title="Call again"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CallHistoryPage;