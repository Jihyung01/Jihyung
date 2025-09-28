"""
Real-time Collaboration Server
WebRTC 시그널링 서버 및 실시간 채팅 시스템
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, asdict

import socketio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logger = logging.getLogger(__name__)

# Socket.IO 서버 설정
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# 연결된 사용자 및 방 관리
@dataclass
class User:
    id: str
    name: str
    email: str
    socket_id: str
    room_id: Optional[str] = None
    is_video_enabled: bool = True
    is_audio_enabled: bool = True
    joined_at: str = ""
    role: str = "participant"  # host, participant, viewer

@dataclass
class Room:
    id: str
    name: str
    description: str
    host_id: str
    participants: List[User]
    created_at: str
    max_participants: int = 10
    settings: Dict = None
    is_recording: bool = False

@dataclass
class ChatMessage:
    id: str
    room_id: str
    user_id: str
    user_name: str
    message: str
    timestamp: str
    type: str = "text"  # text, system, file

class CollaborationManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.users: Dict[str, User] = {}  # socket_id -> User
        self.user_rooms: Dict[str, str] = {}  # user_id -> room_id
        self.room_messages: Dict[str, List[ChatMessage]] = {}

    async def create_room(self, room_data: dict, host_user: User) -> Room:
        """새 방 생성"""
        room_id = f"room_{uuid.uuid4().hex[:8]}"

        room = Room(
            id=room_id,
            name=room_data.get('name', f'Room {room_id}'),
            description=room_data.get('description', ''),
            host_id=host_user.id,
            participants=[host_user],
            created_at=datetime.now().isoformat(),
            max_participants=room_data.get('max_participants', 10),
            settings=room_data.get('settings', {
                'allow_screen_share': True,
                'allow_chat': True,
                'require_approval': False,
                'is_locked': False
            })
        )

        # 호스트 역할 설정
        host_user.role = "host"
        host_user.room_id = room_id

        self.rooms[room_id] = room
        self.user_rooms[host_user.id] = room_id
        self.room_messages[room_id] = []

        logger.info(f"Room {room_id} created by {host_user.name}")
        return room

    async def join_room(self, room_id: str, user: User) -> bool:
        """방 참여"""
        if room_id not in self.rooms:
            return False

        room = self.rooms[room_id]

        # 방이 가득 찬 경우
        if len(room.participants) >= room.max_participants:
            return False

        # 이미 참여중인 경우
        if user.id in [p.id for p in room.participants]:
            return False

        # 방에 참여
        user.room_id = room_id
        user.joined_at = datetime.now().isoformat()
        room.participants.append(user)
        self.user_rooms[user.id] = room_id

        # 시스템 메시지 추가
        system_msg = ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            user_id="system",
            user_name="시스템",
            message=f"{user.name}님이 참여했습니다.",
            timestamp=datetime.now().isoformat(),
            type="system"
        )
        self.room_messages[room_id].append(system_msg)

        logger.info(f"User {user.name} joined room {room_id}")
        return True

    async def leave_room(self, user_id: str) -> Optional[str]:
        """방 나가기"""
        if user_id not in self.user_rooms:
            return None

        room_id = self.user_rooms[user_id]
        room = self.rooms.get(room_id)

        if not room:
            return None

        # 참가자 목록에서 제거
        room.participants = [p for p in room.participants if p.id != user_id]
        del self.user_rooms[user_id]

        # 호스트가 나간 경우 방 삭제 또는 호스트 변경
        if room.host_id == user_id:
            if len(room.participants) > 0:
                # 새 호스트 지정
                room.participants[0].role = "host"
                room.host_id = room.participants[0].id
                logger.info(f"New host {room.participants[0].name} for room {room_id}")
            else:
                # 방 삭제
                del self.rooms[room_id]
                del self.room_messages[room_id]
                logger.info(f"Room {room_id} deleted")
                return room_id

        # 시스템 메시지 추가
        user_name = next((u.name for u in self.users.values() if u.id == user_id), "사용자")
        system_msg = ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            user_id="system",
            user_name="시스템",
            message=f"{user_name}님이 나가셨습니다.",
            timestamp=datetime.now().isoformat(),
            type="system"
        )
        self.room_messages[room_id].append(system_msg)

        logger.info(f"User {user_id} left room {room_id}")
        return room_id

    async def add_message(self, room_id: str, user_id: str, message_text: str) -> Optional[ChatMessage]:
        """채팅 메시지 추가"""
        if room_id not in self.rooms:
            return None

        user = self.users.get(next((sid for sid, u in self.users.items() if u.id == user_id), ""))
        if not user:
            return None

        message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            user_id=user_id,
            user_name=user.name,
            message=message_text,
            timestamp=datetime.now().isoformat()
        )

        self.room_messages[room_id].append(message)

        # 메시지 개수 제한 (최근 500개만 유지)
        if len(self.room_messages[room_id]) > 500:
            self.room_messages[room_id] = self.room_messages[room_id][-500:]

        return message

# 전역 매니저 인스턴스
collaboration_manager = CollaborationManager()

# Socket.IO 이벤트 핸들러들
@sio.event
async def connect(sid, environ):
    """클라이언트 연결"""
    logger.info(f"Client {sid} connected")
    await sio.emit('connected', {'status': 'success'}, room=sid)

@sio.event
async def disconnect(sid):
    """클라이언트 연결 해제"""
    logger.info(f"Client {sid} disconnected")

    # 사용자 정보 찾기
    user = collaboration_manager.users.get(sid)
    if user:
        # 방에서 나가기
        room_id = await collaboration_manager.leave_room(user.id)
        if room_id and room_id in collaboration_manager.rooms:
            # 다른 참가자들에게 알림
            await sio.emit('participant_left', {
                'user_id': user.id,
                'user_name': user.name,
                'room_id': room_id
            }, room=room_id)

            # 업데이트된 참가자 목록 전송
            room = collaboration_manager.rooms[room_id]
            await sio.emit('participants_updated', {
                'participants': [asdict(p) for p in room.participants]
            }, room=room_id)

        # 사용자 제거
        del collaboration_manager.users[sid]

@sio.event
async def join_user(sid, data):
    """사용자 정보 등록"""
    try:
        user = User(
            id=data['user_id'],
            name=data['name'],
            email=data.get('email', ''),
            socket_id=sid,
            joined_at=datetime.now().isoformat()
        )

        collaboration_manager.users[sid] = user
        logger.info(f"User {user.name} registered with socket {sid}")

        await sio.emit('user_registered', {'status': 'success'}, room=sid)

    except Exception as e:
        logger.error(f"Error registering user: {e}")
        await sio.emit('error', {'message': 'Failed to register user'}, room=sid)

@sio.event
async def create_room(sid, data):
    """방 생성"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user:
            await sio.emit('error', {'message': 'User not registered'}, room=sid)
            return

        room = await collaboration_manager.create_room(data, user)

        # 방 참여
        await sio.enter_room(sid, room.id)

        await sio.emit('room_created', {
            'room': asdict(room),
            'status': 'success'
        }, room=sid)

    except Exception as e:
        logger.error(f"Error creating room: {e}")
        await sio.emit('error', {'message': 'Failed to create room'}, room=sid)

