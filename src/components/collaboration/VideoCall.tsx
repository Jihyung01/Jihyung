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
  Minimize,
  Record,
  Download,
  Share
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useCollaborationSocket } from '../../hooks/useCollaborationSocket';
import { ChatPanel } from './ChatPanel';

interface VideoCallProps {
  roomId: string;
  onLeave: () => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export const VideoCall: React.FC<VideoCallProps> = ({ roomId, onLeave, currentUser }) => {
  const collaboration = useCollaborationSocket();

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!collaboration.isConnected) {
      collaboration.connect(currentUser);
    }

    return () => {
      collaboration.disconnect();
    };
  }, []);

  useEffect(() => {
    if (collaboration.isConnected && roomId && !collaboration.currentRoom) {
      collaboration.joinRoom(roomId);
    }
  }, [collaboration.isConnected, roomId]);

  useEffect(() => {
    if (collaboration.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = collaboration.localStream;
    }
  }, [collaboration.localStream]);

  useEffect(() => {
    const handleRemoteStream = (event: CustomEvent) => {
      const { userId, stream } = event.detail;
      const videoElement = remoteVideosRef.current.get(userId);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    };

    window.addEventListener('remoteStreamAdded', handleRemoteStream as EventListener);
    return () => {
      window.removeEventListener('remoteStreamAdded', handleRemoteStream as EventListener);
    };
  }, []);

  const startVideoCall = useCallback(async () => {
    try {
      await collaboration.startVideoCall();
      toast.success('화상 통화가 시작되었습니다');
    } catch (error) {
      console.error('Failed to start video call:', error);
      toast.error('화상 통화 시작에 실패했습니다');
    }
  }, [collaboration]);

  useEffect(() => {
    if (collaboration.currentRoom && !collaboration.isInCall) {
      startVideoCall();
    }
  }, [collaboration.currentRoom, startVideoCall]);

  const startRecording = useCallback(async () => {
    try {
      if (!collaboration.localStream) {
        toast.error('로컬 스트림이 없습니다');
        return;
      }

      const mediaRecorder = new MediaRecorder(collaboration.localStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });
        setRecordingBlob(blob);
        toast.success('녹화가 완료되었습니다');
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success('녹화가 시작되었습니다');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('녹화 시작에 실패했습니다');
    }
  }, [collaboration.localStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('녹화 파일이 다운로드되었습니다');
    }
  }, [recordingBlob]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' as any },
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);
      toast.success('화면 공유가 시작되었습니다');

      const videoTrack = screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('화면 공유에 실패했습니다');
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      const cameraStream = await collaboration.initializeMedia();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

      setIsScreenSharing(false);
      toast.success('화면 공유가 중지되었습니다');
    } catch (error) {
      console.error('Error stopping screen share:', error);
      toast.error('화면 공유 중지에 실패했습니다');
    }
  }, [collaboration]);

  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    collaboration.toggleVideo(newState);
  }, [isVideoEnabled, collaboration]);

  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    collaboration.toggleAudio(newState);
  }, [isAudioEnabled, collaboration]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const leaveCall = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }

    collaboration.leaveRoom();
    collaboration.cleanup();

    onLeave();
  }, [isRecording, stopRecording, collaboration, onLeave]);

  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      collaboration.cleanup();
    };
  }, [isRecording, stopRecording, collaboration]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`flex-1 flex flex-col ${isFullscreen ? 'p-0' : 'p-4'}`}
      >
        <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Badge
              variant={collaboration.isConnected ? 'default' : 'destructive'}
              className="flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${
                collaboration.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {collaboration.isConnected ? '연결됨' : '연결 실패'}
            </Badge>

            <div className="flex items-center gap-2 text-white">
              <Users className="h-4 w-4" />
              <span>{collaboration.participants.length}명 참여 중</span>
            </div>

            {isRecording && (
              <Badge variant="destructive" className="flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                녹화 중
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 grid gap-4" style={{
          gridTemplateColumns: collaboration.participants.length <= 1 ? '1fr' :
                             collaboration.participants.length <= 4 ? 'repeat(2, 1fr)' :
                             'repeat(3, 1fr)'
        }}>
          <Card className="relative aspect-video bg-gray-900 overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {collaboration.currentUser?.name || '나'} {isScreenSharing && '(화면 공유 중)'}
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {!isAudioEnabled && (
              <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">
                <MicOff className="h-4 w-4" />
              </div>
            )}
          </Card>

          {collaboration.participants
            .filter(p => p.id !== collaboration.currentUser?.id)
            .map((participant) => (
            <Card key={participant.id} className="relative aspect-video bg-gray-900 overflow-hidden">
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideosRef.current.set(participant.id, el);
                    const stream = collaboration.remoteStreams.get(participant.id);
                    if (stream) {
                      el.srcObject = stream;
                    }
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {participant.name}
                {participant.role === 'host' && ' 👑'}
              </div>
              {!participant.is_video_enabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="h-12 w-12 text-gray-400" />
                  <div className="absolute bottom-8 text-white text-center">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              {!participant.is_audio_enabled && (
                <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">
                  <MicOff className="h-4 w-4" />
                </div>
              )}
            </Card>
          ))}
        </div>

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
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            className="rounded-full h-12 w-12 p-0"
          >
            <Record className="h-5 w-5" />
          </Button>

          {recordingBlob && (
            <Button
              onClick={downloadRecording}
              variant="outline"
              size="lg"
              className="rounded-full h-12 w-12 p-0"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}

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

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700"
          >
            <ChatPanel
              messages={collaboration.messages}
              participants={collaboration.participants}
              currentUser={collaboration.currentUser}
              onSendMessage={collaboration.sendMessage}
              className="h-full rounded-none border-0"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};