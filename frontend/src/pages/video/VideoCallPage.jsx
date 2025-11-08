
import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "../../api/AxiosInterCepters";
import { WS_URL } from "../../config/api";

function VideoCallPage() {
  const { room_name } = useParams();
  const navigate = useNavigate();
  const [callId, setCallId] = useState(null);
  const callStartTimeRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callCancelled, setCallCancelled] = useState(false);
  const myRoleRef = useRef(null);
  const signalBufferRef = useRef([]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (!connected && !localStreamRef.current) {
        navigate('/home', { replace: true });
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [connected, navigate]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    let interval;
    if (connected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connected]);

  useEffect(() => {
    const storedCallId = sessionStorage.getItem('current_call_id');
    if (storedCallId) {
      setCallId(storedCallId);
     
      const token = localStorage.getItem("access");
      const notificationWs = new WebSocket(`${WS_URL}/ws/call-notifications/?token=${token}`);
      
      notificationWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Call notification in VideoCallPage:", data);
        
        if (data.type === 'call_ended' && data.call_id === parseInt(storedCallId)) {
          if (data.message) {
            alert(data.message);
            endCall();
          }
        }
      };
      
      return () => {
        notificationWs.close();
      };
    }
  }, []);

  useEffect(() => {
    if (connected && !callStartTimeRef.current) {
      callStartTimeRef.current = new Date();
    }
  }, [connected]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    const ws = new WebSocket(
      `${WS_URL}/ws/videocall/${room_name}/?token=${token}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to video room");
      initMedia();
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSignal(data);
    };
    
    ws.onclose = () => {
      console.log("Video WebSocket closed");
      setIsConnecting(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
    };

    return () => {
      console.log('Component unmounting, cleaning up...');
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Unmount: Stopped track:', track.kind);
        });
        localStreamRef.current = null;
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [room_name]);

  const initMedia = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log('Requesting media access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      localStreamRef.current = stream;
      console.log('Media stream acquired:', stream.id);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsConnecting(false);
      console.log('Media initialized successfully, ready for peer creation');

    } catch (err) {
      console.error("Camera error:", err);
    
      let errorMessage = "Unable to access camera/microphone.\n\n";
      
      if (err.name === 'NotAllowedError') {
        errorMessage += "Please allow camera and microphone access in your browser settings.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera or microphone found on your device.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera is already in use by another application.\nPlease close other apps using the camera.";
      } else {
        errorMessage += err.message;
      }
      
      alert(errorMessage);
      navigate("/home");
    }
  };


  const createPeer = (isInitiator) => {
    if (!localStreamRef.current) {
      console.error('No local stream available, cannot create peer');
      return;
    }

    if (peerRef.current) {
      console.log('Peer already exists, destroying old one');
      peerRef.current.destroy();
    }

    console.log('Creating peer, initiator:', isInitiator);
    console.log('Local stream tracks:', localStreamRef.current.getTracks().map(t => `${t.kind}: ${t.enabled}`));

    const p = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peerRef.current = p;

    p.on("signal", (signal) => {
      console.log('Peer sending signal:', signal.type);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ type: "signal", signal })
        );
        console.log('Signal sent via WebSocket');
      } else {
        console.error('WebSocket not open, cannot send signal. State:', socketRef.current?.readyState);
      }
    });

    p.on("stream", (remoteStream) => {
      console.log('Received remote stream:', remoteStream.id);
      console.log('Remote tracks:', remoteStream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setConnected(true);
      setIsConnecting(false);
    });

    p.on("connect", () => {
      console.log('Peer connection established!');
    });

    p.on("error", (err) => {
      console.error("Peer connection error:", err);
      if (!err.message || (!err.message.includes('stable') && !err.message.includes('setRemoteDescription'))) {
        setIsConnecting(false);
      }
    });

    p.on("close", () => {
      console.log('Peer connection closed');
      setConnected(false);
    });

    console.log('Peer created successfully, initiator:', isInitiator);

    if (signalBufferRef.current.length > 0) {
      console.log('Processing', signalBufferRef.current.length, 'buffered signals');
      signalBufferRef.current.forEach(signal => {
        try {
          console.log('Processing buffered signal:', signal.type);
          p.signal(signal);
        } catch (error) {
          console.error('Error processing buffered signal:', error);
        }
      });
      signalBufferRef.current = [];
    }
  };


  const handleSignal = (data) => {
    console.log('Received WebSocket message:', data.type, data);

    if (data.type === "connection") {
      console.log('Connection message:', data.message, 'Members:', data.member_count);
    
      const isInitiator = data.member_count === 1;
      myRoleRef.current = isInitiator ? 'initiator' : 'receiver';
      console.log('My role set to:', myRoleRef.current);
      return;
    }

    if (data.type === "both_users_ready") {
      console.log(' Both users ready! Creating peer with role:', myRoleRef.current);
      
      const tryCreatePeer = () => {
        if (!localStreamRef.current) {
          console.log('Waiting for media stream...');
          setTimeout(tryCreatePeer, 100);
          return;
        }
        
        if (!myRoleRef.current) {
          console.error('Role not set! This should not happen.');
          return;
        }
        
        const isInitiator = myRoleRef.current === 'initiator';
        console.log('Creating peer, isInitiator:', isInitiator, 'role:', myRoleRef.current);
        createPeer(isInitiator);
      };
      
      setTimeout(tryCreatePeer, 300);
      return;
    }

    if (data.type === "signal" && data.signal) {
      console.log('Received WebRTC signal:', data.signal.type);
     
      if (!peerRef.current) {
        console.log('Buffering signal (peer not ready yet)');
        signalBufferRef.current.push(data.signal);
        return;
      }

      try {
        const pc = peerRef.current._pc;
        const currentState = pc ? pc.signalingState : 'no peer connection';
        console.log(' Current signaling state:', currentState);
        
        if (pc && currentState !== 'closed') {
          peerRef.current.signal(data.signal);
          console.log('Signal processed successfully');
        } else {
          console.error(' Peer not ready for signal, state:', currentState);
        }
      } catch (error) {
        if (!error.message.includes('stable') && 
            !error.message.includes('InvalidStateError') &&
            !error.message.includes('setRemoteDescription')) {
          console.error(' Signal processing failed:', error);
        } else {
          console.log('Ignoring expected state error:', error.message);
        }
      }
      return;
    }

    
    if (data.type === "user_left") {
      console.log(' User left:', data.user);
      alert(`${data.user} has ended the call`);
      endCall();
      return;
    }

    console.log('Unknown message type:', data.type);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = document.getElementById('video-container');
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };


  const cleanupCall = async () => {
    console.log('Cleaning up call...');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
  
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (callId) {
      try {
        const status = connected ? 'ended' : 'cancelled';
        await AxiosInstance.post(`/videocall/call/${callId}/update/`, {
          status: status
        });
        sessionStorage.removeItem('current_call_id');
      } catch (error) {
        console.error('Error updating call status:', error);
      }
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  };


  const endCall = async () => {
    console.log('Ending call manually...');
    await cleanupCall();
    navigate("/home", { replace: true });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 overflow-hidden">
    
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

  
      <div id="video-container" className="relative h-full flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
         
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-6 text-white text-xl font-medium animate-pulse">
                {!localStreamRef.current ? "Initializing camera..." : "Waiting for other user..."}
              </p>
              <p className="mt-2 text-gray-400 text-sm">Room: {room_name}</p>
              {!connected && localStreamRef.current && (
                <p className="mt-4 text-gray-500 text-xs">
                  Connection established, waiting for peer...
                </p>
              )}
            </div>
          )}

       
          <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black transition-all hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs backdrop-blur-sm">
              You
            </div>
          </div>

          {connected && (
            <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-sm">{formatDuration(callDuration)}</span>
            </div>
          )}

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-white text-sm font-medium">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

      
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
          
       
          <button
            onClick={toggleMute}
            className={`group relative p-4 rounded-xl transition-all duration-200 ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

       
          <button
            onClick={toggleVideo}
            className={`group relative p-4 rounded-xl transition-all duration-200 ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

       
          <button
            onClick={endCall}
            className="group relative p-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            title="End call"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>

        
          <button
            onClick={toggleFullscreen}
            className="group relative p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

export default VideoCallPage;