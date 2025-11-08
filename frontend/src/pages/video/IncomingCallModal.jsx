import React, { useEffect, useState,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../../api/AxiosInterCepters';

function IncomingCallModal({ callData, onReject, onCallEnded }) {
  const navigate = useNavigate();
  const [isRinging, setIsRinging] = useState(true);
  const hasActionedRef = useRef(false);

  useEffect(() => {
    let audio = null;
    try {
      audio = new Audio('/ringtone.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.log('Audio autoplay prevented or file not found:', e);
        });
      }
    } catch (error) {
      console.log('Could not load ringtone:', error);
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);


  const handleAccept = async () => {
    if (hasActionedRef.current) return;
    hasActionedRef.current = true;
    
    setIsRinging(false);
    try {
      await AxiosInstance.post(`/videocall/call/${callData.call_id}/update/`, {
        status: 'accepted'
      });
      
      sessionStorage.setItem('current_call_id', callData.call_id);
      navigate(`/videocall/${callData.room_name}`, { replace: true });
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to accept call. Please try again.');
      hasActionedRef.current = false;
    }
  };

  const handleReject = async () => {
    if (hasActionedRef.current) return;
    hasActionedRef.current = true;
    
    setIsRinging(false);
    try {
      await AxiosInstance.post(`/videocall/call/${callData.call_id}/update/`, {
        status: 'rejected'
      });
      console.log('Call rejected successfully');
      onReject();
    } catch (error) {
      console.error('Error rejecting call:', error);
      hasActionedRef.current = false;
      onReject();
    }
  };

  if (!isRinging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-400">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            {callData.caller_image ? (
              <img
                src={callData.caller_image}
                alt={callData.caller_name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white text-indigo-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                {callData.caller_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-75"></div>
            <div 
              className="absolute inset-0 w-24 h-24 border-4 border-white rounded-full animate-spin opacity-75"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {callData.caller_name}
          </h2>
          <p className="text-white text-opacity-90 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Incoming video call...
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleReject}
            className="group relative p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Decline
            </span>
          </button>

          <button
            onClick={handleAccept}
            className="group relative p-6 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-200 transform hover:scale-110 shadow-lg animate-pulse"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Accept
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;