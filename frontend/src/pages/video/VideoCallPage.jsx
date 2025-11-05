// pages/video/VideoCallPage.jsx
import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useParams, useNavigate } from "react-router-dom";
import AxiosInstance from "../../api/AxiosInterCepters";

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

  // Timer for call duration
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
    // Get call_id from sessionStorage
    const storedCallId = sessionStorage.getItem('current_call_id');
    if (storedCallId) {
      setCallId(storedCallId);
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
        `ws://127.0.0.1:8000/ws/videocall/${room_name}/?token=${token}`
      );
      socketRef.current = ws;

      let wsReady = false;

      ws.onopen = () => {
        console.log("✅ WebSocket connected to video room");
        wsReady = true;
      };
      
      ws.onmessage = (event) => handleSignal(JSON.parse(event.data));
      
      ws.onclose = () => {
        console.log("❌ Video WebSocket closed");
        setIsConnecting(false);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
      };

      // Wait for WebSocket to be ready, then init media
      const isInitiator = window.location.hash === "#init";
      const initDelay = isInitiator ? 500 : 1500; // Initiator: 500ms, Receiver: 1500ms
      
      const timer = setTimeout(() => {
        if (wsReady || isInitiator) {
          console.log(`🎥 Starting media initialization (${isInitiator ? 'Initiator' : 'Receiver'})`);
          initMedia();
        } else {
          console.log('⏳ Waiting for WebSocket...');
          setTimeout(() => initMedia(), 1000);
        }
      }, initDelay);

      return () => {
        clearTimeout(timer);
        // Cleanup when component unmounts
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('🛑 Stopped track:', track.kind);
          });
        }
        if (peerRef.current) {
          peerRef.current.destroy();
        }
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close();
        }
      };
    }, [room_name]);

  const initMedia = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support camera access');
        }

        // Stop any existing streams first
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }

        console.log(`Attempting to access camera (attempt ${retryCount + 1}/${maxRetries + 1})...`);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        console.log('✅ Camera access granted');
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Wait a bit for polyfills to be ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if Peer is available
        if (!Peer || typeof Peer !== 'function') {
          console.error('Peer constructor not available');
          throw new Error('SimplePeer library not loaded properly. Please refresh the page.');
        }

      const peerConfig = {
        initiator: window.location.hash === "#init",
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      };

      console.log('Creating peer - Initiator:', peerConfig.initiator);
      const p = new Peer(peerConfig);

      peerRef.current = p;

      p.on("signal", (signal) => {
        console.log('📤 Sending signal:', signal.type);
        socketRef.current?.send(
          JSON.stringify({ type: "signal", signal })
        );
      });

      p.on("stream", (remoteStream) => {
        console.log('📥 Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setConnected(true);
        setIsConnecting(false);
      });

      p.on("error", (err) => {
        console.error("❌ Peer connection error:", err);
        // Don't show error for stable state issues (they're expected)
        if (!err.message.includes('stable')) {
          setIsConnecting(false);
        }
      });

      p.on("connect", () => {
        console.log("✅ Peer connection established");
      });

      p.on("close", () => {
        console.log("👋 Peer connection closed");
        setConnected(false);
      });

      console.log('✅ Peer initialized successfully');

      } catch (err) {
        console.error("Camera error:", err);
        
        // Retry logic for "Device in use" errors
        if (err.name === 'NotReadableError' && retryCount < maxRetries) {
          console.log(`⏳ Retrying in ${(retryCount + 1) * 1000}ms...`);
          setTimeout(() => {
            initMedia(retryCount + 1);
          }, (retryCount + 1) * 1000); // Exponential backoff: 1s, 2s, 3s
          return;
        }
        
        // More user-friendly error messages
        let errorMessage = "Unable to access camera/microphone.\n\n";
        
        if (err.name === 'NotAllowedError') {
          errorMessage += "Please allow camera and microphone access in your browser settings.";
        } else if (err.name === 'NotFoundError') {
          errorMessage += "No camera or microphone found on your device.";
        } else if (err.name === 'NotReadableError') {
          errorMessage += "Camera is already in use by another application.\n\nPlease:\n1. Close other tabs/apps using the camera\n2. Refresh this page\n3. Try again";
        } else {
          errorMessage += err.message;
        }
        
        alert(errorMessage);
        navigate("/home");
      }
    };

  const handleSignal = (data) => {
    if (data.type === "signal" && data.signal && peerRef.current) {
      try {
        console.log('Received signal:', data.signal.type);
        peerRef.current.signal(data.signal);
      } catch (error) {
        console.error('Error handling signal:', error);
        // Ignore signaling errors in stable state
        if (!error.message.includes('stable')) {
          console.error('Signal processing failed:', error);
        }
      }
    }
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
      
      // Stop local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
        localStreamRef.current = null;
      }
      
      // Destroy peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      // Update call status to ended
      if (callId) {
        try {
          await AxiosInstance.post(`/videocall/call/${callId}/update/`, {
            status: 'ended'
          });
          sessionStorage.removeItem('current_call_id');
        } catch (error) {
          console.error('Error updating call status:', error);
        }
      }
      
      // Close WebSocket (but don't do it in useEffect cleanup to avoid race)
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  const endCall = async () => {
    await cleanupCall();
    navigate("/home");
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Main Video Container */}
      <div id="video-container" className="relative h-full flex items-center justify-center p-4">
        
        {/* Remote Video (Main) */}
        <div className="relative w-full h-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Connecting Overlay */}
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="mt-6 text-white text-xl font-medium animate-pulse">
                {isConnecting ? "Initializing camera..." : "Waiting for other user..."}
              </p>
              <p className="mt-2 text-gray-400 text-sm">Room: {room_name}</p>
              {!connected && (
                <p className="mt-4 text-gray-500 text-xs">
                  If stuck, make sure camera is not in use by other apps
                </p>
              )}
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
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

          {/* Call Duration */}
          {connected && (
            <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-sm">{formatDuration(callDuration)}</span>
            </div>
          )}

          {/* Connection Status */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-white text-sm font-medium">
                {connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
          
          {/* Mute Button */}
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

          {/* Video Toggle Button */}
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

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="group relative p-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            title="End call"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>

          {/* Fullscreen Button */}
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