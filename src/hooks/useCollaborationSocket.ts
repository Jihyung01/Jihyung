import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export interface User {
  id: string
  name: string
  email: string
  socket_id: string
  room_id?: string
  is_video_enabled: boolean
  is_audio_enabled: boolean
  joined_at: string
  role: 'host' | 'participant' | 'viewer'
}

export interface Room {
  id: string
  name: string
  description: string
  host_id: string
  participants: User[]
  created_at: string
  max_participants: number
  settings: {
    allow_screen_share: boolean
    allow_chat: boolean
    require_approval: boolean
    is_locked: boolean
  }
  is_recording: boolean
}

export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  user_name: string
  message: string
  timestamp: string
  type: 'text' | 'system' | 'file'
}

export interface CollaborationState {
  isConnected: boolean
  currentRoom: Room | null
  currentUser: User | null
  participants: User[]
  messages: ChatMessage[]
  isInCall: boolean
}

export function useCollaborationSocket(serverUrl: string = 'http://localhost:8006') {
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    currentRoom: null,
    currentUser: null,
    participants: [],
    messages: [],
    isInCall: false
  })

  // WebRTC 연결 관리
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())

  // WebRTC 설정
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }

  // Socket 연결 초기화
  const connect = useCallback((user: Omit<User, 'socket_id' | 'joined_at' | 'role'>) => {
    if (socketRef.current?.connected) {
      return
    }

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setState(prev => ({ ...prev, isConnected: true }))

      // 사용자 등록
      socket.emit('join_user', {
        user_id: user.id,
        name: user.name,
        email: user.email
      })

      toast.success('서버에 연결되었습니다')
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setState(prev => ({
        ...prev,
        isConnected: false,
        currentRoom: null,
        participants: [],
        isInCall: false
      }))
      toast.warning('서버 연결이 끊어졌습니다')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      toast.error('서버 연결에 실패했습니다')
    })

    // 사용자 등록 완료
    socket.on('user_registered', () => {
      console.log('User registered successfully')
      setState(prev => ({
        ...prev,
        currentUser: {
          ...user,
          socket_id: socket.id!,
          joined_at: new Date().toISOString(),
          role: 'participant',
          room_id: undefined,
          is_video_enabled: true,
          is_audio_enabled: true
        }
      }))
    })

    // 방 관련 이벤트
    socket.on('room_created', (data) => {
      console.log('Room created:', data.room)
      setState(prev => ({
        ...prev,
        currentRoom: data.room,
        participants: data.room.participants,
        isInCall: false
      }))
      toast.success(`"${data.room.name}" 방이 생성되었습니다`)
    })

    socket.on('room_joined', (data) => {
      console.log('Room joined:', data.room)
      setState(prev => ({
        ...prev,
        currentRoom: data.room,
        participants: data.room.participants,
        isInCall: false
      }))
      toast.success(`"${data.room.name}" 방에 참여했습니다`)
    })

    socket.on('room_left', () => {
      console.log('Left room')
      setState(prev => ({
        ...prev,
        currentRoom: null,
        participants: [],
        messages: [],
        isInCall: false
      }))
      // 모든 WebRTC 연결 정리
      cleanup()
      toast.success('방에서 나왔습니다')
    })

    socket.on('participant_joined', (data) => {
      console.log('Participant joined:', data.user)
      toast.success(`${data.user.name}님이 참여했습니다`)
    })

    socket.on('participant_left', (data) => {
      console.log('Participant left:', data.user_name)

      // WebRTC 연결 정리
      if (peerConnections.current.has(data.user_id)) {
        peerConnections.current.get(data.user_id)?.close()
        peerConnections.current.delete(data.user_id)
      }

      remoteStreamsRef.current.delete(data.user_id)

      toast.info(`${data.user_name}님이 나가셨습니다`)
    })

    socket.on('participants_updated', (data) => {
      console.log('Participants updated:', data.participants)
      setState(prev => ({ ...prev, participants: data.participants }))
    })

    // 채팅 관련 이벤트
    socket.on('new_message', (message: ChatMessage) => {
      console.log('New message:', message)
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message]
      }))
    })

    socket.on('chat_history', (data) => {
      console.log('Chat history loaded:', data.messages.length)
      setState(prev => ({ ...prev, messages: data.messages }))
    })

    // WebRTC 시그널링 이벤트
    socket.on('webrtc_offer', async (data) => {
      console.log('Received WebRTC offer from:', data.from_user_id)
      await handleWebRTCOffer(data.from_user_id, data.offer)
    })

    socket.on('webrtc_answer', async (data) => {
      console.log('Received WebRTC answer from:', data.from_user_id)
      await handleWebRTCAnswer(data.from_user_id, data.answer)
    })

    socket.on('webrtc_ice_candidate', async (data) => {
      console.log('Received ICE candidate from:', data.from_user_id)
      await handleICECandidate(data.from_user_id, data.candidate)
    })

    // 미디어 제어 이벤트
    socket.on('participant_video_toggled', (data) => {
      setState(prev => ({
        ...prev,
        participants: prev.participants.map(p =>
          p.id === data.user_id ? { ...p, is_video_enabled: data.enabled } : p
        )
      }))
    })

    socket.on('participant_audio_toggled', (data) => {
      setState(prev => ({
        ...prev,
        participants: prev.participants.map(p =>
          p.id === data.user_id ? { ...p, is_audio_enabled: data.enabled } : p
        )
      }))
    })

    socket.on('screen_share_started', (data) => {
      toast.info(`${data.user_name}님이 화면 공유를 시작했습니다`)
    })

    socket.on('screen_share_stopped', (data) => {
      toast.info(`${data.user_name}님이 화면 공유를 중지했습니다`)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error(error.message || '오류가 발생했습니다')
    })

  }, [serverUrl])

  // WebRTC 관련 함수들
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfiguration)

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', {
          target_user_id: userId,
          candidate: event.candidate
        })
      }
    }

    pc.ontrack = (event) => {
      console.log('Received remote stream from:', userId)
      const [remoteStream] = event.streams
      remoteStreamsRef.current.set(userId, remoteStream)

      // 원격 스트림 이벤트 발생
      window.dispatchEvent(new CustomEvent('remoteStreamAdded', {
        detail: { userId, stream: remoteStream }
      }))
    }

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, pc.connectionState)
    }

    // 로컬 스트림이 있다면 추가
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    peerConnections.current.set(userId, pc)
    return pc
  }, [])

  const handleWebRTCOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection(fromUserId)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      if (socketRef.current) {
        socketRef.current.emit('webrtc_answer', {
          target_user_id: fromUserId,
          answer: answer
        })
      }
    } catch (error) {
      console.error('Error handling WebRTC offer:', error)
    }
  }, [createPeerConnection])

  const handleWebRTCAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnections.current.get(fromUserId)
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      }
    } catch (error) {
      console.error('Error handling WebRTC answer:', error)
    }
  }, [])

  const handleICECandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnections.current.get(fromUserId)
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }, [])

  // 로컬 미디어 스트림 초기화
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
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
      })

      localStreamRef.current = stream

      // 기존 연결들에 스트림 추가
      peerConnections.current.forEach((pc, userId) => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })
      })

      return stream
    } catch (error) {
      console.error('Failed to access media devices:', error)
      toast.error('카메라 또는 마이크 접근이 거부되었습니다')
      throw error
    }
  }, [])

  // 화상 통화 시작
  const startVideoCall = useCallback(async () => {
    try {
      if (!state.currentRoom || !state.currentUser) {
        toast.error('방에 먼저 참여해주세요')
        return
      }

      // 로컬 미디어 스트림 초기화
      await initializeMedia()

      // 다른 참가자들과 WebRTC 연결 설정
      for (const participant of state.participants) {
        if (participant.id !== state.currentUser.id) {
          const pc = createPeerConnection(participant.id)

          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          if (socketRef.current) {
            socketRef.current.emit('webrtc_offer', {
              target_user_id: participant.id,
              offer: offer
            })
          }
        }
      }

      setState(prev => ({ ...prev, isInCall: true }))
      toast.success('화상 통화가 시작되었습니다')
    } catch (error) {
      console.error('Failed to start video call:', error)
      toast.error('화상 통화 시작에 실패했습니다')
    }
  }, [state.currentRoom, state.currentUser, state.participants, initializeMedia, createPeerConnection])

  // 정리 함수
  const cleanup = useCallback(() => {
    // WebRTC 연결들 정리
    peerConnections.current.forEach(pc => pc.close())
    peerConnections.current.clear()

    // 스트림 정리
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    remoteStreamsRef.current.clear()
  }, [])

  // API 함수들
  const createRoom = useCallback((roomData: {
    name: string
    description?: string
    max_participants?: number
    settings?: Partial<Room['settings']>
  }) => {
    if (!socketRef.current?.connected) {
      toast.error('서버에 연결되지 않았습니다')
      return
    }

    socketRef.current.emit('create_room', {
      name: roomData.name,
      description: roomData.description || '',
      max_participants: roomData.max_participants || 10,
      settings: {
        allow_screen_share: true,
        allow_chat: true,
        require_approval: false,
        is_locked: false,
        ...roomData.settings
      }
    })
  }, [])

  const joinRoom = useCallback((roomId: string) => {
    if (!socketRef.current?.connected) {
      toast.error('서버에 연결되지 않았습니다')
      return
    }

    socketRef.current.emit('join_room', { room_id: roomId })
  }, [])

  const leaveRoom = useCallback(() => {
    if (!socketRef.current?.connected) return

    socketRef.current.emit('leave_room', {})
    cleanup()
  }, [cleanup])

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current?.connected || !state.currentRoom) {
      toast.error('방에 참여하지 않았습니다')
      return
    }

    socketRef.current.emit('send_message', { message })
  }, [state.currentRoom])

  const toggleVideo = useCallback((enabled: boolean) => {
    if (!socketRef.current?.connected) return

    // 로컬 비디오 트랙 제어
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = enabled
      }
    }

    socketRef.current.emit('toggle_video', { enabled })
  }, [])

  const toggleAudio = useCallback((enabled: boolean) => {
    if (!socketRef.current?.connected) return

    // 로컬 오디오 트랙 제어
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = enabled
      }
    }

    socketRef.current.emit('toggle_audio', { enabled })
  }, [])

  // 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    cleanup()
    setState({
      isConnected: false,
      currentRoom: null,
      currentUser: null,
      participants: [],
      messages: [],
      isInCall: false
    })
  }, [cleanup])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    // 상태
    ...state,
    localStream: localStreamRef.current,
    remoteStreams: remoteStreamsRef.current,

    // 연결 관리
    connect,
    disconnect,

    // 방 관리
    createRoom,
    joinRoom,
    leaveRoom,

    // 화상 통화
    startVideoCall,
    initializeMedia,

    // 채팅
    sendMessage,

    // 미디어 제어
    toggleVideo,
    toggleAudio,

    // 유틸리티
    cleanup
  }
}