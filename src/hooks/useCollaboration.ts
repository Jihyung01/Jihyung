// src/hooks/useCollaboration.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export interface CollaborationUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isTyping: boolean;
  cursorPosition?: { start: number; end: number };
  selection?: { start: number; end: number; text: string };
}

export interface CollaborationComment {
  id: string;
  userId: string;
  content: string;
  position: { start: number; end: number };
  createdAt: string;
  resolved: boolean;
}

export interface CollaborationState {
  isConnected: boolean;
  users: Map<string, CollaborationUser>;
  comments: Map<string, CollaborationComment>;
  documentId: string;
  userId?: string;
}

export interface UseCollaborationOptions {
  documentId: string;
  serverUrl?: string;
  autoConnect?: boolean;
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (userId: string) => void;
  onDocumentUpdate?: (content: any) => void;
  onCommentAdded?: (comment: CollaborationComment) => void;
}

export interface UseCollaborationReturn {
  state: CollaborationState;
  connect: () => void;
  disconnect: () => void;
  updateDocument: (content: any) => void;
  updateCursor: (position: { start: number; end: number }) => void;
  updateSelection: (selection: { start: number; end: number; text: string }) => void;
  setTyping: (isTyping: boolean) => void;
  addComment: (content: string, position: { start: number; end: number }) => void;
  resolveComment: (commentId: string) => void;
  sendHeartbeat: () => void;
}

export const useCollaboration = (options: UseCollaborationOptions): UseCollaborationReturn => {
  const {
    documentId,
    serverUrl = 'ws://localhost:1234',
    autoConnect = true,
    onUserJoined,
    onUserLeft,
    onDocumentUpdate,
    onCommentAdded
  } = options;

  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    users: new Map(),
    comments: new Map(),
    documentId,
    userId: undefined
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket 연결
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    try {
      const url = `${serverUrl}/${documentId}`;
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          sendMessage({ type: 'heartbeat' });
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({
          ...prev,
          isConnected: false,
          users: new Map()
        }));
        
        // Clear intervals
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, [documentId, serverUrl]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // 메시지 핸들링
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'init':
        setState(prev => ({
          ...prev,
          userId: data.userId,
          users: new Map(data.users?.map((user: CollaborationUser) => [user.id, user]) || []),
          comments: new Map(data.comments?.map((comment: CollaborationComment) => [comment.id, comment]) || [])
        }));
        break;

      case 'userJoined':
        setState(prev => {
          const newUsers = new Map(prev.users);
          newUsers.set(data.user.id, data.user);
          return { ...prev, users: newUsers };
        });
        onUserJoined?.(data.user);
        break;

      case 'userLeft':
        setState(prev => {
          const newUsers = new Map(prev.users);
          newUsers.delete(data.userId);
          return { ...prev, users: newUsers };
        });
        onUserLeft?.(data.userId);
        break;

      case 'update':
        if (data.userId !== state.userId) {
          onDocumentUpdate?.(data.content);
        }
        break;

      case 'cursor':
        setState(prev => {
          const newUsers = new Map(prev.users);
          const user = newUsers.get(data.userId);
          if (user) {
            user.cursorPosition = data.position;
            newUsers.set(data.userId, user);
          }
          return { ...prev, users: newUsers };
        });
        break;

      case 'typing':
        setState(prev => {
          const newUsers = new Map(prev.users);
          const user = newUsers.get(data.userId);
          if (user) {
            user.isTyping = data.isTyping;
            newUsers.set(data.userId, user);
          }
          return { ...prev, users: newUsers };
        });
        break;

      case 'selection':
        setState(prev => {
          const newUsers = new Map(prev.users);
          const user = newUsers.get(data.userId);
          if (user) {
            user.selection = data.selection;
            newUsers.set(data.userId, user);
          }
          return { ...prev, users: newUsers };
        });
        break;

      case 'comment':
        if (data.action === 'create') {
          setState(prev => {
            const newComments = new Map(prev.comments);
            newComments.set(data.comment.id, data.comment);
            return { ...prev, comments: newComments };
          });
          onCommentAdded?.(data.comment);
        } else if (data.action === 'resolve') {
          setState(prev => {
            const newComments = new Map(prev.comments);
            const comment = newComments.get(data.commentId);
            if (comment) {
              comment.resolved = true;
              newComments.set(data.commentId, comment);
            }
            return { ...prev, comments: newComments };
          });
        }
        break;

      case 'error':
        console.error('Server error:', data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, [state.userId, onUserJoined, onUserLeft, onDocumentUpdate, onCommentAdded]);

  // 문서 업데이트
  const updateDocument = useCallback((content: any) => {
    sendMessage({
      type: 'update',
      content
    });
  }, [sendMessage]);

  // 커서 위치 업데이트
  const updateCursor = useCallback((position: { start: number; end: number }) => {
    sendMessage({
      type: 'cursor',
      position
    });
  }, [sendMessage]);

  // 텍스트 선택 업데이트
  const updateSelection = useCallback((selection: { start: number; end: number; text: string }) => {
    sendMessage({
      type: 'selection',
      selection
    });
  }, [sendMessage]);

  // 타이핑 상태 업데이트
  const setTyping = useCallback((isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      isTyping
    });

    // Auto-clear typing after 2 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    }
  }, [sendMessage]);

  // 댓글 추가
  const addComment = useCallback((content: string, position: { start: number; end: number }) => {
    sendMessage({
      type: 'comment',
      action: 'create',
      content,
      position
    });
  }, [sendMessage]);

  // 댓글 해결
  const resolveComment = useCallback((commentId: string) => {
    sendMessage({
      type: 'comment',
      action: 'resolve',
      commentId
    });
  }, [sendMessage]);

  // 하트비트 전송
  const sendHeartbeat = useCallback(() => {
    sendMessage({ type: 'heartbeat' });
  }, [sendMessage]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
    updateDocument,
    updateCursor,
    updateSelection,
    setTyping,
    addComment,
    resolveComment,
    sendHeartbeat
  };
};
