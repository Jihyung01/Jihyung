import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import {
  Camera,
  Video,
  Mic,
  FileImage,
  FileVideo,
  FileAudio,
  Upload,
  Download,
  Edit3,
  Share2,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Crop,
  Filter,
  Volume2,
  VolumeX,
  Maximize2,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Music,
  Image as ImageIcon,
  Film,
  Headphones,
  Cloud,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Plus,
  MoreHorizontal,
  Settings,
  Info
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    quality?: string;
    createdAt: string;
    tags?: string[];
  };
}

interface MediaIntegrationHubProps {
  onClose?: () => void;
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  type: 'audio' | 'video' | null;
}

export const MediaIntegrationHub: React.FC<MediaIntegrationHubProps> = ({
  onClose,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<'capture' | 'library' | 'edit' | 'cloud'>('capture');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    type: null
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      const interval = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [recordingState.isRecording, recordingState.isPaused]);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      toast.success('카메라가 활성화되었습니다! 📷');
    } catch (error) {
      toast.error('카메라 접근 권한이 필요합니다.');
    }
  }, []);

  // Take photo
  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file: MediaFile = {
            id: Date.now().toString(),
            name: `Photo_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`,
            type: 'image',
            url: URL.createObjectURL(blob),
            size: blob.size,
            metadata: {
              width: canvas.width,
              height: canvas.height,
              format: 'JPEG',
              createdAt: new Date().toISOString()
            }
          };

          setMediaFiles(prev => [file, ...prev]);
          toast.success('사진이 촬영되었습니다! 📸');
        }
      }, 'image/jpeg', 0.9);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (type: 'audio' | 'video') => {
    try {
      recordedChunksRef.current = [];

      const constraints = type === 'video'
        ? { video: true, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: type === 'video' ? 'video/webm' : 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: type === 'video' ? 'video/webm' : 'audio/webm'
        });

        const file: MediaFile = {
          id: Date.now().toString(),
          name: `${type}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`,
          type,
          url: URL.createObjectURL(blob),
          size: blob.size,
          duration: recordingState.duration,
          metadata: {
            format: 'WebM',
            createdAt: new Date().toISOString()
          }
        };

        setMediaFiles(prev => [file, ...prev]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        type
      });

      toast.success(`${type === 'video' ? '비디오' : '오디오'} 녹화가 시작되었습니다!`);
    } catch (error) {
      toast.error('녹화 시작에 실패했습니다.');
    }
  }, [recordingState.duration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        type: null
      });
      toast.success('녹화가 완료되었습니다!');
    }
  }, [recordingState.isRecording]);

  // Pause/Resume recording
  const toggleRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
    } else {
      mediaRecorderRef.current.pause();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
    }
  }, [recordingState.isPaused]);

  // File upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach(file => {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          const mediaFile: MediaFile = {
            id: fileId,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' :
                  file.type.startsWith('video/') ? 'video' : 'audio',
            url: URL.createObjectURL(file),
            size: file.size,
            metadata: {
              format: file.type,
              createdAt: new Date().toISOString()
            }
          };

          setMediaFiles(prev => [mediaFile, ...prev]);
          setUploadProgress(prev => {
            const { [fileId]: _, ...rest } = prev;
            return rest;
          });

          toast.success(`${file.name} 업로드 완료!`);
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 100) }));
      }, 100);
    });
  }, []);

  // Delete file
  const deleteFile = useCallback((fileId: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
    toast.success('파일이 삭제되었습니다.');
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'capture', label: '캡처', icon: <Camera className="h-4 w-4" /> },
    { id: 'library', label: '라이브러리', icon: <FileImage className="h-4 w-4" /> },
    { id: 'edit', label: '편집', icon: <Edit3 className="h-4 w-4" /> },
    { id: 'cloud', label: '클라우드', icon: <Cloud className="h-4 w-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`w-full max-w-6xl mx-auto ${className}`}
    >
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">미디어 허브</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  모든 미디어를 한 곳에서 관리하세요
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mt-6">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Capture Tab */}
          {activeTab === 'capture' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Camera Preview */}
              <div className="relative bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 md:h-80 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {recordingState.isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      {formatDuration(recordingState.duration)}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={initializeCamera}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  카메라 시작
                </Button>

                <Button
                  onClick={takePhoto}
                  variant="outline"
                  className="border-blue-200 dark:border-blue-800"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  사진 촬영
                </Button>

                {!recordingState.isRecording ? (
                  <>
                    <Button
                      onClick={() => startRecording('video')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      비디오 녹화
                    </Button>

                    <Button
                      onClick={() => startRecording('audio')}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      오디오 녹음
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={toggleRecording}
                      variant="outline"
                      className="border-orange-200 dark:border-orange-800"
                    >
                      {recordingState.isPaused ? (
                        <><Play className="h-4 w-4 mr-2" />재개</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-2" />일시정지</>
                      )}
                    </Button>

                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      정지
                    </Button>
                  </>
                )}
              </div>

              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">파일 드래그 또는 클릭</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  이미지, 비디오, 오디오 파일을 업로드하세요
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(uploadProgress).map(([fileId, progress]) => (
                    <div key={fileId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>업로드 중...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Library Tab */}
          {activeTab === 'library' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: '총 파일',
                    value: mediaFiles.length,
                    icon: <HardDrive className="h-4 w-4" />,
                    color: 'from-blue-500 to-cyan-500'
                  },
                  {
                    label: '총 용량',
                    value: formatFileSize(mediaFiles.reduce((sum, file) => sum + file.size, 0)),
                    icon: <FileImage className="h-4 w-4" />,
                    color: 'from-purple-500 to-pink-500'
                  },
                  {
                    label: '선택됨',
                    value: selectedFiles.length,
                    icon: <Eye className="h-4 w-4" />,
                    color: 'from-green-500 to-emerald-500'
                  }
                ].map((stat, index) => (
                  <Card key={stat.label} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-r ${stat.color} text-white rounded-lg`}>
                        {stat.icon}
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* File Grid */}
              {mediaFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileImage className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                    미디어 파일이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    캡처 탭에서 새 미디어를 추가해보세요
                  </p>
                  <Button onClick={() => setActiveTab('capture')}>
                    <Plus className="h-4 w-4 mr-2" />
                    미디어 추가
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mediaFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      whileHover={{ scale: 1.02 }}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-all">
                        {/* File Preview */}
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                          {file.type === 'image' && (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {file.type === 'video' && (
                            <video
                              src={file.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          )}
                          {file.type === 'audio' && (
                            <div className="w-full h-full flex items-center justify-center">
                              <Headphones className="h-16 w-16 text-gray-400" />
                            </div>
                          )}

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteFile(file.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* File Info */}
                        <CardContent className="p-4">
                          <h4 className="font-medium truncate mb-2">{file.name}</h4>
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between">
                              <span>크기:</span>
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                            {file.duration && (
                              <div className="flex justify-between">
                                <span>길이:</span>
                                <span>{formatDuration(file.duration)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>형식:</span>
                              <Badge variant="secondary" className="text-xs">
                                {file.metadata?.format || file.type}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-12">
                <Edit3 className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  고급 미디어 편집
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  AI 기반 자동 편집, 필터, 효과 등의 기능이 곧 추가됩니다
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: <Crop className="h-8 w-8" />, label: '크롭 & 리사이즈' },
                    { icon: <Filter className="h-8 w-8" />, label: 'AI 필터' },
                    { icon: <Sparkles className="h-8 w-8" />, label: '자동 보정' },
                    { icon: <Music className="h-8 w-8" />, label: '오디오 편집' }
                  ].map((feature, index) => (
                    <Card key={index} className="p-6 text-center cursor-pointer hover:shadow-md transition-all">
                      <div className="text-gray-400 mb-3 flex justify-center">
                        {feature.icon}
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {feature.label}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Cloud Tab */}
          {activeTab === 'cloud' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Cloud Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl">
                      <Cloud className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">15GB</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">사용 중</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl">
                      <Wifi className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">85GB</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">남은 용량</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl">
                      <RefreshCw className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">자동</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">동기화</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Cloud Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    name: 'Google Drive',
                    connected: true,
                    files: 1247,
                    usage: '8.2GB',
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    name: 'Dropbox',
                    connected: true,
                    files: 534,
                    usage: '4.1GB',
                    color: 'from-blue-600 to-blue-700'
                  },
                  {
                    name: 'OneDrive',
                    connected: false,
                    files: 0,
                    usage: '0GB',
                    color: 'from-blue-700 to-blue-800'
                  },
                  {
                    name: 'iCloud',
                    connected: false,
                    files: 0,
                    usage: '0GB',
                    color: 'from-gray-500 to-gray-600'
                  }
                ].map((service, index) => (
                  <Card key={service.name} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center text-white`}>
                          <Cloud className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {service.connected ? '연결됨' : '연결 안됨'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={service.connected ? 'default' : 'secondary'}>
                        {service.connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      </Badge>
                    </div>

                    {service.connected && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{service.files}</div>
                          <div className="text-gray-600 dark:text-gray-400">파일</div>
                        </div>
                        <div>
                          <div className="font-medium">{service.usage}</div>
                          <div className="text-gray-600 dark:text-gray-400">사용량</div>
                        </div>
                      </div>
                    )}

                    <Button
                      variant={service.connected ? 'outline' : 'default'}
                      className="w-full mt-4"
                    >
                      {service.connected ? '설정' : '연결하기'}
                    </Button>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MediaIntegrationHub;