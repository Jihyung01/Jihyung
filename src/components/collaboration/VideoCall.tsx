import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Phone, 
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  MoreVertical,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  stream?: MediaStream;
}

interface VideoCallProps {
  roomId: string;
  onLeave: () => void;
  participants: Participant[];
}

export const VideoCall: React.FC<VideoCallProps> = ({ roomId, onLeave, participants }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [participantId: string]: HTMLVideoElement }>({});
  const peerConnections = useRef<{ [participantId: string]: RTCPeerConnection }>({});
  const websocketRef = useRef<WebSocket | null>(null);

  // WebRTC Configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // In production, you'd add TURN servers here
    ],
  };

  // Initialize local media stream
  const initializeMedia = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      toast.success('카메라와 마이크가 연결되었습니다');
    } catch (error) {
      console.error('Failed to access media devices:', error);
      toast.error('카메라 또는 마이크 접근이 거부되었습니다');
    }
  }, []);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      // In development, use a mock WebSocket or disable
      if (process.env.NODE_ENV === 'development') {
        // Mock connection for development
        setConnectionState('connected');
        toast.success('개발 모드: 가상 회의실에 연결되었습니다');
        return;
      }
      
      const ws = new WebSocket(`wss://your-signaling-server.com/room/${roomId}`);
      websocketRef.current = ws;

      ws.onopen = () => {
        setConnectionState('connected');
        toast.success('회의실에 연결되었습니다');
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await handleSignalingMessage(message);
      };

      ws.onclose = () => {
        setConnectionState('failed');
        toast.error('연결이 끊어졌습니다');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('failed');
        toast.error('연결에 실패했습니다');
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionState('failed');
    }
  }, [roomId]);

  // Handle signaling messages
  const handleSignalingMessage = async (message: any) => {
    try {
      switch (message.type) {
        case 'offer':
          await handleOffer(message);
          break;
        case 'answer':
          await handleAnswer(message);
          break;
        case 'ice-candidate':
          await handleIceCandidate(message);
          break;
        case 'participant-joined':
          await handleParticipantJoined(message);
          break;
        case 'participant-left':
          handleParticipantLeft(message);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };

  // WebRTC peer connection handlers
  const createPeerConnection = (participantId: string) => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && websocketRef.current) {
        websocketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          participantId
        }));
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteVideo = remoteVideosRef.current[participantId];
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${participantId}:`, peerConnection.connectionState);
    };

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnections.current[participantId] = peerConnection;
    return peerConnection;
  };

  const handleOffer = async (message: any) => {
    const peerConnection = createPeerConnection(message.participantId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    if (websocketRef.current) {
      websocketRef.current.send(JSON.stringify({
        type: 'answer',
        answer: answer,
        participantId: message.participantId
      }));
    }
  };

  const handleAnswer = async (message: any) => {
    const peerConnection = peerConnections.current[message.participantId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
  };

  const handleIceCandidate = async (message: any) => {
    const peerConnection = peerConnections.current[message.participantId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  };

  const handleParticipantJoined = async (message: any) => {
    const peerConnection = createPeerConnection(message.participantId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    if (websocketRef.current) {
      websocketRef.current.send(JSON.stringify({
        type: 'offer',
        offer: offer,
        participantId: message.participantId
      }));
    }
  };

  const handleParticipantLeft = (message: any) => {
    const peerConnection = peerConnections.current[message.participantId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnections.current[message.participantId];
    }
  };

  // Media control functions
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen' },
          audio: true
        });
        
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        toast.success('화면 공유가 시작되었습니다');
        
        // Handle screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('화면 공유에 실패했습니다');
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      const videoTrack = cameraStream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
      
      setLocalStream(cameraStream);
      setIsScreenSharing(false);
      toast.success('화면 공유가 중지되었습니다');
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const leaveCall = () => {
    // Clean up all connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    onLeave();
  };

  // Initialize on mount
  useEffect(() => {
    initializeMedia();
    initializeWebSocket();
    
    return () => {
      // Cleanup on unmount
      Object.values(peerConnections.current).forEach(pc => pc.close());
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [initializeMedia, initializeWebSocket]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black z-50 flex flex-col ${isFullscreen ? 'p-0' : 'p-4'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Badge 
            variant={connectionState === 'connected' ? 'default' : 'destructive'}
            className="flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {connectionState === 'connected' ? '연결됨' : '연결 실패'}
          </Badge>
          
          <div className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4" />
            <span>{participants.length + 1}명 참여 중</span>
          </div>
        </div>
        
        <Button
          onClick={() => setIsFullscreen(!isFullscreen)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid gap-4" style={{
        gridTemplateColumns: participants.length === 0 ? '1fr' : 
                           participants.length === 1 ? 'repeat(2, 1fr)' :
                           participants.length <= 4 ? 'repeat(2, 1fr)' :
                           'repeat(3, 1fr)'
      }}>
        {/* Local Video */}
        <Card className="relative aspect-video bg-gray-900 overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            나 {isScreenSharing && '(화면 공유 중)'}
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </Card>

        {/* Remote Videos */}
        {participants.map((participant, index) => (
          <Card key={participant.id} className="relative aspect-video bg-gray-900 overflow-hidden">
            <video
              ref={(el) => {
                if (el) remoteVideosRef.current[participant.id] = el;
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {participant.name}
            </div>
            {!participant.isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-6 bg-gray-900/80 backdrop-blur-sm">
        <Button
          onClick={toggleVideo}
          variant={isVideoEnabled ? "default" : "destructive"}
          size="lg"
          className="rounded-full h-12 w-12 p-0"
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          onClick={toggleAudio}
          variant={isAudioEnabled ? "default" : "destructive"}
          size="lg"
          className="rounded-full h-12 w-12 p-0"
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          onClick={toggleScreenShare}
          variant={isScreenSharing ? "secondary" : "outline"}
          size="lg"
          className="rounded-full h-12 w-12 p-0"
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <Button
          onClick={leaveCall}
          variant="destructive"
          size="lg"
          className="rounded-full h-12 w-12 p-0"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
};