@sio.event
async def join_room(sid, data):
    """방 참여"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user:
            await sio.emit('error', {'message': 'User not registered'}, room=sid)
            return

        room_id = data['room_id']
        success = await collaboration_manager.join_room(room_id, user)

        if success:
            # Socket.IO 방 참여
            await sio.enter_room(sid, room_id)

            room = collaboration_manager.rooms[room_id]

            # 참여 성공 알림
            await sio.emit('room_joined', {
                'room': asdict(room),
                'status': 'success'
            }, room=sid)

            # 다른 참가자들에게 새 참가자 알림
            await sio.emit('participant_joined', {
                'user': asdict(user),
                'room_id': room_id
            }, room=room_id, skip_sid=sid)

            # 업데이트된 참가자 목록 전송
            await sio.emit('participants_updated', {
                'participants': [asdict(p) for p in room.participants]
            }, room=room_id)

            # 최근 채팅 메시지 전송
            recent_messages = collaboration_manager.room_messages.get(room_id, [])[-50:]
            await sio.emit('chat_history', {
                'messages': [asdict(msg) for msg in recent_messages]
            }, room=sid)

        else:
            await sio.emit('error', {'message': 'Failed to join room'}, room=sid)

    except Exception as e:
        logger.error(f"Error joining room: {e}")
        await sio.emit('error', {'message': 'Failed to join room'}, room=sid)

@sio.event
async def leave_room(sid, data):
    """방 나가기"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user:
            return

        room_id = await collaboration_manager.leave_room(user.id)
        if room_id:
            # Socket.IO 방 나가기
            await sio.leave_room(sid, room_id)

            await sio.emit('room_left', {'status': 'success'}, room=sid)

            # 방이 아직 존재하는 경우
            if room_id in collaboration_manager.rooms:
                room = collaboration_manager.rooms[room_id]

                # 다른 참가자들에게 알림
                await sio.emit('participant_left', {
                    'user_id': user.id,
                    'user_name': user.name
                }, room=room_id)

                # 업데이트된 참가자 목록 전송
                await sio.emit('participants_updated', {
                    'participants': [asdict(p) for p in room.participants]
                }, room=room_id)

    except Exception as e:
        logger.error(f"Error leaving room: {e}")

@sio.event
async def send_message(sid, data):
    """채팅 메시지 전송"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user or not user.room_id:
            await sio.emit('error', {'message': 'Not in a room'}, room=sid)
            return

        message = await collaboration_manager.add_message(
            user.room_id,
            user.id,
            data['message']
        )

        if message:
            # 방의 모든 참가자에게 메시지 전송
            await sio.emit('new_message', asdict(message), room=user.room_id)

    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await sio.emit('error', {'message': 'Failed to send message'}, room=sid)

# WebRTC 시그널링 이벤트들
@sio.event
async def webrtc_offer(sid, data):
    """WebRTC Offer 전달"""
    try:
        target_user_id = data['target_user_id']
        offer = data['offer']

        user = collaboration_manager.users.get(sid)
        if not user:
            return

        # 대상 사용자의 socket_id 찾기
        target_sid = None
        for socket_id, target_user in collaboration_manager.users.items():
            if target_user.id == target_user_id:
                target_sid = socket_id
                break

        if target_sid:
            await sio.emit('webrtc_offer', {
                'from_user_id': user.id,
                'offer': offer
            }, room=target_sid)

    except Exception as e:
        logger.error(f"Error handling WebRTC offer: {e}")

@sio.event
async def webrtc_answer(sid, data):
    """WebRTC Answer 전달"""
    try:
        target_user_id = data['target_user_id']
        answer = data['answer']

        user = collaboration_manager.users.get(sid)
        if not user:
            return

        # 대상 사용자의 socket_id 찾기
        target_sid = None
        for socket_id, target_user in collaboration_manager.users.items():
            if target_user.id == target_user_id:
                target_sid = socket_id
                break

        if target_sid:
            await sio.emit('webrtc_answer', {
                'from_user_id': user.id,
                'answer': answer
            }, room=target_sid)

    except Exception as e:
        logger.error(f"Error handling WebRTC answer: {e}")

@sio.event
async def webrtc_ice_candidate(sid, data):
    """ICE Candidate 전달"""
    try:
        target_user_id = data['target_user_id']
        candidate = data['candidate']

        user = collaboration_manager.users.get(sid)
        if not user:
            return

        # 대상 사용자의 socket_id 찾기
        target_sid = None
        for socket_id, target_user in collaboration_manager.users.items():
            if target_user.id == target_user_id:
                target_sid = socket_id
                break

        if target_sid:
            await sio.emit('webrtc_ice_candidate', {
                'from_user_id': user.id,
                'candidate': candidate
            }, room=target_sid)

    except Exception as e:
        logger.error(f"Error handling ICE candidate: {e}")

@sio.event
async def toggle_video(sid, data):
    """비디오 on/off"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user or not user.room_id:
            return

        user.is_video_enabled = data['enabled']

        # 방의 다른 참가자들에게 알림
        await sio.emit('participant_video_toggled', {
            'user_id': user.id,
            'enabled': user.is_video_enabled
        }, room=user.room_id, skip_sid=sid)

    except Exception as e:
        logger.error(f"Error toggling video: {e}")

@sio.event
async def toggle_audio(sid, data):
    """오디오 on/off"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user or not user.room_id:
            return

        user.is_audio_enabled = data['enabled']

        # 방의 다른 참가자들에게 알림
        await sio.emit('participant_audio_toggled', {
            'user_id': user.id,
            'enabled': user.is_audio_enabled
        }, room=user.room_id, skip_sid=sid)

    except Exception as e:
        logger.error(f"Error toggling audio: {e}")

@sio.event
async def start_screen_share(sid, data):
    """화면 공유 시작"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user or not user.room_id:
            return

        # 방의 다른 참가자들에게 알림
        await sio.emit('screen_share_started', {
            'user_id': user.id,
            'user_name': user.name
        }, room=user.room_id, skip_sid=sid)

    except Exception as e:
        logger.error(f"Error starting screen share: {e}")

@sio.event
async def stop_screen_share(sid, data):
    """화면 공유 중지"""
    try:
        user = collaboration_manager.users.get(sid)
        if not user or not user.room_id:
            return

        # 방의 다른 참가자들에게 알림
        await sio.emit('screen_share_stopped', {
            'user_id': user.id,
            'user_name': user.name
        }, room=user.room_id, skip_sid=sid)

    except Exception as e:
        logger.error(f"Error stopping screen share: {e}")

# FastAPI와 Socket.IO 통합
collaboration_app = socketio.ASGIApp(sio)

def setup_collaboration_routes(app: FastAPI):
    """FastAPI 앱에 협업 라우트 추가"""

    # Socket.IO 마운트
    app.mount("/socket.io", collaboration_app)

    @app.get("/api/collaboration/rooms")
    async def get_rooms():
        """활성화된 방 목록 조회"""
        rooms_data = []
        for room in collaboration_manager.rooms.values():
            rooms_data.append({
                'id': room.id,
                'name': room.name,
                'description': room.description,
                'participant_count': len(room.participants),
                'max_participants': room.max_participants,
                'host_name': room.participants[0].name if room.participants else '',
                'created_at': room.created_at,
                'settings': room.settings
            })
        return {'rooms': rooms_data}

    @app.get("/api/collaboration/rooms/{room_id}")
    async def get_room(room_id: str):
        """특정 방 정보 조회"""
        room = collaboration_manager.rooms.get(room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        return {'room': asdict(room)}

    @app.get("/api/collaboration/rooms/{room_id}/messages")
    async def get_room_messages(room_id: str, limit: int = 50):
        """방의 채팅 메시지 조회"""
        if room_id not in collaboration_manager.rooms:
            raise HTTPException(status_code=404, detail="Room not found")

        messages = collaboration_manager.room_messages.get(room_id, [])
        recent_messages = messages[-limit:] if len(messages) > limit else messages

        return {
            'messages': [asdict(msg) for msg in recent_messages],
            'total': len(messages)
        }

# 상태 정보 API
@sio.event
async def get_room_info(sid, data):
    """방 정보 조회"""
    try:
        room_id = data['room_id']
        room = collaboration_manager.rooms.get(room_id)

        if room:
            await sio.emit('room_info', asdict(room), room=sid)
        else:
            await sio.emit('error', {'message': 'Room not found'}, room=sid)

    except Exception as e:
        logger.error(f"Error getting room info: {e}")
        await sio.emit('error', {'message': 'Failed to get room info'}, room=sid)

@sio.event
async def ping(sid, data):
    """연결 상태 확인"""
    await sio.emit('pong', {'timestamp': datetime.now().isoformat()}, room=sid)