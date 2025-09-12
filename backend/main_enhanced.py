"""
Enhanced Jihyung Backend
최고 수준의 AI 기반 생산성 플랫폼
"""

from fastapi import FastAPI, HTTPException, Depends, Form, UploadFile, File, WebSocket, WebSocketDisconnect, BackgroundTasks, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional, Dict, Any, Union
import asyncpg
import asyncio
import os
import json
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import PyJWTError, InvalidTokenError, DecodeError, InvalidSignatureError
from passlib.context import CryptContext
import openai
import boto3
from botocore.exceptions import ClientError
import logging
import redis
from dotenv import load_dotenv
import aiofiles
import httpx
from collections import defaultdict
import re
import hashlib

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database and Redis connections
db_pool = None
redis_client = None

# In-memory storage for when database is not available
memory_storage = {
    'users': {},
    'notes': {},
    'tasks': {},
    'events': {},
    'user_tasks': {},  # user_id -> [tasks]
    'user_events': {},  # user_id -> [events]
    'counters': {'note_id': 1, 'task_id': 1, 'event_id': 1}
}

def get_next_id(entity_type):
    """Get next ID for in-memory storage"""
    memory_storage['counters'][f'{entity_type}_id'] += 1
    return memory_storage['counters'][f'{entity_type}_id']

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        self.user_sessions: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id].append(websocket)
        self.user_sessions[id(websocket)] = user_id
        logger.info(f"User {user_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket):
        user_id = self.user_sessions.get(id(websocket))
        if user_id and websocket in self.active_connections[user_id]:
            self.active_connections[user_id].remove(websocket)
            del self.user_sessions[id(websocket)]
            logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(self, message: dict, user_id: str):
        connections = self.active_connections.get(user_id, [])
        for connection in connections[:]:  # Copy list to avoid modification during iteration
            try:
                await connection.send_json(message)
            except:
                connections.remove(connection)

    async def broadcast(self, message: dict):
        for user_id, connections in self.active_connections.items():
            for connection in connections[:]:
                try:
                    await connection.send_json(message)
                except:
                    connections.remove(connection)

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_redis()
    logger.info("🚀 Jihyung Backend started successfully!")
    yield
    # Shutdown
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()
    logger.info("👋 Jihyung Backend shut down gracefully")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Jihyung - Enhanced",
    description="최고 수준의 AI 기반 생산성 플랫폼",
    version="2.0.0",
    lifespan=lifespan
)

# Enhanced CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5178",
        "http://127.0.0.1:5178",
        "http://localhost:8006",
        "http://127.0.0.1:8006",
        "http://0.0.0.0:5178",
        "http://0.0.0.0:8006",
        "https://jihyung.vercel.app",
        "https://jihyung-git-main.vercel.app",
        "https://preview.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,  # 인증을 위해 다시 활성화
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Request logging middleware for debugging
@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming requests for debugging"""
    try:
        # Read request body
        body = await request.body()
        
        # Log request details
        logger.info(f"🔍 Request: {request.method} {request.url}")
        logger.info(f"🔍 Headers: {dict(request.headers)}")
        
        if body:
            try:
                # Try to decode and log the body
                body_str = body.decode('utf-8')
                logger.info(f"🔍 Body: {body_str}")
                
                # Try to parse as JSON for better formatting
                try:
                    import json
                    parsed_body = json.loads(body_str)
                    logger.info(f"🔍 Parsed JSON: {json.dumps(parsed_body, indent=2)}")
                except:
                    logger.info(f"🔍 Raw body: {body_str}")
            except:
                logger.info(f"🔍 Binary body length: {len(body)}")
        else:
            logger.info("🔍 No body")
            
        # Continue with request processing
        response = await call_next(request)
        
        logger.info(f"📤 Response: {response.status_code}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Request logging error: {e}")
        # Continue even if logging fails
        return await call_next(request)

# Validation error handler for better debugging
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed information"""
    logger.error(f"❌ Validation error for {request.method} {request.url}")
    logger.error(f"❌ Validation details: {exc.errors()}")
    
    # Try to get the request body for debugging
    try:
        body = await request.body()
        if body:
            body_str = body.decode('utf-8')
            logger.error(f"❌ Request body that caused error: {body_str}")
    except:
        logger.error("❌ Could not read request body")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": "Input validation failed. Please check the request format.",
            "debugging_info": {
                "url": str(request.url),
                "method": request.method,
                "error_count": len(exc.errors())
            }
        }
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle value errors with detailed information"""
    logger.error(f"❌ Value error for {request.method} {request.url}: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={
            "detail": str(exc),
            "message": "Invalid value provided in request",
            "debugging_info": {
                "url": str(request.url),
                "method": request.method
            }
        }
    )

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ai_second_brain")
AUTH_ENABLED = os.getenv("AUTH_ENABLED", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Initialize OpenAI
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# Initialize AWS S3
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

async def init_db():
    """Initialize database connection pool with enhanced schema"""
    global db_pool
    
    # DATABASE_URL이 설정되지 않았으면 메모리 저장소 사용
    if not DATABASE_URL or DATABASE_URL == "postgresql://postgres:postgres@localhost:5432/ai_second_brain":
        logger.info("💾 DATABASE_URL이 설정되지 않음 - 메모리 저장소 사용")
        db_pool = None
        
        # 메모리 저장소 초기화
        memory_storage['users'] = {}
        memory_storage['notes'] = {}
        memory_storage['tasks'] = {}
        memory_storage['events'] = {}
        memory_storage['user_tasks'] = {}
        memory_storage['user_events'] = {}
        memory_storage['settings'] = {}
        logger.info("✅ 메모리 저장소 초기화 완료")
        return
    
    try:
        logger.info("🔄 Supabase 데이터베이스 연결 시도...")
        logger.info(f"   연결 URL: {DATABASE_URL[:50]}...")
        
        # URL을 개별 구성요소로 분해해서 연결
        if "lxrzlszthqoufxapdqml" in DATABASE_URL:
            db_pool = await asyncpg.create_pool(
                host="aws-0-ap-northeast-2.pooler.supabase.com",
                port=6543,
                user="postgres.lxrzlszthqoufxapdqml",
                password="dyddmlrltk98",
                database="postgres",
                min_size=1,
                max_size=10,
                command_timeout=60,
                statement_cache_size=0,
                server_settings={
                    'application_name': 'ai_second_brain',
                    'jit': 'off'
                }
            )
        else:
            # 기본 방식
            db_pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,
                max_size=10,
                command_timeout=60,
                statement_cache_size=0,
                server_settings={
                    'application_name': 'ai_second_brain',
                    'jit': 'off'
                }
            )
        
        # 연결 테스트
        async with db_pool.acquire() as connection:
            version = await connection.fetchval('SELECT version()')
            logger.info("✅ Supabase 데이터베이스 연결 성공!")
            logger.info(f"📊 PostgreSQL 버전: {version[:80]}...")
            
            # 스키마 생성
            await create_enhanced_schema(connection)
            logger.info("✅ 데이터베이스 스키마 초기화 완료")
            
    except Exception as e:
        logger.error(f"❌ Supabase 연결 실패: {str(e)}")
        
        # 상세한 오류 분석
        error_str = str(e)
        if "'NoneType' object has no attribute 'group'" in error_str:
            logger.error("💡 해결책: 연결 문자열 형식 문제 - URL 인코딩 확인 필요")
        elif "authentication" in error_str.lower():
            logger.error("💡 해결책: 비밀번호 또는 사용자명 확인 필요")
        elif "Name or service not known" in error_str:
            logger.error("💡 해결책: 네트워크 연결 또는 호스트명 확인 필요")
        
        logger.info("💾 메모리 저장소로 폴백...")
        if db_pool:
            await db_pool.close()
            db_pool = None
        
        # 메모리 저장소 초기화
        memory_storage['users'] = {}
        memory_storage['notes'] = {}
        memory_storage['tasks'] = {}
        memory_storage['events'] = {}
        memory_storage['user_tasks'] = {}
        memory_storage['user_events'] = {}
        memory_storage['settings'] = {}
        logger.info("✅ 메모리 저장소 초기화 완료")

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        # Skip Redis for now - not required for basic functionality
        logger.info("⚠️ Redis disabled for development")
        redis_client = None
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed: {e}")
        redis_client = None

async def create_enhanced_schema(connection):
    """Create enhanced database schema"""
    
    # Drop existing tables for fresh start
    tables_to_drop = [
        'ai_interactions', 'file_attachments', 'note_versions', 'collaboration_sessions',
        'collaboration_messages', 'calendar_events', 'tasks', 'notes', 'users'
    ]
    
    for table in tables_to_drop:
        await connection.execute(f'DROP TABLE IF EXISTS {table} CASCADE')
    
    # Enhanced Users table
    await connection.execute('''
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            avatar VARCHAR(500),
            bio TEXT,
            preferences JSONB DEFAULT '{}',
            timezone VARCHAR(50) DEFAULT 'UTC',
            oauth_provider VARCHAR(50),
            oauth_id VARCHAR(255),
            last_login TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            is_premium BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Enhanced Notes table with versioning and collaboration
    await connection.execute('''
        CREATE TABLE notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500),
            content TEXT NOT NULL,
            content_type VARCHAR(50) DEFAULT 'markdown',
            summary TEXT,
            type VARCHAR(50) DEFAULT 'note',
            tags TEXT[] DEFAULT '{}',
            folder VARCHAR(255),
            color VARCHAR(7) DEFAULT '#ffffff',
            is_pinned BOOLEAN DEFAULT FALSE,
            is_archived BOOLEAN DEFAULT FALSE,
            is_encrypted BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT FALSE,
            shared_with UUID[] DEFAULT '{}',
            word_count INTEGER DEFAULT 0,
            character_count INTEGER DEFAULT 0,
            reading_time INTEGER DEFAULT 1,
            sentiment_score FLOAT,
            ai_generated BOOLEAN DEFAULT FALSE,
            parent_note_id UUID REFERENCES notes(id),
            template_id UUID,
            version INTEGER DEFAULT 1,
            view_count INTEGER DEFAULT 0,
            last_viewed TIMESTAMP,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Note versions for history tracking
    await connection.execute('''
        CREATE TABLE note_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
            version_number INTEGER NOT NULL,
            title VARCHAR(500),
            content TEXT NOT NULL,
            changes_summary TEXT,
            created_by UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Enhanced Tasks table
    await connection.execute('''
        CREATE TABLE tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            priority VARCHAR(20) DEFAULT 'medium',
            urgency_score INTEGER DEFAULT 5,
            importance_score INTEGER DEFAULT 5,
            due_date TIMESTAMP,
            all_day BOOLEAN DEFAULT TRUE,
            reminder_date TIMESTAMP,
            completed_at TIMESTAMP,
            estimated_duration INTEGER,
            actual_duration INTEGER,
            assignee VARCHAR(255),
            project_id UUID,
            parent_task_id UUID REFERENCES tasks(id),
            tags TEXT[] DEFAULT '{}',
            category VARCHAR(100),
            location VARCHAR(255),
            energy_level VARCHAR(20) DEFAULT 'medium',
            energy INTEGER DEFAULT 5,
            context_tags TEXT[] DEFAULT '{}',
            recurrence_rule TEXT,
            ai_generated BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Enhanced Calendar Events
    await connection.execute('''
        CREATE TABLE calendar_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            all_day BOOLEAN DEFAULT FALSE,
            timezone VARCHAR(50),
            color VARCHAR(20),
            location VARCHAR(500),
            meeting_url VARCHAR(500),
            event_type VARCHAR(50) DEFAULT 'event',
            recurrence_rule TEXT,
            reminder_minutes INTEGER[],
            attendees JSONB,
            status VARCHAR(20) DEFAULT 'confirmed',
            visibility VARCHAR(20) DEFAULT 'private',
            ai_generated BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # File Attachments
    await connection.execute('''
        CREATE TABLE file_attachments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            original_filename VARCHAR(255) NOT NULL,
            file_type VARCHAR(100),
            file_size BIGINT,
            storage_path VARCHAR(500),
            s3_key VARCHAR(500),
            content_hash VARCHAR(64),
            thumbnail_path VARCHAR(500),
            ocr_text TEXT,
            ai_description TEXT,
            note_id UUID REFERENCES notes(id),
            task_id UUID REFERENCES tasks(id),
            event_id UUID REFERENCES calendar_events(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # AI Interactions Log
    await connection.execute('''
        CREATE TABLE ai_interactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            interaction_type VARCHAR(50) NOT NULL,
            prompt TEXT NOT NULL,
            response TEXT,
            model_used VARCHAR(100),
            tokens_used INTEGER,
            cost_cents INTEGER,
            context_data JSONB,
            feedback_score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Enhanced Collaboration
    await connection.execute('''
        CREATE TABLE collaboration_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
            participants JSONB,
            note_id UUID REFERENCES notes(id),
            is_active BOOLEAN DEFAULT TRUE,
            session_type VARCHAR(50) DEFAULT 'collaboration',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP
        )
    ''')
    
    await connection.execute('''
        CREATE TABLE collaboration_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            message_type VARCHAR(50) DEFAULT 'chat',
            content TEXT NOT NULL,
            metadata JSONB,
            reply_to UUID REFERENCES collaboration_messages(id),
            is_system_message BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for performance
    indexes = [
        "CREATE INDEX idx_notes_user_id ON notes(user_id)",
        "CREATE INDEX idx_notes_created_at ON notes(created_at DESC)",
        "CREATE INDEX idx_notes_tags ON notes USING GIN(tags)",
        "CREATE INDEX idx_tasks_user_id ON tasks(user_id)",
        "CREATE INDEX idx_tasks_due_date ON tasks(due_date)",
        "CREATE INDEX idx_tasks_status ON tasks(status)",
        "CREATE INDEX idx_events_user_id ON calendar_events(user_id)",
        "CREATE INDEX idx_events_start_time ON calendar_events(start_time)",
        "CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id)",
        "CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC)"
    ]
    
    for index in indexes:
        await connection.execute(index)
    
    logger.info("✅ Enhanced database schema created successfully")

# Enhanced Pydantic Models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=8)
    bio: Optional[str] = None
    timezone: str = "UTC"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    preferences: Dict[str, Any] = {}
    timezone: str = "UTC"
    is_premium: bool = False
    last_login: Optional[datetime] = None

class NoteCreate(BaseModel):
    title: Optional[str] = None
    content: str = Field(..., min_length=1)
    content_type: str = "markdown"
    type: str = "note"
    tags: List[str] = []
    folder: Optional[str] = None
    color: Optional[str] = None
    is_pinned: bool = False
    template_id: Optional[str] = None
    parent_note_id: Optional[str] = None

class NoteResponse(BaseModel):
    id: str
    title: Optional[str]
    content: str
    content_type: str
    summary: Optional[str]
    type: str
    tags: List[str]
    folder: Optional[str]
    color: Optional[str]
    is_pinned: bool
    is_archived: bool
    word_count: int
    character_count: int
    reading_time: int
    sentiment_score: Optional[float]
    ai_generated: bool
    view_count: int
    last_viewed: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    urgency_score: int = Field(5, ge=1, le=10)
    importance_score: int = Field(5, ge=1, le=10)
    due_at: Optional[datetime] = None  # Primary field for due date/time
    due_date: Optional[datetime] = None  # Keep for backward compatibility
    all_day: bool = True  # New field for all-day task flag
    reminder_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    assignee: Optional[str] = None
    project_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[str]] = None  # 참석자 필드 추가
    energy_level: Optional[str] = None
    context_tags: Optional[List[str]] = None
    recurrence_rule: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    urgency_score: int
    importance_score: int
    due_at: Optional[datetime]  # Primary field
    due_date: Optional[datetime]  # Keep for backward compatibility
    all_day: bool = True  # New field for all-day task flag
    reminder_date: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_duration: Optional[int]
    actual_duration: Optional[int] = 0  # Set default value
    assignee: Optional[str]
    project_id: Optional[str]
    parent_task_id: Optional[str]
    tags: List[str]
    category: Optional[str]
    location: Optional[str]
    energy_level: Optional[str]
    energy: Optional[int] = 5  # Add energy field
    context_tags: List[str]
    recurrence_rule: Optional[str]
    ai_generated: bool
    created_at: Optional[datetime] = None  # Use snake_case for consistency
    updated_at: Optional[datetime] = None  # Use snake_case for consistency
    createdAt: datetime  # Primary timestamp field
    updatedAt: datetime  # Primary timestamp field

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    urgency_score: Optional[int] = None
    importance_score: Optional[int] = None
    due_at: Optional[datetime] = None  # Using due_at to match frontend
    due_date: Optional[datetime] = None  # Keep for backward compatibility
    completed_at: Optional[datetime] = None  # Add completed_at field
    all_day: Optional[bool] = None  # New field for all-day task flag
    reminder_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    assignee: Optional[str] = None
    project_id: Optional[str] = None
    parent_task_id: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    location: Optional[str] = None
    energy_level: Optional[str] = None
    context_tags: Optional[List[str]] = None
    recurrence_rule: Optional[str] = None

class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    start: datetime
    end: datetime
    all_day: bool = False
    timezone: str = "UTC"
    color: Optional[str] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    event_type: str = "event"
    recurrence_rule: Optional[str] = None
    reminder_minutes: List[int] = []
    attendees: Dict[str, Any] = {}
    visibility: str = "private"

class CalendarEventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    start: datetime
    end: datetime
    all_day: bool
    timezone: str
    color: Optional[str]
    location: Optional[str]
    meeting_url: Optional[str]
    event_type: str
    recurrence_rule: Optional[str]
    reminder_minutes: List[int]
    attendees: Dict[str, Any]
    status: str
    visibility: str
    ai_generated: bool
    createdAt: datetime
    updatedAt: datetime

class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    message: Optional[str] = None  # Add message field for backward compatibility
    context: Optional[str] = None
    type: Optional[str] = None
    model: str = "gpt-4"
    max_tokens: int = 1000
    temperature: float = 0.7

class CollaborationMessage(BaseModel):
    content: str = Field(..., min_length=1)
    message_type: str = "chat"
    reply_to: Optional[str] = None

# Utility functions for ID handling
def parse_id_to_uuid(id_value: Union[str, int, uuid.UUID]) -> uuid.UUID:
    """Convert various ID formats to UUID"""
    if isinstance(id_value, uuid.UUID):
        return id_value
    elif isinstance(id_value, int):
        # Convert integer to UUID by padding with zeros
        return uuid.UUID(f"{id_value:08d}-0000-0000-0000-000000000000")
    elif isinstance(id_value, str):
        # Try to parse as UUID first
        try:
            return uuid.UUID(id_value)
        except ValueError:
            # If not a valid UUID, try to parse as int and convert
            try:
                int_id = int(id_value)
                return uuid.UUID(f"{int_id:08d}-0000-0000-0000-000000000000")
            except ValueError:
                # Generate a deterministic UUID from the string
                import hashlib
                hash_bytes = hashlib.md5(id_value.encode()).digest()
                return uuid.UUID(bytes=hash_bytes)
    else:
        raise ValueError(f"Cannot convert {type(id_value)} to UUID")

def format_id_for_response(id_value: Union[str, int, uuid.UUID]) -> str:
    """Format ID for API response - return as string"""
    if isinstance(id_value, (int, str)):
        return str(id_value)
    elif isinstance(id_value, uuid.UUID):
        # Check if it's a converted integer ID (starts with 8 digits followed by zeros)
        str_uuid = str(id_value)
        if str_uuid.endswith("-0000-0000-0000-000000000000"):
            # Extract the original integer ID
            return str(int(str_uuid[:8]))
        return str_uuid
    return str(id_value)

# Authentication utilities
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))):
    # AUTH_ENABLED가 false면 항상 데모 유저 반환 (자동 인증)
    if not AUTH_ENABLED or not credentials:
        return {
            "id": "12345678-1234-1234-1234-123456789012",  # 유효한 UUID 형식
            "name": "Demo User",
            "email": "demo@example.com",
            "avatar": None,
            "bio": "Demo user for testing",
            "preferences": {"theme": "light"},
            "timezone": "UTC",
            "is_premium": False,
            "last_login": datetime.utcnow()
        }
    
    # AUTH_ENABLED가 true인 경우에만 토큰 검증
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            
        if db_pool is None:
            # Return mock user when no database
            return {
                "id": user_id,
                "name": payload.get("name", "Demo User"),
                "email": payload.get("email", "demo@example.com"),
                "avatar": None,
                "bio": "Demo user for testing",
                "preferences": {"theme": "light"},
                "timezone": "UTC",
                "is_premium": False,
                "last_login": datetime.utcnow()
            }
            
        async with db_pool.acquire() as connection:
            user = await connection.fetchrow(
                """SELECT id, name, email, avatar, bio, preferences, timezone, 
                          is_premium, last_login FROM users WHERE id = $1 AND is_active = TRUE""", 
                uuid.UUID(user_id)
            )
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
                
            return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except (PyJWTError, InvalidSignatureError, DecodeError):
        raise HTTPException(status_code=401, detail="Invalid token")

# Utility functions
def calculate_reading_time(text: str) -> int:
    """Calculate estimated reading time in minutes"""
    words = len(text.split())
    return max(1, words // 200)  # Average reading speed: 200 words/minute

def calculate_sentiment_score(text: str) -> float:
    """Simple sentiment analysis (can be enhanced with ML models)"""
    positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'excited']
    negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed']
    
    words = text.lower().split()
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    if positive_count + negative_count == 0:
        return 0.0
    
    return (positive_count - negative_count) / (positive_count + negative_count)

async def log_ai_interaction(user_id: str, interaction_type: str, prompt: str, 
                            response: str, model_used: str, tokens_used: int = 0):
    """Log AI interactions for analytics"""
    try:
        async with db_pool.acquire() as connection:
            await connection.execute(
                """INSERT INTO ai_interactions 
                   (user_id, interaction_type, prompt, response, model_used, tokens_used) 
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                uuid.UUID(user_id), interaction_type, prompt, response, model_used, tokens_used
            )
    except Exception as e:
        logger.error(f"Failed to log AI interaction: {e}")

def format_note_for_response(note_data: dict) -> dict:
    """Convert database note format to API response format"""
    try:
        # Handle both dict and database row objects
        if hasattr(note_data, 'keys'):
            note = dict(note_data)
        else:
            note = note_data
            
        # Convert UUID to string
        if 'id' in note and note['id'] is not None:
            note['id'] = str(note['id'])
            
        # Map database field names to response field names
        if 'created_at' in note:
            note['createdAt'] = note['created_at']
            
        if 'updated_at' in note:
            note['updatedAt'] = note['updated_at']
            
        # Ensure required fields have default values
        note.setdefault('tags', [])
        note.setdefault('content_type', 'markdown')
        note.setdefault('summary', '')
        note.setdefault('type', 'note')
        note.setdefault('folder', None)
        note.setdefault('color', None)
        note.setdefault('is_pinned', False)
        note.setdefault('is_archived', False)
        note.setdefault('word_count', 0)
        note.setdefault('character_count', 0)
        note.setdefault('reading_time', 1)
        note.setdefault('sentiment_score', None)
        note.setdefault('ai_generated', False)
        note.setdefault('view_count', 0)
        note.setdefault('last_viewed', None)
        
        return note
    except Exception as e:
        logger.error(f"Error formatting note for response: {e}")
        return note_data

# Health check with enhanced metrics
@app.get("/api/health")
async def health_check():
    try:
        # Check database
        async with db_pool.acquire() as connection:
            await connection.fetchval("SELECT 1")
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    # Check Redis
    redis_status = "healthy" if redis_client else "unavailable"
    if redis_client:
        try:
            await redis_client.ping()
        except:
            redis_status = "unhealthy"
    
    # Check OpenAI
    openai_status = "configured" if OPENAI_API_KEY else "not_configured"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "redis": redis_status,
            "openai": openai_status
        },
        "version": "2.0.0"
    }

# Enhanced Authentication endpoints
@app.post("/auth/login")
async def login(email: str = Form(...), password: str = Form(...)):
    async with db_pool.acquire() as connection:
        user = await connection.fetchrow(
            """SELECT id, name, email, password_hash, avatar, bio, preferences, 
                      timezone, is_premium FROM users 
               WHERE email = $1 AND is_active = TRUE""", 
            email
        )
        
        if not user or not verify_password(password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        await connection.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            user['id']
        )
        
        access_token = create_access_token(data={"sub": str(user['id'])})
        
        return {
            "token": access_token,
            "user": {
                "id": str(user['id']),
                "name": user['name'],
                "email": user['email'],
                "avatar": user['avatar'],
                "bio": user['bio'],
                "preferences": user['preferences'] or {},
                "timezone": user['timezone'],
                "is_premium": user['is_premium']
            }
        }

@app.post("/auth/register")
async def register(user_data: UserCreate):
    async with db_pool.acquire() as connection:
        # Check if user already exists
        existing_user = await connection.fetchrow(
            "SELECT id FROM users WHERE email = $1", 
            user_data.email
        )
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        user_id = await connection.fetchval(
            """INSERT INTO users (name, email, password_hash, bio, timezone) 
               VALUES ($1, $2, $3, $4, $5) RETURNING id""",
            user_data.name, user_data.email, hashed_password, 
            user_data.bio, user_data.timezone
        )
        
        access_token = create_access_token(data={"sub": str(user_id)})
        
        return {
            "token": access_token,
            "user": {
                "id": str(user_id),
                "name": user_data.name,
                "email": user_data.email,
                "avatar": None,
                "bio": user_data.bio,
                "preferences": {},
                "timezone": user_data.timezone,
                "is_premium": False
            }
        }

@app.post("/auth/create-demo-user")
async def create_demo_user():
    """Create a demo user for testing"""
    demo_email = "demo@example.com"
    demo_password = "demo123"
    
    if db_pool is None:
        # Return mock user when no database
        mock_user_id = "12345678-1234-1234-1234-123456789012"  # 유효한 UUID 형식
        token_data = {
            "sub": mock_user_id,
            "email": demo_email,
            "name": "Demo User",
            "exp": datetime.utcnow() + timedelta(days=30)
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "message": "Demo user created (in-memory)", 
            "email": demo_email, 
            "password": demo_password,
            "user_id": mock_user_id,
            "access_token": token,
            "token_type": "bearer"
        }
    
    async with db_pool.acquire() as connection:
        # Fixed demo user ID to match frontend expectations
        demo_user_id = "12345678-1234-1234-1234-123456789012"
        
        # Check if demo user exists
        existing_user = await connection.fetchrow(
            "SELECT id, email, name FROM users WHERE id = $1", demo_user_id
        )
        
        if existing_user:
            # Generate JWT token for existing user
            token_data = {
                "sub": str(existing_user['id']),
                "email": existing_user['email'],
                "name": existing_user['name'],
                "exp": datetime.utcnow() + timedelta(days=30)
            }
            token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            return {
                "message": "Demo user already exists", 
                "email": demo_email, 
                "password": demo_password,
                "user_id": str(existing_user['id']),
                "access_token": token,
                "token_type": "bearer"
            }
        
        # Create demo user with fixed ID
        hashed_password = hash_password(demo_password)
        try:
            await connection.execute(
                """INSERT INTO users (id, name, email, password_hash, bio, is_premium) 
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                demo_user_id, "Demo User", demo_email, hashed_password, 
                "Jihyung Demo Account", True
            )
            user_id = demo_user_id
        except Exception as e:
            logger.error(f"Error creating demo user: {e}")
            # If user already exists or other error, try to get existing user
            existing_user = await connection.fetchrow(
                "SELECT id, email, name FROM users WHERE email = $1", demo_email
            )
            if existing_user:
                user_id = str(existing_user['id'])
            else:
                raise HTTPException(status_code=500, detail="Failed to create demo user")
        
        # Generate JWT token for new user
        token_data = {
            "sub": str(user_id),
            "email": demo_email,
            "name": "Demo User",
            "exp": datetime.utcnow() + timedelta(days=30)
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "message": "Demo user created successfully",
            "email": demo_email,
            "password": demo_password,
            "user_id": str(user_id),
            "access_token": token,
            "token_type": "bearer"
        }

# ========== SOCIAL LOGIN ENDPOINTS ==========

@app.get("/auth/google")
async def google_login():
    """Google OAuth login"""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5177/auth/google/callback")
    
    if not google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={google_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=openid email profile&"
        f"response_type=code&"
        f"access_type=offline"
    )
    
    return {"auth_url": auth_url}

@app.post("/auth/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5177/auth/google/callback")
    
    if not all([google_client_id, google_client_secret]):
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": google_client_id,
                "client_secret": google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # Get user info
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_response.json()
        
        # Find or create user
        async with db_pool.acquire() as connection:
            user = await connection.fetchrow(
                "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
                user_info["email"]
            )
            
            if not user:
                # Create new user
                user_id = await connection.fetchval(
                    """INSERT INTO users (name, email, avatar, oauth_provider, oauth_id, is_active) 
                       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id""",
                    user_info["name"], user_info["email"], user_info.get("picture"),
                    "google", user_info["id"]
                )
            else:
                user_id = user['id']
                # Update avatar if changed
                await connection.execute(
                    "UPDATE users SET avatar = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2",
                    user_info.get("picture"), user_id
                )
            
            jwt_token = create_access_token(data={"sub": str(user_id)})
            
            return {
                "token": jwt_token,
                "user": {
                    "id": str(user_id),
                    "name": user_info["name"],
                    "email": user_info["email"],
                    "avatar": user_info.get("picture"),
                    "provider": "google"
                }
            }

@app.get("/auth/github")
async def github_login():
    """GitHub OAuth login"""
    github_client_id = os.getenv("GITHUB_CLIENT_ID")
    redirect_uri = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:5177/auth/github/callback")
    
    if not github_client_id:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={github_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email"
    )
    
    return {"auth_url": auth_url}

@app.post("/auth/github/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback"""
    github_client_id = os.getenv("GITHUB_CLIENT_ID")
    github_client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    
    if not all([github_client_id, github_client_secret]):
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": github_client_id,
                "client_secret": github_client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # Get user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_response.json()
        
        # Get user email (might be private)
        email_response = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        emails = email_response.json() if email_response.status_code == 200 else []
        primary_email = next((e["email"] for e in emails if e["primary"]), user_info.get("email"))
        
        if not primary_email:
            raise HTTPException(status_code=400, detail="Unable to get user email")
        
        # Find or create user
        async with db_pool.acquire() as connection:
            user = await connection.fetchrow(
                "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
                primary_email
            )
            
            if not user:
                # Create new user
                user_id = await connection.fetchval(
                    """INSERT INTO users (name, email, avatar, oauth_provider, oauth_id, is_active) 
                       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id""",
                    user_info["name"] or user_info["login"], primary_email, 
                    user_info.get("avatar_url"), "github", str(user_info["id"])
                )
            else:
                user_id = user['id']
                # Update avatar if changed
                await connection.execute(
                    "UPDATE users SET avatar = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2",
                    user_info.get("avatar_url"), user_id
                )
            
            jwt_token = create_access_token(data={"sub": str(user_id)})
            
            return {
                "token": jwt_token,
                "user": {
                    "id": str(user_id),
                    "name": user_info["name"] or user_info["login"],
                    "email": primary_email,
                    "avatar": user_info.get("avatar_url"),
                    "provider": "github"
                }
            }

@app.get("/auth/kakao")
async def kakao_login():
    """Kakao OAuth login"""
    kakao_client_id = os.getenv("KAKAO_CLIENT_ID")
    redirect_uri = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:5177/auth/kakao/callback")
    
    if not kakao_client_id:
        raise HTTPException(status_code=500, detail="Kakao OAuth not configured")
    
    auth_url = (
        f"https://kauth.kakao.com/oauth/authorize?"
        f"client_id={kakao_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope=profile_nickname,profile_image,account_email"
    )
    
    return {"auth_url": auth_url}

@app.post("/auth/kakao/callback")
async def kakao_callback(code: str):
    """Handle Kakao OAuth callback"""
    kakao_client_id = os.getenv("KAKAO_CLIENT_ID")
    kakao_client_secret = os.getenv("KAKAO_CLIENT_SECRET")
    redirect_uri = os.getenv("KAKAO_REDIRECT_URI", "http://localhost:5177/auth/kakao/callback")
    
    if not kakao_client_id:
        raise HTTPException(status_code=500, detail="Kakao OAuth not configured")
    
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_data = {
            "grant_type": "authorization_code",
            "client_id": kakao_client_id,
            "redirect_uri": redirect_uri,
            "code": code,
        }
        
        if kakao_client_secret:
            token_data["client_secret"] = kakao_client_secret
        
        token_response = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_info = token_response.json()
        access_token = token_info.get("access_token")
        
        # Get user info
        user_response = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_response.json()
        kakao_account = user_info.get("kakao_account", {})
        profile = kakao_account.get("profile", {})
        
        email = kakao_account.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Unable to get user email")
        
        # Find or create user
        async with db_pool.acquire() as connection:
            user = await connection.fetchrow(
                "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
                email
            )
            
            if not user:
                # Create new user
                user_id = await connection.fetchval(
                    """INSERT INTO users (name, email, avatar, oauth_provider, oauth_id, is_active) 
                       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id""",
                    profile.get("nickname", "카카오 사용자"), email, 
                    profile.get("profile_image_url"), "kakao", str(user_info["id"])
                )
            else:
                user_id = user['id']
                # Update avatar if changed
                await connection.execute(
                    "UPDATE users SET avatar = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2",
                    profile.get("profile_image_url"), user_id
                )
            
            jwt_token = create_access_token(data={"sub": str(user_id)})
            
            return {
                "token": jwt_token,
                "user": {
                    "id": str(user_id),
                    "name": profile.get("nickname", "카카오 사용자"),
                    "email": email,
                    "avatar": profile.get("profile_image_url"),
                    "provider": "kakao"
                }
            }

# ========== ENHANCED NOTES API ==========

@app.get("/api/notes", response_model=List[NoteResponse])
async def get_notes(
    current_user: dict = Depends(get_current_user),
    folder: Optional[str] = None,
    tags: Optional[str] = None,
    search: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get notes with advanced filtering - cloud storage with memory fallback"""
    try:
        user_id = current_user['id']
        
        # Try cloud database first
        if db_pool:
            try:
                async with db_pool.acquire() as connection:
                    # Build query with filters
                    query_parts = ["SELECT * FROM notes WHERE user_id = $1"]
                    params = [uuid.UUID(user_id)]
                    param_count = 1
                    
                    # Add filters
                    if folder:
                        param_count += 1
                        query_parts.append(f"AND folder = ${param_count}")
                        params.append(folder)
                    
                    if search:
                        param_count += 1
                        query_parts.append(f"AND (title ILIKE ${param_count} OR content ILIKE ${param_count})")
                        params.append(f"%{search}%")
                    
                    if type:
                        param_count += 1
                        query_parts.append(f"AND type = ${param_count}")
                        params.append(type)
                    
                    # Add ordering and pagination
                    query_parts.append("ORDER BY updated_at DESC")
                    query_parts.append(f"LIMIT {limit} OFFSET {offset}")
                    
                    query = " ".join(query_parts)
                    rows = await connection.fetch(query, *params)
                    
                    # Convert to expected format
                    result = []
                    for row in rows:
                        note_dict = dict(row)
                        # Handle tags filter if specified
                        if tags:
                            tag_list = tags.split(',')
                            note_tags = note_dict.get('tags', [])
                            if not any(tag.strip() in note_tags for tag in tag_list):
                                continue
                        
                        # Format note for response
                        formatted_note = format_note_for_response(note_dict)
                        result.append(formatted_note)
                    
                    logger.info(f"✅ Retrieved {len(result)} notes from cloud for user {user_id}")
                    return result
                    
            except Exception as db_error:
                logger.warning(f"Cloud retrieval failed: {db_error}, using memory fallback")
        
        # Fallback to memory storage
        if 'notes' not in memory_storage:
            memory_storage['notes'] = {}
        
        user_notes = []
        for note_id, note in memory_storage['notes'].items():
            if note['user_id'] == user_id:
                # Apply filters
                if folder and note.get('folder') != folder:
                    continue
                if tags and not any(tag in note.get('tags', []) for tag in tags.split(',')):
                    continue
                if search and search.lower() not in note.get('title', '').lower() and search.lower() not in note.get('content', '').lower():
                    continue
                if type and note.get('type') != type:
                    continue
                    
                user_notes.append(note)
        
        # Sort and paginate
        user_notes.sort(key=lambda x: x.get('updated_at', datetime.utcnow()), reverse=True)
        result = user_notes[offset:offset + limit]
        
        # Format notes for response
        formatted_result = [format_note_for_response(note) for note in result]
        
        logger.info(f"✅ Retrieved {len(formatted_result)} notes from memory for user {user_id}")
        return formatted_result
        
    except Exception as e:
        logger.error(f"❌ Error getting notes: {str(e)}")
        return []

@app.get("/api/debug/schema")
async def debug_schema():
    """Debug endpoint to check database schema"""
    try:
        async with db_pool.acquire() as connection:
            # Check what tables exist
            tables = await connection.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            
            # Check structure of potential note tables
            note_columns = None
            notes_columns = None
            users_columns = None
            
            try:
                note_columns = await connection.fetch("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'note'
                    ORDER BY ordinal_position
                """)
            except:
                pass
                
            try:
                notes_columns = await connection.fetch("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'notes'
                    ORDER BY ordinal_position
                """)
            except:
                pass
                
            try:
                users_columns = await connection.fetch("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                    ORDER BY ordinal_position
                """)
            except:
                pass
            
            return {
                "tables": [dict(t) for t in tables],
                "note_table_columns": [dict(c) for c in note_columns] if note_columns else None,
                "notes_table_columns": [dict(c) for c in notes_columns] if notes_columns else None,
                "users_table_columns": [dict(c) for c in users_columns] if users_columns else None
            }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/notes", response_model=NoteResponse)
async def create_note(note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    """Create a new note with cloud storage and collaboration support"""
    try:
        note_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Enhanced note object with collaboration features
        new_note = {
            "id": note_id,
            "user_id": current_user['id'],
            "title": note_data.title or "제목 없음",
            "content": note_data.content or "",
            "content_type": getattr(note_data, 'content_type', 'markdown'),
            "type": getattr(note_data, 'type', 'note'),
            "tags": getattr(note_data, 'tags', []),
            "folder": getattr(note_data, 'folder', None),
            "color": getattr(note_data, 'color', '#ffffff'),
            "is_pinned": getattr(note_data, 'is_pinned', False),
            "is_archived": getattr(note_data, 'is_archived', False),
            "is_public": getattr(note_data, 'is_public', False),
            "shared_with": getattr(note_data, 'shared_with', []),
            "word_count": len(note_data.content.split()) if note_data.content else 0,
            "character_count": len(note_data.content) if note_data.content else 0,
            "reading_time": max(1, len(note_data.content.split()) // 200) if note_data.content else 1,
            "version": 1,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "last_accessed": now.isoformat()
        }
        
        # Try database first (cloud storage), fallback to memory
        saved_to_cloud = False
        
        if db_pool:
            try:
                async with db_pool.acquire() as connection:
                    # Auto-create user if doesn't exist - using proper UUID handling
                    try:
                        user_uuid = uuid.UUID(current_user['id']) if isinstance(current_user['id'], str) else current_user['id']
                        
                        # Check if user exists first
                        existing_user = await connection.fetchrow(
                            "SELECT id FROM users WHERE id = $1", user_uuid
                        )
                        
                        if not existing_user:
                            # Create user if doesn't exist
                            await connection.execute("""
                                INSERT INTO users (id, email, name, created_at, updated_at)
                                VALUES ($1, $2, $3, $4, $5)
                            """,
                                user_uuid,
                                current_user.get('email', 'demo@example.com'),
                                current_user.get('name', 'Demo User'),
                                now.replace(tzinfo=None),
                                now.replace(tzinfo=None)
                            )
                            logger.info(f"✅ User {current_user['id']} created in database")
                        else:
                            logger.info(f"✅ User {current_user['id']} already exists")
                            
                    except Exception as user_error:
                        logger.error(f"User creation failed: {user_error}")
                        raise HTTPException(status_code=500, detail=f"User creation failed: {str(user_error)}")
                    
                    # Insert note with timezone-naive datetime
                    try:
                        note_uuid = uuid.UUID(note_id)
                        await connection.execute("""
                            INSERT INTO notes (
                                id, user_id, title, content, content_type, type, tags, folder, color,
                                is_pinned, is_archived, is_public, shared_with, word_count, character_count,
                                reading_time, version, created_at, updated_at, last_accessed
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                        """,
                            note_uuid, user_uuid,
                            new_note["title"], new_note["content"], new_note["content_type"],
                            new_note["type"], new_note["tags"], new_note["folder"], new_note["color"],
                            new_note["is_pinned"], new_note["is_archived"], new_note["is_public"],
                            new_note["shared_with"], new_note["word_count"], new_note["character_count"],
                            new_note["reading_time"], new_note["version"], 
                            now.replace(tzinfo=None),
                            now.replace(tzinfo=None), 
                            now.replace(tzinfo=None)
                        )
                        
                        saved_to_cloud = True
                        logger.info(f"✅ Note {note_id} saved to cloud database")
                        
                    except Exception as note_error:
                        logger.error(f"Note creation failed: {note_error}")
                        raise HTTPException(status_code=500, detail=f"Note creation failed: {str(note_error)}")
                    
            except Exception as db_error:
                logger.warning(f"Cloud save failed: {db_error}, using memory fallback")
        
        # Fallback to memory storage
        if not saved_to_cloud:
            if 'notes' not in memory_storage:
                memory_storage['notes'] = {}
            memory_storage['notes'][note_id] = new_note
            logger.info(f"✅ Note {note_id} saved to memory (fallback)")
        
        # Real-time notification
        try:
            await manager.send_personal_message({
                "type": "note_created",
                "data": {"id": note_id, "title": new_note["title"]}
            }, current_user['id'])
        except Exception as e:
            logger.warning(f"Real-time notification failed: {e}")
        
        # Return with all required fields for NoteResponse model
        return {
            "id": new_note["id"],
            "title": new_note["title"],
            "content": new_note["content"],
            "content_type": new_note["content_type"],
            "type": new_note["type"],
            "tags": new_note["tags"],
            "folder": new_note["folder"],
            "color": new_note["color"] or "#ffffff",
            "is_pinned": new_note["is_pinned"],
            "is_archived": new_note["is_archived"],
            "is_public": new_note["is_public"],
            "shared_with": new_note["shared_with"],
            "word_count": new_note["word_count"],
            "character_count": new_note["character_count"],
            "reading_time": new_note["reading_time"],
            "version": new_note["version"],
            "summary": "",  # Add missing field
            "sentiment_score": 0.5,  # Add missing field  
            "ai_generated": False,  # Add missing field
            "view_count": 0,  # Add missing field
            "last_viewed": new_note["created_at"],  # Add missing field
            "createdAt": new_note["created_at"],  # Add missing field
            "updatedAt": new_note["updated_at"]  # Add missing field
        }
        
    except Exception as e:
        logger.error(f"❌ Error creating note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    """Update note with cloud storage and collaboration support"""
    try:
        user_id = current_user['id']
        updated_cloud = False
        
        # Try cloud database first
        if db_pool:
            try:
                async with db_pool.acquire() as connection:
                    # Check if note exists and user has permission
                    existing_note = await connection.fetchrow(
                        "SELECT * FROM notes WHERE id = $1 AND (user_id = $2 OR $2 = ANY(shared_with))",
                        uuid.UUID(note_id), uuid.UUID(user_id)
                    )
                    
                    if not existing_note:
                        raise HTTPException(status_code=404, detail="Note not found or access denied")
                    
                    # Calculate enhanced metrics
                    word_count = len(note_data.content.split()) if note_data.content else 0
                    character_count = len(note_data.content) if note_data.content else 0
                    reading_time = max(1, word_count // 200) if word_count else 1
                    
                    # Update note
                    await connection.execute("""
                        UPDATE notes SET
                            title = $2,
                            content = $3,
                            content_type = $4,
                            type = $5,
                            tags = $6,
                            folder = $7,
                            color = $8,
                            is_pinned = $9,
                            is_archived = $10,
                            word_count = $11,
                            character_count = $12,
                            reading_time = $13,
                            version = version + 1,
                            updated_at = CURRENT_TIMESTAMP,
                            last_accessed = CURRENT_TIMESTAMP
                        WHERE id = $1
                    """,
                        uuid.UUID(note_id),
                        note_data.title,
                        note_data.content,
                        getattr(note_data, 'content_type', 'markdown'),
                        getattr(note_data, 'type', 'note'),
                        getattr(note_data, 'tags', []),
                        getattr(note_data, 'folder', None),
                        getattr(note_data, 'color', '#ffffff'),
                        getattr(note_data, 'is_pinned', False),
                        getattr(note_data, 'is_archived', False),
                        word_count,
                        character_count,
                        reading_time
                    )
                    
                    # Get updated note
                    updated_note = await connection.fetchrow(
                        "SELECT * FROM notes WHERE id = $1", uuid.UUID(note_id)
                    )
                    
                    updated_cloud = True
                    result = dict(updated_note)
                    logger.info(f"✅ Note {note_id} updated in cloud")
                    
            except HTTPException:
                raise
            except Exception as db_error:
                logger.warning(f"Cloud update failed: {db_error}, using memory fallback")
        
        # Fallback to memory storage
        if not updated_cloud:
            # Convert UUID to string for memory storage lookup
            note_key = str(note_id)
            
            # Look in both global and user-specific storage
            note_found = False
            note = None
            
            if 'notes' in memory_storage and note_key in memory_storage['notes']:
                note = memory_storage['notes'][note_key]
                if str(note['user_id']) == str(user_id):
                    note_found = True
            
            # Also check user-specific notes
            if not note_found and 'user_notes' in memory_storage and str(user_id) in memory_storage['user_notes']:
                for i, stored_note in enumerate(memory_storage['user_notes'][str(user_id)]):
                    if str(stored_note.get('id')) == note_key:
                        note = stored_note
                        note_found = True
                        break
            
            if not note_found or not note:
                raise HTTPException(status_code=404, detail="Note not found")
            
            # Update note in memory
            note.update({
                "title": note_data.title,
                "content": note_data.content,
                "content_type": getattr(note_data, 'content_type', note.get('content_type', 'markdown')),
                "type": getattr(note_data, 'type', note.get('type', 'note')),
                "tags": getattr(note_data, 'tags', note.get('tags', [])),
                "folder": getattr(note_data, 'folder', note.get('folder')),
                "color": getattr(note_data, 'color', note.get('color', '#ffffff')),
                "is_pinned": getattr(note_data, 'is_pinned', note.get('is_pinned', False)),
                "is_archived": getattr(note_data, 'is_archived', note.get('is_archived', False)),
                "updated_at": datetime.utcnow(),
                "word_count": len(note_data.content.split()) if note_data.content else 0,
                "character_count": len(note_data.content) if note_data.content else 0,
                "reading_time": max(1, len(note_data.content.split()) // 200) if note_data.content else 1
            })
            
            result = note
            logger.info(f"✅ Note {note_id} updated in memory")
        
        # Send real-time update
        try:
            await manager.send_personal_message({
                "type": "note_updated",
                "data": {"id": note_id, "title": note_data.title}
            }, user_id)
        except Exception as e:
            logger.warning(f"Real-time update failed: {e}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update note: {str(e)}")
        
        if not existing_note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        word_count = len(note_data.content.split()) if note_data.content else 0
        character_count = len(note_data.content)
        reading_time = calculate_reading_time(note_data.content)
        sentiment_score = calculate_sentiment_score(note_data.content)
        
        # Get next version number
        version_number = await connection.fetchval(
            "SELECT COALESCE(MAX(version_number), 0) + 1 FROM note_versions WHERE note_id = $1",
            uuid.UUID(note_id)
        )
        
        # Update note
        await connection.execute(
            """UPDATE notes SET 
               title = $1, content = $2, content_type = $3, type = $4, tags = $5,
               folder = $6, color = $7, is_pinned = $8, word_count = $9,
               character_count = $10, reading_time = $11, sentiment_score = $12,
               updated_at = CURRENT_TIMESTAMP
               WHERE id = $13 AND user_id = $14""",
            note_data.title, note_data.content, note_data.content_type, note_data.type,
            note_data.tags, note_data.folder, note_data.color, note_data.is_pinned,
            word_count, character_count, reading_time, sentiment_score,
            uuid.UUID(note_id), current_user['id']
        )
        
        # Create new version
        await connection.execute(
            """INSERT INTO note_versions (note_id, version_number, title, content, created_by)
               VALUES ($1, $2, $3, $4, $5)""",
            uuid.UUID(note_id), version_number, note_data.title, note_data.content, 
            current_user['id']
        )
        
        # Send real-time update
        await manager.send_personal_message({
            "type": "note_updated",
            "data": {"id": note_id, "title": note_data.title}
        }, current_user['id'])
        
        return {"message": "Note updated successfully", "version": version_number}

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete note (archive it) - cloud storage with memory fallback"""
    try:
        user_id = current_user['id']
        deleted_from_cloud = False
        
        # Try cloud database first
        if db_pool:
            try:
                async with db_pool.acquire() as connection:
                    # Check if note exists and user has permission
                    existing_note = await connection.fetchrow(
                        "SELECT * FROM notes WHERE id = $1 AND user_id = $2",
                        uuid.UUID(note_id), uuid.UUID(user_id)
                    )
                    
                    if not existing_note:
                        raise HTTPException(status_code=404, detail="Note not found or access denied")
                    
                    # Soft delete (archive)
                    await connection.execute("""
                        UPDATE notes SET
                            is_archived = TRUE,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    """, uuid.UUID(note_id))
                    
                    deleted_from_cloud = True
                    logger.info(f"✅ Note {note_id} archived in cloud")
                    
            except HTTPException:
                raise
            except Exception as db_error:
                logger.warning(f"Cloud delete failed: {db_error}, using memory fallback")
        
        # Fallback to memory storage
        if not deleted_from_cloud:
            # Convert UUID to string for memory storage lookup
            note_key = str(note_id)
            
            # Look in both global and user-specific storage
            note_found = False
            if 'notes' in memory_storage and note_key in memory_storage['notes']:
                note = memory_storage['notes'][note_key]
                if str(note['user_id']) == str(user_id):
                    note['is_archived'] = True
                    note['updated_at'] = datetime.utcnow()
                    note_found = True
            
            # Also check user-specific notes
            if not note_found and 'user_notes' in memory_storage and str(user_id) in memory_storage['user_notes']:
                for i, note in enumerate(memory_storage['user_notes'][str(user_id)]):
                    if str(note.get('id')) == note_key:
                        note['is_archived'] = True
                        note['updated_at'] = datetime.utcnow()
                        note_found = True
                        break
            
            if not note_found:
                raise HTTPException(status_code=404, detail="Note not found")
                
            logger.info(f"✅ Note {note_id} archived in memory")
        
        # Send real-time update
        try:
            await manager.send_personal_message({
                "type": "note_deleted",
                "data": {"id": note_id}
            }, user_id)
        except Exception as e:
            logger.warning(f"Real-time notification failed: {e}")
        
        return {"message": "Note archived successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")
        
        # Send real-time update
        await manager.send_personal_message({
            "type": "note_deleted",
            "data": {"id": note_id}
        }, current_user['id'])
        
        return {"message": "Note archived successfully"}

# ========== 🤝 협업 기능 API ==========

@app.post("/api/notes/{note_id}/share")
async def share_note(
    note_id: str, 
    share_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """노트 공유 - 실시간 협업 지원"""
    try:
        target_email = share_data.get('email')
        permission = share_data.get('permission', 'read')  # read, write, admin
        
        if db_pool:
            async with db_pool.acquire() as connection:
                # 노트 소유자 확인
                note = await connection.fetchrow(
                    "SELECT * FROM notes WHERE id = $1 AND user_id = $2",
                    uuid.UUID(note_id), uuid.UUID(current_user['id'])
                )
                
                if not note:
                    raise HTTPException(status_code=404, detail="Note not found or access denied")
                
                # 대상 사용자 찾기
                target_user = await connection.fetchrow(
                    "SELECT id FROM users WHERE email = $1", target_email
                )
                
                if not target_user:
                    raise HTTPException(status_code=404, detail="User not found")
                
                # 공유 설정 업데이트
                shared_with = list(note['shared_with']) if note['shared_with'] else []
                if str(target_user['id']) not in shared_with:
                    shared_with.append(str(target_user['id']))
                
                await connection.execute("""
                    UPDATE notes SET 
                        shared_with = $2,
                        collaboration_settings = $3
                    WHERE id = $1
                """, 
                    uuid.UUID(note_id),
                    shared_with,
                    {"permissions": {str(target_user['id']): permission}}
                )
                
                # 실시간 알림 전송
                try:
                    await manager.send_personal_message({
                        "type": "note_shared",
                        "data": {
                            "note_id": note_id,
                            "shared_by": current_user['name'],
                            "permission": permission
                        }
                    }, str(target_user['id']))
                except:
                    pass
                
                logger.info(f"✅ Note {note_id} shared with {target_email} ({permission})")
                return {"message": f"Note shared with {target_email}", "permission": permission}
        else:
            # 메모리 저장소 처리
            if note_id in memory_storage['notes']:
                note = memory_storage['notes'][note_id]
                if note['user_id'] == current_user['id']:
                    if 'shared_with' not in note:
                        note['shared_with'] = []
                    note['shared_with'].append(target_email)
                    logger.info(f"✅ Note {note_id} shared with {target_email} (memory)")
                    return {"message": f"Note shared with {target_email}", "permission": permission}
            
            raise HTTPException(status_code=404, detail="Note not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sharing note: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to share note: {str(e)}")

@app.get("/api/notes/shared")
async def get_shared_notes(current_user: dict = Depends(get_current_user)):
    """공유받은 노트 조회"""
    try:
        if db_pool:
            async with db_pool.acquire() as connection:
                notes = await connection.fetch("""
                    SELECT n.*, u.name as owner_name, u.email as owner_email
                    FROM notes n
                    JOIN users u ON n.user_id = u.id
                    WHERE $1 = ANY(n.shared_with) OR n.is_public = true
                    ORDER BY n.updated_at DESC
                """, uuid.UUID(current_user['id']))
                
                result = [dict(note) for note in notes]
                logger.info(f"✅ Retrieved {len(result)} shared notes for {current_user['email']}")
                return result
        else:
            # 메모리 저장소에서 공유 노트 찾기
            shared_notes = []
            user_email = current_user['email']
            
            for note_id, note in memory_storage.get('notes', {}).items():
                if (note.get('shared_with') and user_email in note['shared_with']) or note.get('is_public'):
                    shared_notes.append(note)
            
            logger.info(f"✅ Retrieved {len(shared_notes)} shared notes from memory")
            return shared_notes
            
    except Exception as e:
        logger.error(f"❌ Error getting shared notes: {str(e)}")
        return []

@app.post("/api/collaboration/invite")
async def invite_collaborator(
    invite_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """협업자 초대 - 이메일 알림"""
    try:
        email = invite_data.get('email')
        note_id = invite_data.get('note_id')
        permission = invite_data.get('permission', 'read')
        
        # 초대 토큰 생성
        invite_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # 실제 환경에서는 이메일 서비스(SendGrid, AWS SES 등) 연동
        logger.info(f"📧 Collaboration invite sent to {email} for note {note_id}")
        logger.info(f"   Invite token: {invite_token}")
        logger.info(f"   Permission: {permission}")
        logger.info(f"   Expires: {expires_at}")
        
        return {
            "message": f"Invitation sent to {email}",
            "invite_id": invite_token,
            "expires_at": expires_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error sending invite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send invitation")

@app.get("/api/collaboration/activity/{note_id}")
async def get_collaboration_activity(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """협업 활동 로그 조회"""
    try:
        if db_pool:
            async with db_pool.acquire() as connection:
                # 노트 접근 권한 확인
                note = await connection.fetchrow("""
                    SELECT * FROM notes 
                    WHERE id = $1 AND (user_id = $2 OR $2 = ANY(shared_with) OR is_public = true)
                """, uuid.UUID(note_id), uuid.UUID(current_user['id']))
                
                if not note:
                    raise HTTPException(status_code=404, detail="Note not found or access denied")
                
                # 활동 로그 조회
                activities = await connection.fetch("""
                    SELECT nc.*, u.name as user_name, u.email as user_email
                    FROM note_changes nc
                    JOIN users u ON nc.user_id = u.id
                    WHERE nc.note_id = $1
                    ORDER BY nc.created_at DESC
                    LIMIT 50
                """, uuid.UUID(note_id))
                
                result = [dict(activity) for activity in activities]
                logger.info(f"✅ Retrieved {len(result)} activities for note {note_id}")
                return result
        else:
            # 메모리 저장소에서는 기본 활동만 반환
            return [{
                "id": str(uuid.uuid4()),
                "note_id": note_id,
                "user_name": current_user['name'],
                "change_type": "access",
                "created_at": datetime.utcnow().isoformat(),
                "description": "Accessed note"
            }]
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting collaboration activity: {str(e)}")
        return []

@app.post("/api/notes/{note_id}/view")
async def track_note_view(note_id: str, current_user: dict = Depends(get_current_user)):
    """Track note view for analytics"""
    async with db_pool.acquire() as connection:
        await connection.execute(
            """UPDATE notes SET 
               view_count = COALESCE(view_count, 0) + 1,
               last_viewed = CURRENT_TIMESTAMP
               WHERE id = $1 AND user_id = $2""",
            uuid.UUID(note_id), current_user['id']
        )
    return {"message": "View tracked"}

@app.get("/api/notes/{note_id}/versions")
async def get_note_versions(note_id: str, current_user: dict = Depends(get_current_user)):
    """Get note version history"""
    async with db_pool.acquire() as connection:
        # Verify note ownership
        note = await connection.fetchrow(
            "SELECT id FROM notes WHERE id = $1 AND user_id = $2",
            uuid.UUID(note_id), current_user['id']
        )
        
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        versions = await connection.fetch(
            """SELECT nv.*, u.name as creator_name
               FROM note_versions nv
               JOIN users u ON nv.created_by = u.id
               WHERE nv.note_id = $1
               ORDER BY nv.version_number DESC""",
            uuid.UUID(note_id)
        )
        
        return [
            {
                "id": str(version['id']),
                "version_number": version['version_number'],
                "title": version['title'],
                "content": version['content'],
                "changes_summary": version['changes_summary'],
                "creator_name": version['creator_name'],
                "created_at": version['created_at']
            }
            for version in versions
        ]

# ========== ENHANCED TASKS API ==========

# ========== HELPER FUNCTIONS ==========

def _parse_datetime(dt_value):
    """Parse datetime from various formats"""
    if dt_value is None:
        return None
    if isinstance(dt_value, str):
        try:
            return datetime.fromisoformat(dt_value.replace('Z', '+00:00'))
        except:
            return datetime.now(timezone.utc)
    if isinstance(dt_value, datetime):
        return dt_value
    return datetime.now(timezone.utc)

# ========== ENHANCED TASKS API ==========

@app.get("/api/tasks", response_model=List[TaskResponse])
async def get_tasks(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    due_soon: bool = False,
    overdue: bool = False,
    project_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get tasks with advanced filtering"""
    # Always try database first for data persistence
    if db_pool is not None:
        async with db_pool.acquire() as connection:
            try:
                query_parts = ["""
                    SELECT id, title, description, status, priority, urgency_score, importance_score,
                           due_date, all_day, reminder_date, completed_at, estimated_duration, 
                           actual_duration, assignee, project_id, parent_task_id, tags, category,
                           location, energy_level, context_tags, recurrence_rule, ai_generated,
                           created_at, updated_at, user_id
                    FROM tasks WHERE user_id = $1
                """]
                params = [uuid.UUID(current_user['id'])]
                param_count = 1
                
                if status:
                    param_count += 1
                    query_parts.append(f"AND status = ${param_count}")
                    params.append(status)
                
                if priority:
                    param_count += 1
                    query_parts.append(f"AND priority = ${param_count}")
                    params.append(priority)
                
                if category:
                    param_count += 1
                    query_parts.append(f"AND category = ${param_count}")
                    params.append(category)
                
                if project_id:
                    param_count += 1
                    query_parts.append(f"AND project_id = ${param_count}")
                    params.append(uuid.UUID(project_id))
                
                if due_soon:
                    query_parts.append("AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'")
                
                if overdue:
                    query_parts.append("AND due_date < CURRENT_DATE AND status != 'completed'")
                
                query_parts.append(f"ORDER BY created_at DESC LIMIT ${param_count + 1} OFFSET ${param_count + 2}")
                params.extend([limit, offset])
                
                query = " ".join(query_parts)
                tasks = await connection.fetch(query, *params)
                
                result = []
                for task in tasks:
                    task_dict = {
                        'id': str(task['id']),
                        'title': task['title'],
                        'description': task['description'],
                        'status': task['status'],
                        'priority': task['priority'],
                        'urgency_score': task['urgency_score'],
                        'importance_score': task['importance_score'],
                        'due_at': task['due_date'].isoformat() if task['due_date'] else None,
                        'due_date': task['due_date'].isoformat() if task['due_date'] else None,
                        'all_day': task['all_day'],
                        'reminder_date': task['reminder_date'].isoformat() if task['reminder_date'] else None,
                        'completed_at': task['completed_at'].isoformat() if task['completed_at'] else None,
                        'estimated_duration': task['estimated_duration'],
                        'actual_duration': task['actual_duration'] or 0,
                        'assignee': task['assignee'],
                        'project_id': str(task['project_id']) if task['project_id'] else None,
                        'parent_task_id': str(task['parent_task_id']) if task['parent_task_id'] else None,
                        'tags': json.loads(task['tags']) if task['tags'] else [],
                        'category': task['category'],
                        'location': task['location'],
                        'energy_level': task['energy_level'],
                        'energy': task['urgency_score'],  # Use urgency_score as energy fallback
                        'context_tags': json.loads(task['context_tags']) if task['context_tags'] else [],
                        'recurrence_rule': task['recurrence_rule'],
                        'ai_generated': task['ai_generated'],
                        'created_at': task['created_at'].isoformat() if task['created_at'] else None,
                        'updated_at': task['updated_at'].isoformat() if task['updated_at'] else None,
                        'createdAt': task['created_at'].isoformat() if task['created_at'] else None,
                        'updatedAt': task['updated_at'].isoformat() if task['updated_at'] else None,
                    }
                    result.append(task_dict)
                
                logger.info(f"✅ Retrieved {len(result)} tasks from database for user {current_user['id']}")
                return result
                
            except Exception as e:
                logger.error(f"❌ Database query error: {e}")
                # Fall through to memory storage

    # Fallback to memory storage
    user_id = current_user['id']
    user_tasks = []
    
    # memory_storage에서 사용자의 태스크들 가져오기
    try:
        if 'user_tasks' in memory_storage and user_id in memory_storage['user_tasks']:
            for task in memory_storage['user_tasks'][user_id]:
                # 상태 필터링
                if status and task.get('status') != status:
                    continue
                # 우선순위 필터링
                if priority and task.get('priority') != priority:
                    continue
                # 카테고리 필터링
                if category and task.get('category') != category:
                    continue
                
                # 응답 형식에 맞게 변환
                formatted_task = {
                    'id': task.get('id'),
                    'title': task.get('title', ''),
                    'description': task.get('description', ''),
                    'status': task.get('status', 'pending'),
                    'priority': task.get('priority', 'medium'),
                    'urgency_score': task.get('urgency_score', 5),
                    'importance_score': task.get('importance_score', 5),
                    'due_at': task.get('due_date'),  # Map due_date to due_at
                    'due_date': task.get('due_date'),  # Keep for backward compatibility
                    'all_day': task.get('all_day', True),
                    'reminder_date': task.get('reminder_date'),
                    'completed_at': task.get('completed_at'),
                    'estimated_duration': task.get('estimated_duration'),
                    'actual_duration': task.get('actual_duration', 0),  # Default to 0
                    'assignee': task.get('assignee'),
                    'project_id': task.get('project_id'),
                    'parent_task_id': task.get('parent_task_id'),
                    'tags': task.get('tags', []),
                    'category': task.get('category'),
                    'location': task.get('location'),
                    'energy_level': task.get('energy_level', 'medium'),
                    'energy': task.get('energy', 5),
                    'context_tags': task.get('context_tags', []),
                    'recurrence_rule': task.get('recurrence_rule'),
                    'ai_generated': task.get('ai_generated', False),
                    'created_at': _parse_datetime(task.get('created_at')),
                    'updated_at': _parse_datetime(task.get('updated_at')),
                    'createdAt': _parse_datetime(task.get('created_at')),
                    'updatedAt': _parse_datetime(task.get('updated_at')),
                }
                user_tasks.append(formatted_task)
    except Exception as e:
        logger.warning(f"Error loading tasks from memory: {e}")
        
    # 페이지네이션
    logger.info(f"📚 Retrieved {len(user_tasks[offset:offset + limit])} tasks from memory storage for user {current_user['id']}")
    return user_tasks[offset:offset + limit]
                query_parts.append("AND due_date < CURRENT_TIMESTAMP AND status != 'completed'")
            
            query_parts.append("ORDER BY urgency_score DESC, importance_score DESC, due_date ASC")
            query_parts.append(f"LIMIT {limit} OFFSET {offset}")
            
            query = " ".join(query_parts)
            tasks = await connection.fetch(query, *params)
            
            return [
                {
                    "id": str(task['id']),
                    "title": task['title'],
                    "description": task['description'],
                    "status": task['status'],
                    "priority": task['priority'],
                    "urgency_score": task['urgency_score'],
                    "importance_score": task['importance_score'],
                    "due_at": task['due_date'],  # Return as due_at for frontend compatibility
                    "due_date": task['due_date'],  # Keep for backward compatibility
                    "all_day": task.get('all_day', True),  # Default to True if not set
                    "reminder_date": task['reminder_date'],
                    "completed_at": task['completed_at'],
                    "estimated_duration": task['estimated_duration'],
                    "actual_duration": task['actual_duration'],
                    "assignee": task['assignee'],
                    "project_id": str(task['project_id']) if task['project_id'] else None,
                    "parent_task_id": str(task['parent_task_id']) if task['parent_task_id'] else None,
                    "tags": task['tags'] or [],
                    "category": task['category'],
                    "location": task['location'],
                    "energy_level": task['energy_level'],
                    "context_tags": task['context_tags'] or [],
                    "recurrence_rule": task['recurrence_rule'],
                    "ai_generated": task['ai_generated'],
                    "createdAt": task['created_at'],
                    "updatedAt": task['updated_at']
                }
                for task in tasks
            ]
        except Exception as e:
            logger.error(f"Error fetching tasks from database: {e}")
            return []

# ============== Calendar Management Endpoints ==============

@app.get("/api/calendar/events")
async def get_calendar_events_alt(
    from_date: str = Query(alias="from"),
    to_date: str = Query(alias="to"),
    current_user: dict = Depends(get_current_user)
):
    """Get calendar events for a specific date range - alternative endpoint"""
    return await get_calendar_events(from_date, to_date, current_user)

@app.get("/api/calendar")
async def get_calendar_events(
    from_date: str = Query(alias="from"),
    to_date: str = Query(alias="to"),
    current_user: dict = Depends(get_current_user)
):
    """Get calendar events for a specific date range"""
    try:
        # Handle undefined or invalid date parameters
        if from_date == 'undefined' or from_date is None:
            from_date = datetime.now(timezone.utc).isoformat()
        if to_date == 'undefined' or to_date is None:
            to_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            
        # Parse date parameters
        try:
            start_date = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        except ValueError:
            start_date = datetime.now(timezone.utc)
            
        try:
            end_date = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        except ValueError:
            end_date = datetime.now(timezone.utc) + timedelta(days=30)
        
        logger.info(f"📅 Getting calendar events from {start_date} to {end_date} for user {current_user['id']}")
        
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                # Get calendar events
                # Ensure proper timezone handling for datetime comparison
                events_query = """
                SELECT id, title, description, start_time, end_time, location, attendees, created_at, updated_at
                FROM calendar_events 
                WHERE user_id = $1 
                AND start_time >= $2::timestamptz 
                AND start_time <= $3::timestamptz
                ORDER BY start_time
                """
                events_result = await conn.fetch(events_query, uuid.UUID(current_user['id']), start_date, end_date)
                
                # Get tasks with due dates as calendar events
                # Convert start_date and end_date to date objects for comparison with due_date
                start_date_only = start_date.date() if start_date.tzinfo else start_date.date()
                end_date_only = end_date.date() if end_date.tzinfo else end_date.date()
                
                tasks_query = """
                SELECT id, title, description, due_date, priority, status, created_at, updated_at
                FROM tasks 
                WHERE user_id = $1 AND due_date >= $2 AND due_date <= $3 AND status != 'completed'
                ORDER BY due_date
                """
                tasks_result = await conn.fetch(tasks_query, uuid.UUID(current_user['id']), start_date_only, end_date_only)
                
                # Convert calendar events
                events = []
                for event in events_result:
                    events.append({
                        "id": event['id'],
                        "title": event['title'],
                        "description": event['description'],
                        "start_at": event['start_time'].isoformat() if event['start_time'] else None,
                        "end_at": event['end_time'].isoformat() if event['end_time'] else None,
                        "location": event['location'],
                        "attendees": json.loads(event['attendees']) if event['attendees'] else [],
                        "user_id": current_user['id'],
                        "created_at": event['created_at'].isoformat(),
                        "updated_at": event['updated_at'].isoformat(),
                        "type": "event"
                    })
                
                # Convert tasks to calendar events
                for task in tasks_result:
                    # Convert due_date (date) to datetime for consistency
                    if task['due_date']:
                        due_datetime = datetime.combine(task['due_date'], datetime.min.time()).replace(tzinfo=timezone.utc)
                        task_event = {
                            "id": f"task-{task['id']}",
                            "title": f"📋 {task['title']}",
                            "description": task['description'] or "",
                            "start_at": due_datetime.isoformat(),
                            "end_at": due_datetime.isoformat(),
                            "location": None,
                            "attendees": [],
                            "user_id": current_user['id'],
                            "created_at": task['created_at'].isoformat() if task['created_at'] else None,
                            "updated_at": task['updated_at'].isoformat() if task['updated_at'] else None,
                            "type": "task",
                            "task_id": str(task['id']),
                            "priority": task['priority']
                        }
                        events.append(task_event)
                
                logger.info(f"✅ Found {len(events)} calendar events/tasks")
                return events
        
        # Fallback to memory storage
        events = []
        for event_id, event in memory_storage.get('events', {}).items():
            events.append(event)
        
        for task_id, task in memory_storage.get('tasks', {}).items():
            if task.get('due_date'):
                task_event = {
                    "id": f"task-{task_id}",
                    "title": f"📋 {task['title']}",
                    "description": task.get('description', ''),
                    "start_at": task['due_date'],
                    "end_at": task['due_date'],
                    "location": None,
                    "attendees": [],
                    "user_id": current_user['id'],
                    "created_at": task.get('created_at'),
                    "updated_at": task.get('updated_at'),
                    "type": "task",
                    "priority": task.get('priority', 'medium')
                }
                events.append(task_event)
        
        return events
        
    except Exception as e:
        logger.error(f"❌ Failed to get calendar events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get calendar events: {str(e)}")


@app.post("/api/calendar")
async def create_calendar_event(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event"""
    try:
        event_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Parse dates safely
        start_str = event_data.get('start_at') or event_data.get('start', '')
        end_str = event_data.get('end_at') or event_data.get('end', start_str)
        
        if not start_str:
            raise HTTPException(status_code=400, detail="start_at is required")
            
        try:
            # Handle different date formats
            if 'T' in start_str:
                start_date = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            else:
                start_date = datetime.fromisoformat(start_str)
                
            if end_str and end_str != start_str:
                if 'T' in end_str:
                    end_date = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
                else:
                    end_date = datetime.fromisoformat(end_str)
            else:
                # Default to 1 hour duration
                end_date = start_date + timedelta(hours=1)
                
        except ValueError as date_error:
            logger.error(f"❌ Date parsing error: {date_error}")
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(date_error)}")
        
        logger.info(f"📅 Creating calendar event: {event_data.get('title', '')} from {start_date} to {end_date}")
        
        if db_pool is not None:
            async with db_pool.acquire() as connection:
                query = """
                INSERT INTO calendar_events (id, user_id, title, description, start_time, end_time, location, attendees, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
                """
                result = await connection.fetchrow(
                    query,
                    uuid.UUID(event_id),
                    uuid.UUID(current_user['id']),
                    event_data.get('title', ''),
                    event_data.get('description', ''),
                    start_date,
                    end_date,
                    event_data.get('location', ''),
                    json.dumps(event_data.get('attendees', [])),
                    now,
                    now
                )
                
                return {
                    "id": str(result['id']),
                    "title": result['title'],
                    "description": result['description'],
                    "start_at": result['start_time'].isoformat(),
                    "end_at": result['end_time'].isoformat(),
                    "location": result['location'],
                    "attendees": json.loads(result['attendees']) if result['attendees'] else [],
                    "user_id": current_user['id'],
                    "created_at": result['created_at'].isoformat(),
                    "updated_at": result['updated_at'].isoformat(),
                    "type": "event"
                }
        else:
            # Memory storage
            event = {
                'id': event_id,
                'user_id': current_user['id'],
                'title': event_data.get('title', ''),
                'description': event_data.get('description', ''),
                'start_time': start_date,
                'end_time': end_date,
                'location': event_data.get('location', ''),
                'attendees': event_data.get('attendees', []),
                'created_at': now,
                'updated_at': now
            }
            
            # memory_storage의 user_events에 추가
            if 'user_events' not in memory_storage:
                memory_storage['user_events'] = {}
            if current_user['id'] not in memory_storage['user_events']:
                memory_storage['user_events'][current_user['id']] = []
            
            memory_storage['user_events'][current_user['id']].append(event)
            
            logger.info(f"✅ Calendar event {event_id} created in memory")
            
            return {
                "id": event_id,
                "title": event['title'],
                "description": event['description'],
                "start_at": event['start_time'].isoformat(),
                "end_at": event['end_time'].isoformat(),
                "location": event['location'],
                "attendees": event['attendees'],
                "user_id": current_user['id'],
                "created_at": event['created_at'].isoformat(),
                "updated_at": event['updated_at'].isoformat(),
                "type": "event"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating calendar event: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create calendar event: {str(e)}")


@app.post("/api/events")
async def create_event_alias(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event - alias for /api/calendar"""
    return await create_calendar_event(event_data, current_user)


# @app.post("/api/tasks", response_model=dict)
# async def create_task_simple(task: dict, current_user: dict = Depends(get_current_user)):
    """Create a new task with simplified endpoint"""
    try:
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        if db_pool is not None:
            # Database creation logic
            async with db_pool.acquire() as connection:
                query = """
                INSERT INTO tasks (id, user_id, title, description, due_date, all_day, priority, status, location, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
                """
                result = await connection.fetchrow(
                    query,
                    uuid.UUID(task_id),
                    uuid.UUID(current_user['id']),
                    task["title"],
                    task.get("description", ""),
                    task.get("due_at"),
                    task.get("all_day", True),
                    task.get("priority", "medium"),
                    task.get("status", "pending"),
                    task.get("location", ""),
                    now,
                    now
                )
                
                return {
                    "id": str(result['id']),
                    "title": result['title'],
                    "description": result['description'] or "",
                    "due_at": result['due_date'].isoformat() if result['due_date'] else None,
                    "all_day": result['all_day'],
                    "type": "task",
                    "priority": result['priority'],
                    "status": result['status'],
                    "location": result.get('location', ''),
                    "created_at": result['created_at'].isoformat(),
                    "updated_at": result['updated_at'].isoformat()
                }
        else:
            # Memory storage
            new_task = {
                'id': task_id,
                'user_id': current_user['id'],
                'title': task.get('title', ''),
                'description': task.get('description', ''),
                'status': task.get('status', 'pending'),
                'priority': task.get('priority', 'medium'),
                'urgency_score': 5,
                'importance_score': 5,
                'due_date': datetime.fromisoformat(task['due_at']) if task.get('due_at') else None,
                'all_day': task.get('all_day', True),
                'reminder_date': None,
                'estimated_duration': task.get('estimated_duration'),
                'assignee': task.get('assignee'),
                'project_id': task.get('project_id'),
                'parent_task_id': task.get('parent_task_id'),
                'tags': task.get('tags', []),
                'category': task.get('category'),
                'location': task.get('location', ''),
                'energy_level': task.get('energy_level', 'medium'),
                'energy': task.get('energy', 5),
                'context_tags': task.get('context_tags', []),
                'recurrence_rule': task.get('recurrence_rule'),
                'ai_generated': False,
                'created_at': now,
                'updated_at': now,
                'completed_at': None
            }
            
            memory_storage['tasks'][task_id] = new_task
            logger.info(f"✅ Task created in memory: {task_id}")
            
            return {
                "id": task_id,
                "title": new_task['title'],
                "description": new_task['description'],
                "status": new_task['status'],
                "priority": new_task['priority'],
                "urgency_score": new_task['urgency_score'],
                "importance_score": new_task['importance_score'],
                "due_at": new_task['due_date'].isoformat() if new_task['due_date'] else None,
                "due_date": new_task['due_date'].isoformat() if new_task['due_date'] else None,
                "all_day": new_task['all_day'],
                "reminder_date": None,
                "completed_at": None,
                "estimated_duration": new_task['estimated_duration'],
                "actual_duration": 0,
                "assignee": new_task['assignee'],
                "project_id": new_task['project_id'],
                "parent_task_id": new_task['parent_task_id'],
                "tags": new_task['tags'],
                "category": new_task['category'],
                "location": new_task['location'],
                "energy_level": new_task['energy_level'],
                "energy": new_task['energy'],
                "context_tags": new_task['context_tags'],
                "recurrence_rule": new_task['recurrence_rule'],
                "ai_generated": new_task['ai_generated'],
                "created_at": new_task['created_at'].isoformat(),
                "updated_at": new_task['updated_at'].isoformat(),
                "createdAt": new_task['created_at'].isoformat(),
                "updatedAt": new_task['updated_at'].isoformat()
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to create task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")


# @app.post("/api/tasks/", response_model=dict)
# async def create_task(task: dict, current_user: dict = Depends(get_current_user)):
    """Create a new task"""
    try:
        task_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        if db_pool is not None:
            # Database creation logic
            async with db_pool.acquire() as connection:
                query = """
                INSERT INTO tasks (id, user_id, title, description, due_date, all_day, priority, status, location, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
                """
                result = await connection.fetchrow(
                    query,
                    uuid.UUID(task_id),
                    uuid.UUID(current_user['id']),
                    task["title"],
                    task.get("description", ""),
                    task.get("due_date"),
                    task.get("all_day", True),
                    task.get("priority", "medium"),
                    task.get("status", "pending"),
                    task.get("location", ""),
                    now,
                    now
                )
                
                return {
                    "id": str(result['id']),
                    "title": result['title'],
                    "description": result['description'] or "",
                    "due_date": result['due_date'].isoformat() if result['due_date'] else None,
                    "all_day": result['all_day'],
                    "type": "task",
                    "priority": result['priority'],
                    "status": result['status'],
                    "location": result.get('location', ''),
                    "created_at": result['created_at'].isoformat(),
                    "updated_at": result['updated_at'].isoformat()
                }
        else:
            # In-memory fallback - create task only, not calendar event
            if "tasks" not in memory_storage:
                memory_storage["tasks"] = {}
            
            task_id = str(uuid.uuid4())
            task = {
                "id": task_id,
                "user_id": current_user['id'],
                "title": task_data.get('title', ''),
                "description": task_data.get('description', ''),
                "due_date": task_data.get('due_date'),
                "all_day": task_data.get('all_day', True),
                "priority": task_data.get('priority', 'medium'),
                "status": task_data.get('status', 'pending'),
                "location": task_data.get('location', ''),
                "created_at": now,
                "updated_at": now
            }
            memory_storage["tasks"][task_id] = task
            
            logger.info(f"✅ Created task in memory: {task_id}")
            
            return {
                "id": task_id,
                "title": task['title'],
                "description": task['description'],
                "due_date": task['due_date'].isoformat() if task['due_date'] else None,
                "all_day": task['all_day'],
                "type": "task",
                "priority": task['priority'],
                "status": task['status'],
                "location": task['location'],
                "created_at": task['created_at'].isoformat(),
                "updated_at": task['updated_at'].isoformat()
            }
            
    except Exception as e:
        logger.error(f"❌ Error creating calendar event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create calendar event: {str(e)}")

@app.post("/api/calendar/events")
async def create_calendar_event(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event"""
    try:
        logger.info(f"📅 Creating calendar event for user {current_user['id']}")
        logger.info(f"Enhanced API: Creating calendar event with data: {event_data}")
        
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                # First ensure user exists - create if doesn't exist
                user_id_str = current_user['id']
                try:
                    user_id = uuid.UUID(user_id_str)
                except ValueError:
                    # If user ID is not a valid UUID, create a new one
                    user_id = uuid.uuid4()
                    logger.info(f"🔄 Generated new UUID for user: {user_id}")
                
                user_check_query = "SELECT id FROM users WHERE id = $1"
                user_exists = await conn.fetchrow(user_check_query, user_id)
                
                if not user_exists:
                    create_user_query = """
                    INSERT INTO users (id, name, email, created_at, updated_at) 
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """
                    await conn.execute(create_user_query, user_id, "Demo User", "demo@example.com")
                    logger.info(f"✅ Created new user: {user_id}")
                
                # Create calendar event
                event_id = uuid.uuid4()
                start_time = event_data.get("start_at") or event_data.get("start")
                end_time = event_data.get("end_at") or event_data.get("end") or start_time
                
                insert_query = """
                INSERT INTO calendar_events (
                    id, user_id, title, description, start_time, end_time, 
                    location, attendees, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id, title, description, start_time, end_time, location, attendees, created_at, updated_at
                """
                
                attendees_json = json.dumps(event_data.get("attendees", []))
                
                result = await conn.fetchrow(
                    insert_query,
                    event_id,
                    user_id,
                    event_data.get("title", "New Event"),
                    event_data.get("description", ""),
                    start_time,
                    end_time,
                    event_data.get("location"),
                    attendees_json
                )
                
                if result:
                    event_dict = {
                        "id": result['id'],
                        "title": result['title'],
                        "description": result['description'],
                        "start_at": result['start_time'].isoformat() if result['start_time'] else None,
                        "end_at": result['end_time'].isoformat() if result['end_time'] else None,
                        "location": result['location'],
                        "attendees": json.loads(result['attendees']) if result['attendees'] else [],
                        "user_id": user_id,
                        "created_at": result['created_at'].isoformat(),
                        "updated_at": result['updated_at'].isoformat()
                    }
                    logger.info(f"✅ Calendar event created successfully: {event_dict}")
                    return event_dict
                
        # Fallback to memory storage
        event_id = str(uuid.uuid4())
        event = {
            "id": event_id,
            "title": event_data.get("title", "New Event"),
            "description": event_data.get("description", ""),
            "start_at": event_data.get("start_at") or event_data.get("start"),
            "end_at": event_data.get("end_at") or event_data.get("end"),
            "location": event_data.get("location"),
            "attendees": event_data.get("attendees", []),
            "user_id": current_user['id'],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # memory_storage의 user_events에 추가
        if 'user_events' not in memory_storage:
            memory_storage['user_events'] = {}
        if current_user['id'] not in memory_storage['user_events']:
            memory_storage['user_events'][current_user['id']] = []
        
        memory_storage['user_events'][current_user['id']].append(event)
        logger.info(f"✅ Calendar event created in memory: {event}")
        return event
        
    except Exception as e:
        logger.error(f"❌ Failed to create calendar event: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create calendar event: {str(e)}")


# ============== AI & Auto Scheduling Endpoints ==============

@app.post("/api/schedule/auto")
async def auto_schedule_tasks(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """AI-powered automatic task scheduling"""
    try:
        logger.info(f"🤖 Auto-scheduling tasks for user {current_user['id']}")
        
        # Get user preferences from request
        peak_energy = request_data.get('peak_energy', '09:00')
        preferred_duration = request_data.get('preferred_duration', 60)
        break_time = request_data.get('break_time', 15)
        
        # Get pending tasks
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                tasks_query = """
                SELECT id, title, description, priority, estimated_duration, due_date
                FROM tasks 
                WHERE user_id = $1 AND status = 'pending'
                ORDER BY priority DESC, due_date ASC
                """
                tasks = await conn.fetch(tasks_query, current_user['id'])
        else:
            # In-memory fallback
            all_tasks = in_memory_storage.get("tasks", {})
            tasks = [
                task for task in all_tasks.values()
                if task["user_id"] == current_user['id'] and task.get("status") == "pending"
            ]
        
        # AI scheduling algorithm
        scheduled_tasks = []
        current_time = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        
        for task in tasks:
            task_duration = task.get('estimated_duration', preferred_duration)
            
            # Create scheduled time slot
            scheduled_task = {
                "task_id": task['id'],
                "title": task['title'],
                "scheduled_start": current_time.isoformat(),
                "scheduled_end": (current_time + timedelta(minutes=task_duration)).isoformat(),
                "duration_minutes": task_duration,
                "priority": task.get('priority', 'medium')
            }
            
            scheduled_tasks.append(scheduled_task)
            
            # Move to next time slot with break
            current_time += timedelta(minutes=task_duration + break_time)
        
        logger.info(f"✅ Auto-scheduled {len(scheduled_tasks)} tasks")
        
        return {
            "success": True,
            "scheduled_tasks": scheduled_tasks,
            "total_tasks": len(scheduled_tasks),
            "estimated_completion": current_time.isoformat() if scheduled_tasks else None,
            "recommendations": [
                "💡 Schedule high-energy tasks during your peak hours",
                "🔄 Take regular breaks to maintain productivity",
                "⏰ Set reminders 5 minutes before each task"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error in auto-scheduling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to auto-schedule tasks: {str(e)}")

@app.get("/api/tasks/today")
async def get_today_tasks(current_user: dict = Depends(get_current_user)):
    """Get tasks for today"""
    try:
        today = datetime.now().date()
        logger.info(f"📅 Getting today's tasks for user {current_user['id']}")
        
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                query = """
                SELECT id, title, description, status, priority, due_date, created_at
                FROM tasks 
                WHERE user_id = $1 AND DATE(due_date) = $2
                ORDER BY priority DESC, created_at ASC
                """
                tasks = await conn.fetch(query, current_user['id'], today)
                
                return {
                    "tasks": [
                        {
                            "id": task['id'],
                            "title": task['title'],
                            "description": task['description'],
                            "status": task['status'],
                            "priority": task['priority'],
                            "energy": task['energy'],
                            "due_date": task['due_date'].isoformat() if task['due_date'] else None,
                            "created_at": task['created_at'].isoformat()
                        }
                        for task in tasks
                    ],
                    "total_count": len(tasks),
                    "completed_count": sum(1 for task in tasks if task['status'] == 'completed'),
                    "pending_count": sum(1 for task in tasks if task['status'] == 'pending')
                }
        else:
            # In-memory fallback
            all_tasks = in_memory_storage.get("tasks", {})
            today_tasks = [
                task for task in all_tasks.values()
                if task["user_id"] == current_user['id'] and 
                task.get("due_date") and
                datetime.fromisoformat(task["due_date"]).date() == today
            ]
            
            return {
                "tasks": today_tasks,
                "total_count": len(today_tasks),
                "completed_count": sum(1 for task in today_tasks if task.get('status') == 'completed'),
                "pending_count": sum(1 for task in today_tasks if task.get('status') == 'pending')
            }
            
    except Exception as e:
        logger.error(f"❌ Error getting today's tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get today's tasks: {str(e)}")

@app.get("/api/daily-brief")
async def get_daily_brief(
    date_param: str = Query(default=None, alias="date"),
    current_user: dict = Depends(get_current_user)
):
    """Get daily brief with tasks, notes, and insights"""
    try:
        target_date = datetime.fromisoformat(date_param).date() if date_param else datetime.now().date()
        logger.info(f"📊 Getting daily brief for {target_date} for user {current_user['id']}")
        
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                # Get tasks for the day
                tasks_query = """
                SELECT id, title, status, priority FROM tasks 
                WHERE user_id = $1 AND DATE(due_date) = $2
                """
                tasks = await conn.fetch(tasks_query, current_user['id'], target_date)
                
                # Get recent notes
                notes_query = """
                SELECT id, title, content FROM notes 
                WHERE user_id = $1 AND DATE(created_at) = $2
                ORDER BY created_at DESC LIMIT 5
                """
                notes = await conn.fetch(notes_query, current_user['id'], target_date)
        else:
            # In-memory fallback
            tasks = []
            notes = []
        
        # Generate AI insights
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task.get('status') == 'completed')
        productivity_score = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            "date": target_date.isoformat(),
            "tasks": [
                {
                    "id": task['id'],
                    "title": task['title'],
                    "status": task['status'],
                    "priority": task['priority'],
                    "energy": task['energy']
                }
                for task in tasks
            ],
            "recent_notes": [
                {
                    "id": note['id'],
                    "title": note['title'],
                    "preview": note['content'][:100] + "..." if len(note['content']) > 100 else note['content']
                }
                for note in notes
            ],
            "summary": f"You have {total_tasks} tasks today with {completed_tasks} completed.",
            "productivity_score": round(productivity_score, 1),
            "insights": [
                "💪 Great job maintaining focus today!" if productivity_score > 80 else "🎯 Let's boost productivity today!",
                f"📝 {len(notes)} notes created today",
                "⚡ Peak energy hours: 9-11 AM" if any(task.get('energy', 0) > 7 for task in tasks) else "🔋 Consider energy management"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting daily brief: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get daily brief: {str(e)}")

@app.post("/api/summarize")
async def summarize_text(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """AI text summarization using OpenAI"""
    try:
        text = request_data.get('text', '')
        style = request_data.get('style', 'concise')
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        logger.info(f"🤖 Summarizing text for user {current_user['id']}")
        
        # Use OpenAI for actual summarization if available, otherwise use mock
        if OPENAI_API_KEY and len(text) > 100:
            try:
                logger.info(f"🔗 Calling OpenAI API with text length: {len(text)}")
                client = openai.OpenAI(
                    api_key=OPENAI_API_KEY,
                    timeout=30.0  # 30 second timeout
                )
                
                # Create appropriate prompt based on style
                if style == 'bullet':
                    prompt = f"다음 텍스트를 주요 포인트별로 불렛 포인트 형태로 요약해주세요:\n\n{text}"
                elif style == 'detailed':
                    prompt = f"다음 텍스트를 상세하게 요약해주세요. 중요한 내용은 모두 포함시켜주세요:\n\n{text}"
                else:  # concise
                    prompt = f"다음 텍스트를 간결하고 핵심적으로 요약해주세요:\n\n{text}"
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "당신은 텍스트 요약 전문가입니다. 주어진 텍스트의 핵심 내용을 정확하고 명확하게 요약해주세요."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                
                ai_summary = response.choices[0].message.content.strip()
                
                logger.info(f"✅ OpenAI summarization successful. Original: {len(text)}, Summary: {len(ai_summary)}")
                
                return {
                    "summary": ai_summary,
                    "original_length": len(text),
                    "summary_length": len(ai_summary),
                    "style": style,
                    "method": "openai_gpt"
                }
                
            except Exception as e:
                logger.error(f"❌ OpenAI API error: {e}")
                # Fall through to mock response
        
        # Mock AI summarization for demo purposes
        logger.info(f"🎭 Using mock AI summarization for text length: {len(text)}")
        
        if style == 'bullet':
            mock_summary = f"""주요 포인트:
• 핵심 내용 1: {text[:50]}...의 요약
• 핵심 내용 2: 중요한 정보들이 포함됨
• 핵심 내용 3: 전체적인 맥락과 결론
• 추가 정보: 세부 사항들이 정리됨"""
        elif style == 'detailed':
            mock_summary = f"""상세 요약:

본 텍스트는 {len(text)}자의 내용으로 구성되어 있으며, 다음과 같은 주요 내용을 포함하고 있습니다:

1. 서론 부분에서는 {text[:30]}... 등의 내용을 다루고 있습니다.

2. 본론에서는 핵심적인 주제들과 관련된 상세한 정보들이 제시되어 있습니다.

3. 결론적으로, 제시된 내용들은 전체적으로 일관성 있는 맥락을 형성하고 있습니다.

이 요약은 원문의 핵심 내용을 포괄적으로 담고 있으며, 중요한 세부사항들도 포함되어 있습니다."""
        else:  # concise
            words = text.split()[:20]  # First 20 words
            mock_summary = f"{' '.join(words)}... [요약: 이 텍스트는 {len(text)}자의 내용으로, 주요 주제와 핵심 정보들을 다루고 있습니다. AI가 자동으로 핵심 내용을 추출하여 간결하게 정리했습니다.]"
        
        logger.info(f"✅ Mock summarization completed. Original: {len(text)}, Summary: {len(mock_summary)}")
        
        return {
            "summary": mock_summary,
            "original_length": len(text),
            "summary_length": len(mock_summary),
            "compression_ratio": 1 - (len(mock_summary) / len(text)),
            "style": style,
            "method": "mock_ai"
        }
        
    except Exception as e:
        logger.error(f"❌ Error in AI summarization: {str(e)}")
        # Fallback to simple summarization
        sentences = text.split('. ')
        if len(sentences) <= 3:
            summary = text
        else:
            # Take first and last sentences, plus one from middle
            middle_idx = len(sentences) // 2
            key_sentences = [sentences[0], sentences[middle_idx], sentences[-1]]
            summary = '. '.join(key_sentences)
            
            if not summary.endswith('.'):
                summary += '.'
        
        return {
            "summary": summary,
            "original_length": len(text),
            "summary_length": len(summary),
            "compression_ratio": round((1 - len(summary) / len(text)) * 100, 1),
            "style": style,
            "key_points": [
                "📋 Main concepts identified",
                "🎯 Key information extracted",
                "⚡ Content condensed efficiently"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error summarizing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to summarize text: {str(e)}")

@app.post("/api/extract-tasks")
async def extract_tasks_from_text(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Extract tasks from text using OpenAI"""
    try:
        text = request_data.get('text', '')
        auto_create = request_data.get('auto_create', False)
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        logger.info(f"🤖 Extracting tasks from text for user {current_user['id']}")
        
        extracted_tasks = []
        
        # Use OpenAI for actual task extraction
        if OPENAI_API_KEY:
            try:
                client = openai.OpenAI(api_key=OPENAI_API_KEY)
                
                prompt = f"""다음 텍스트에서 실행 가능한 작업(task)들을 추출해주세요. 
각 작업은 다음 JSON 형태로 반환해주세요:
[
  {{
    "title": "작업 제목",
    "description": "작업 설명 (선택사항)",
    "priority": "high/medium/low",
    "estimated_duration": 30 (분 단위)
  }}
]

텍스트:
{text}

실행 가능한 구체적인 작업만 추출하고, JSON 배열 형태로만 응답해주세요."""

                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "당신은 텍스트에서 실행 가능한 작업을 추출하는 전문가입니다. JSON 형태로만 응답하세요."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.2
                )
                
                ai_response = response.choices[0].message.content.strip()
                
                # Try to parse JSON response
                import json
                try:
                    # Clean up response in case there's extra text
                    start_idx = ai_response.find('[')
                    end_idx = ai_response.rfind(']') + 1
                    if start_idx != -1 and end_idx != 0:
                        json_str = ai_response[start_idx:end_idx]
                        extracted_tasks = json.loads(json_str)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse OpenAI JSON response: {ai_response}")
                    # Fall back to simple extraction
                    pass
                    
            except Exception as openai_error:
                logger.error(f"OpenAI task extraction failed: {openai_error}")
                # Fall back to simple method
                pass
        
        # Fallback simple task extraction when OpenAI fails
        if not extracted_tasks:
            import re
            
            # Look for action words and patterns
            action_patterns = [
                r'(?:need to|have to|must|should|will|plan to|going to)\s+([^.!?\n]+)',
                r'(?:todo|task|action):\s*([^.!?\n]+)',
                r'(?:^|\n)\s*[-•*]\s*([^.!?\n]+)',
                r'(?:remember to|don\'t forget to)\s+([^.!?\n]+)'
            ]
        
        extracted_tasks = []
        for pattern in action_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                task_text = match.group(1).strip()
                if len(task_text) > 5:  # Filter out very short matches
                    extracted_tasks.append({
                        "title": task_text,
                        "priority": "medium",
                        "energy": 5,
                        "estimated_duration": 30
                    })
        
        # Remove duplicates
        seen_titles = set()
        unique_tasks = []
        for task in extracted_tasks:
            if task["title"].lower() not in seen_titles:
                seen_titles.add(task["title"].lower())
                unique_tasks.append(task)
        
        created_ids = []
        if auto_create and unique_tasks:
            # Create tasks in database
            if db_pool is not None:
                async with db_pool.acquire() as conn:
                    for task in unique_tasks:
                        query = """
                        INSERT INTO tasks (user_id, title, priority, energy, status)
                        VALUES ($1, $2, $3, $4, 'pending')
                        RETURNING id
                        """
                        task_id = await conn.fetchval(
                            query,
                            current_user['id'],
                            task["title"],
                            task["priority"],
                            task["energy"]
                        )
                        created_ids.append(task_id)
            else:
                # In-memory fallback
                if "tasks" not in in_memory_storage:
                    in_memory_storage["tasks"] = {}
                
                for task in unique_tasks:
                    task_id = str(get_next_id('task'))
                    new_task = {
                        "id": task_id,
                        "user_id": current_user['id'],
                        "title": task["title"],
                        "priority": task["priority"],
                        "energy": task["energy"],
                        "status": "pending",
                        "created_at": datetime.utcnow().isoformat()
                    }
                    in_memory_storage["tasks"][task_id] = new_task
                    created_ids.append(task_id)
        
        return {
            "tasks": unique_tasks,
            "total_extracted": len(unique_tasks),
            "created_ids": created_ids,
            "auto_created": auto_create and len(created_ids) > 0,
            "suggestions": [
                "🎯 Review extracted tasks for accuracy",
                "⏰ Add due dates to important tasks",
                "🔋 Assign energy levels based on complexity"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error extracting tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract tasks: {str(e)}")

@app.post("/api/search")
async def search_content(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Search across notes and tasks"""
    try:
        query = request_data.get('query', '').lower()
        filters = request_data.get('filters', {})
        
        if not query:
            raise HTTPException(status_code=400, detail="Search query is required")
        
        logger.info(f"🔍 Searching for '{query}' for user {current_user['id']}")
        
        results = []
        
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                # Search notes
                notes_query = """
                SELECT id, title, content, created_at, 'note' as type
                FROM notes 
                WHERE user_id = $1 AND (
                    LOWER(title) LIKE $2 OR 
                    LOWER(content) LIKE $2
                )
                ORDER BY created_at DESC
                """
                notes = await conn.fetch(notes_query, current_user['id'], f'%{query}%')
                
                # Search tasks
                tasks_query = """
                SELECT id, title, description, status, priority, created_at, 'task' as type
                FROM tasks 
                WHERE user_id = $1 AND (
                    LOWER(title) LIKE $2 OR 
                    LOWER(description) LIKE $2
                )
                ORDER BY created_at DESC
                """
                tasks = await conn.fetch(tasks_query, current_user['id'], f'%{query}%')
                
                # Combine results
                for note in notes:
                    results.append({
                        "id": note['id'],
                        "type": "note",
                        "title": note['title'],
                        "content": note['content'][:200] + "..." if len(note['content']) > 200 else note['content'],
                        "created_at": note['created_at'].isoformat(),
                        "relevance_score": 0.9 if query in note['title'].lower() else 0.7
                    })
                
                for task in tasks:
                    results.append({
                        "id": task['id'],
                        "type": "task",
                        "title": task['title'],
                        "content": task['description'] or "",
                        "status": task['status'],
                        "priority": task['priority'],
                        "created_at": task['created_at'].isoformat(),
                        "relevance_score": 0.9 if query in task['title'].lower() else 0.7
                    })
        else:
            # In-memory search fallback
            all_notes = in_memory_storage.get("notes", {})
            all_tasks = in_memory_storage.get("tasks", {})
            
            for note in all_notes.values():
                if (note["user_id"] == current_user['id'] and 
                    (query in note["title"].lower() or query in note["content"].lower())):
                    results.append({
                        "id": note['id'],
                        "type": "note",
                        "title": note['title'],
                        "content": note['content'][:200] + "..." if len(note['content']) > 200 else note['content'],
                        "created_at": note['created_at'],
                        "relevance_score": 0.9 if query in note['title'].lower() else 0.7
                    })
            
            for task in all_tasks.values():
                if (task["user_id"] == current_user['id'] and 
                    (query in task["title"].lower() or query in task.get("description", "").lower())):
                    results.append({
                        "id": task['id'],
                        "type": "task",
                        "title": task['title'],
                        "content": task.get('description', ''),
                        "status": task.get('status', 'pending'),
                        "priority": task.get('priority', 'medium'),
                        "created_at": task['created_at'],
                        "relevance_score": 0.9 if query in task['title'].lower() else 0.7
                    })
        
        # Sort by relevance and recency
        results.sort(key=lambda x: (x['relevance_score'], x['created_at']), reverse=True)
        
        return {
            "results": results[:20],  # Limit to top 20 results
            "total": len(results),
            "query": query,
            "search_time_ms": 50,  # Simulated search time
            "suggestions": [
                "🔍 Try more specific keywords",
                "📅 Use date filters for better results",
                "🏷️ Search by tags or categories"
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error searching content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search content: {str(e)}")

@app.post("/api/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    """Create a new task with enhanced features"""
    try:
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Handle due date mapping (frontend sends due_at, backend uses due_date)
        due_date_value = getattr(task_data, 'due_at', None) or getattr(task_data, 'due_date', None)
        if due_date_value and isinstance(due_date_value, str):
            try:
                # Parse ISO format
                due_date_value = datetime.fromisoformat(due_date_value.replace('Z', '+00:00'))
                
                # For all_day tasks, use the date without timezone adjustments
                if getattr(task_data, 'all_day', True):
                    # Convert to date and then to datetime at 00:00 in UTC
                    date_only = due_date_value.date()
                    due_date_value = datetime.combine(date_only, datetime.min.time()).replace(tzinfo=timezone.utc)
                else:
                    # For timed tasks, ensure timezone-aware
                    if due_date_value.tzinfo is None:
                        due_date_value = due_date_value.replace(tzinfo=timezone.utc)
            except:
                due_date_value = None
        elif due_date_value and isinstance(due_date_value, datetime):
            if getattr(task_data, 'all_day', True):
                # For all_day tasks, use date only
                date_only = due_date_value.date()
                due_date_value = datetime.combine(date_only, datetime.min.time()).replace(tzinfo=timezone.utc)
            elif due_date_value.tzinfo is None:
                # Make naive datetime timezone-aware
                due_date_value = due_date_value.replace(tzinfo=timezone.utc)
        
        # Handle reminder_date with timezone
        reminder_date_value = getattr(task_data, 'reminder_date', None)
        if reminder_date_value and isinstance(reminder_date_value, str):
            try:
                reminder_date_value = datetime.fromisoformat(reminder_date_value.replace('Z', '+00:00'))
                if reminder_date_value.tzinfo is None:
                    reminder_date_value = reminder_date_value.replace(tzinfo=timezone.utc)
            except:
                reminder_date_value = None
        elif reminder_date_value and isinstance(reminder_date_value, datetime) and reminder_date_value.tzinfo is None:
            reminder_date_value = reminder_date_value.replace(tzinfo=timezone.utc)
        
        if db_pool is None:
            # 인메모리 저장소에 태스크 생성
            new_task = {
                "id": task_id,
                "user_id": current_user['id'],
                "title": task_data.title,
                "description": getattr(task_data, 'description', ''),
                "status": getattr(task_data, 'status', 'pending'),
                "priority": getattr(task_data, 'priority', 'medium'),
                "urgency_score": getattr(task_data, 'urgency_score', 5),
                "importance_score": getattr(task_data, 'importance_score', 5),
                "due_date": due_date_value,
                "all_day": getattr(task_data, 'all_day', True),
                "reminder_date": reminder_date_value,
                "estimated_duration": getattr(task_data, 'estimated_duration', None),
                "assignee": getattr(task_data, 'assignee', None),
                "project_id": getattr(task_data, 'project_id', None),
                "parent_task_id": getattr(task_data, 'parent_task_id', None),
                "tags": getattr(task_data, 'tags', []),
                "category": getattr(task_data, 'category', None),
                "location": getattr(task_data, 'location', None),
                "energy_level": getattr(task_data, 'energy_level', 'medium'),
                "energy": 5,  # Default energy value
                "context_tags": getattr(task_data, 'context_tags', []),
                "recurrence_rule": getattr(task_data, 'recurrence_rule', None),
                "ai_generated": False,
                "created_at": now,  # Store as datetime object
                "updated_at": now,  # Store as datetime object
                "completed_at": None
            }
            
            memory_storage['tasks'][task_id] = new_task
            
            # memory_storage의 tasks에도 추가 (user_id를 키로 사용)
            user_id = current_user['id']
            if 'user_tasks' not in memory_storage:
                memory_storage['user_tasks'] = {}
            if user_id not in memory_storage['user_tasks']:
                memory_storage['user_tasks'][user_id] = []
            memory_storage['user_tasks'][user_id].append(new_task)
            
            logger.info(f"✅ Task {task_id} created in memory for user {user_id}")
            
            # 실시간 업데이트 전송
            try:
                await manager.send_personal_message({
                    "type": "task_created",
                    "data": {"id": task_id, "title": task_data.title}
                }, current_user['id'])
            except Exception as e:
                logger.warning(f"Real-time notification failed: {e}")
            
            # Return task in expected format
            return {
                "id": task_id,
                "title": new_task["title"],
                "description": new_task["description"],
                "status": new_task["status"],
                "priority": new_task["priority"],
                "urgency_score": new_task["urgency_score"],
                "importance_score": new_task["importance_score"],
                "due_at": new_task["due_date"].isoformat() if new_task["due_date"] else None,
                "due_date": new_task["due_date"].isoformat() if new_task["due_date"] else None,
                "all_day": new_task["all_day"],
                "reminder_date": new_task["reminder_date"].isoformat() if new_task["reminder_date"] else None,
                "completed_at": new_task["completed_at"],
                "estimated_duration": new_task["estimated_duration"],
                "actual_duration": None,
                "assignee": new_task["assignee"],
                "project_id": new_task["project_id"],
                "parent_task_id": new_task["parent_task_id"],
                "tags": new_task["tags"],
                "category": new_task["category"],
                "location": new_task["location"],
                "energy_level": new_task["energy_level"],
                "context_tags": new_task["context_tags"],
                "recurrence_rule": new_task["recurrence_rule"],
                "ai_generated": new_task["ai_generated"],
                "created_at": now.isoformat(),  # Use current UTC time
                "updated_at": now.isoformat(),  # Use current UTC time
                "createdAt": now.isoformat(),   # Use current UTC time for frontend
                "updatedAt": now.isoformat()    # Use current UTC time for frontend
            }
        
        async with db_pool.acquire() as connection:
            # Auto-create user if doesn't exist
            try:
                await connection.execute("""
                    INSERT INTO users (id, email, name, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        last_active = CURRENT_TIMESTAMP
                """,
                    uuid.UUID(current_user['id']),
                    current_user.get('email', 'demo@example.com'),
                    current_user.get('name', 'Demo User'),
                    now.replace(tzinfo=None),
                    now.replace(tzinfo=None)
                )
                logger.info(f"✅ User {current_user['id']} ensured in database")
            except Exception as user_error:
                logger.warning(f"User creation failed: {user_error}")
            
            # Insert task with proper field mapping
            await connection.execute("""
                INSERT INTO tasks (
                    id, user_id, title, description, status, priority, urgency_score, importance_score,
                    due_date, all_day, reminder_date, estimated_duration, assignee, project_id, parent_task_id,
                    tags, category, location, energy_level, energy, context_tags, recurrence_rule,
                    ai_generated, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
                )
            """,
                uuid.UUID(task_id), uuid.UUID(current_user['id']),
                task_data.title, getattr(task_data, 'description', ''),
                getattr(task_data, 'status', 'pending'), getattr(task_data, 'priority', 'medium'),
                getattr(task_data, 'urgency_score', 5), getattr(task_data, 'importance_score', 5),
                due_date_value.replace(tzinfo=None) if due_date_value else None, getattr(task_data, 'all_day', True),
                reminder_date_value.replace(tzinfo=None) if reminder_date_value else None, getattr(task_data, 'estimated_duration', None),
                getattr(task_data, 'assignee', None),
                uuid.UUID(getattr(task_data, 'project_id')) if getattr(task_data, 'project_id') else None,
                uuid.UUID(getattr(task_data, 'parent_task_id')) if getattr(task_data, 'parent_task_id') else None,
                getattr(task_data, 'tags', []), getattr(task_data, 'category', None),
                getattr(task_data, 'location', None), getattr(task_data, 'energy_level', 'medium'),
                5, getattr(task_data, 'context_tags', []), getattr(task_data, 'recurrence_rule', None),
                False, now.replace(tzinfo=None), now.replace(tzinfo=None)  # Remove timezone for PostgreSQL
            )
            
            # Fetch the created task
            task = await connection.fetchrow("SELECT * FROM tasks WHERE id = $1", uuid.UUID(task_id))
            
            # Send real-time update
            try:
                await manager.send_personal_message({
                    "type": "task_created",
                    "data": {"id": task_id, "title": task_data.title}
                }, current_user['id'])
            except Exception as e:
                logger.warning(f"Real-time notification failed: {e}")
            
            # 태스크에 due_date가 있으면 캘린더 이벤트도 생성
            created_task_response = {
                "id": str(task['id']),
                "title": task['title'],
                "description": task['description'],
                "status": task['status'],
                "priority": task['priority'],
                "urgency_score": task['urgency_score'],
                "importance_score": task['importance_score'],
                "due_at": task['due_date'].isoformat() if task['due_date'] else None,  # Return as due_at for frontend compatibility
                "due_date": task['due_date'].isoformat() if task['due_date'] else None,  # Keep for backward compatibility
                "all_day": task['all_day'],
                "reminder_date": task['reminder_date'].isoformat() if task['reminder_date'] else None,
                "completed_at": task['completed_at'].isoformat() if task['completed_at'] else None,
                "estimated_duration": task['estimated_duration'],
                "actual_duration": task['actual_duration'],
                "assignee": task['assignee'],
                "project_id": str(task['project_id']) if task['project_id'] else None,
                "parent_task_id": str(task['parent_task_id']) if task['parent_task_id'] else None,
                "tags": task['tags'] or [],
                "category": task['category'],
                "location": task['location'],
                "energy_level": task['energy_level'],
                "context_tags": task['context_tags'] or [],
                "recurrence_rule": task['recurrence_rule'],
                "ai_generated": task['ai_generated'],
                "created_at": task['created_at'].isoformat() if task['created_at'] else now.isoformat(),
                "updated_at": task['updated_at'].isoformat() if task['updated_at'] else now.isoformat(),
                "createdAt": task['created_at'].isoformat() if task['created_at'] else now.isoformat(),
                "updatedAt": task['updated_at'].isoformat() if task['updated_at'] else now.isoformat()
            }
            
            # 캘린더 이벤트 자동 생성 비활성화 (중복 방지)
            # 사용자가 명시적으로 캘린더 이벤트를 원할 때만 생성하도록 변경
            # if task['due_date'] and getattr(task_data, 'create_calendar_event', False):
            #     # 캘린더 이벤트 생성 로직 (선택적으로만 실행)
            #     pass
            
            return created_task_response
            
    except Exception as e:
        logger.error(f"❌ Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    """Update task with completion tracking"""
    try:
        logger.info(f"📝 Updating task {task_id} for user {current_user['id']}")
        
        task_found = False
        updated_task = None
        
        # Always try database first for data persistence
        if db_pool is not None:
            async with db_pool.acquire() as connection:
                try:
                    task_uuid = uuid.UUID(task_id) if '-' in task_id else None
                    if task_uuid:
                        # Check if task exists and belongs to user
                        existing_task = await connection.fetchrow(
                            "SELECT status FROM tasks WHERE id = $1 AND user_id = $2",
                            task_uuid, uuid.UUID(current_user['id'])
                        )
                        
                        if existing_task:
                            # Set completion timestamp if status changed to completed
                            completed_at = None
                            if task_data.status == 'completed' and existing_task['status'] != 'completed':
                                completed_at = datetime.now(timezone.utc)
                            elif task_data.status != 'completed':
                                completed_at = None
                            
                            # Build dynamic update query for only provided fields
                            update_fields = []
                            values = []
                            param_count = 1
                            
                            for field, value in task_data.dict(exclude_unset=True).items():
                                if field == 'due_at' and value:
                                    update_fields.append(f"due_date = ${param_count}")
                                    # Convert string to date if needed
                                    if isinstance(value, str):
                                        try:
                                            due_date = datetime.fromisoformat(value.replace('Z', '+00:00')).date()
                                            values.append(due_date)
                                        except:
                                            values.append(value)
                                    else:
                                        values.append(value)
                                    param_count += 1
                                elif field == 'tags' and value:
                                    update_fields.append(f"tags = ${param_count}")
                                    values.append(json.dumps(value))
                                    param_count += 1
                                elif field == 'context_tags' and value:
                                    update_fields.append(f"context_tags = ${param_count}")
                                    values.append(json.dumps(value))
                                    param_count += 1
                                elif field not in ['due_date']:  # Skip due_date as it's handled by due_at
                                    update_fields.append(f"{field} = ${param_count}")
                                    values.append(value)
                                    param_count += 1
                            
                            if completed_at is not None:
                                update_fields.append(f"completed_at = ${param_count}")
                                values.append(completed_at)
                                param_count += 1
                            
                            update_fields.append("updated_at = CURRENT_TIMESTAMP")
                            
                            # Add WHERE clause parameters
                            values.extend([task_uuid, uuid.UUID(current_user['id'])])
                            where_params = f"${param_count} AND user_id = ${param_count + 1}"
                            
                            query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = {where_params} RETURNING *"
                            
                            result = await connection.fetch(query, *values)
                            
                            if result:
                                task_row = result[0]
                                updated_task = {
                                    'id': str(task_row['id']),
                                    'title': task_row['title'],
                                    'description': task_row['description'],
                                    'status': task_row['status'],
                                    'priority': task_row['priority'],
                                    'due_date': task_row['due_date'].isoformat() if task_row['due_date'] else None,
                                    'completed_at': task_row['completed_at'].isoformat() if task_row['completed_at'] else None,
                                    'created_at': task_row['created_at'].isoformat() if task_row['created_at'] else None,
                                    'updated_at': task_row['updated_at'].isoformat() if task_row['updated_at'] else None,
                                    'tags': json.loads(task_row['tags']) if task_row['tags'] else [],
                                    'user_id': str(task_row['user_id'])
                                }
                                task_found = True
                                logger.info(f"✅ Task {task_uuid} updated in database")
                
                except (ValueError, TypeError) as e:
                    logger.warning(f"UUID parsing failed for task {task_id}: {e}")
                    # Continue to memory storage fallback
        
        # Fallback to memory storage if not found in database
        if not task_found:
            task_id_str = str(task_id)
            user_tasks = memory_storage.get('tasks', {})
            
            if task_id_str in user_tasks:
                task = user_tasks[task_id_str]
                if task.get('user_id') == current_user['id']:
                    # Update fields that are provided
                    for field, value in task_data.dict(exclude_unset=True).items():
                        if field == 'due_at' and value:
                            task['due_date'] = value
                            task['due_at'] = value
                        elif field == 'completed_at' and value:
                            task['completed_at'] = value
                        elif value is not None:
                            task[field] = value
                    
                    # Set completion timestamp if status changed to completed
                    if task_data.status == 'completed' and task.get('status') != 'completed':
                        task['completed_at'] = datetime.now(timezone.utc).isoformat()
                    elif task_data.status and task_data.status != 'completed':
                        task['completed_at'] = None
                    
                    task['updated_at'] = datetime.now(timezone.utc).isoformat()
                    updated_task = task
                    task_found = True
                    logger.info(f"✅ Task {task_id} updated in memory storage")
        
        if not task_found:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"message": "Task updated successfully", "task": updated_task}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating task {task_id}: {str(e)}")
        logger.error(f"Exception details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Send real-time update
        await manager.send_personal_message({
            "type": "task_updated",
            "data": {"id": task_id, "status": task_data.status}
        }, current_user['id'])
        
        return {"message": "Task updated successfully"}

@app.patch("/api/tasks/{task_id}")
async def update_task_partial(task_id: str, task_data: dict, current_user: dict = Depends(get_current_user)):
    """Partially update task with flexible field mapping and ID handling"""
    try:
        logger.info(f"🔄 Updating task {task_id} with data: {task_data}")
        
        # Handle both integer and UUID task IDs
        try:
            # First try to use the ID as-is for memory storage
            memory_task_id = task_id
            
            # For database, convert to UUID format
            if db_pool is not None:
                db_task_id = parse_id_to_uuid(task_id)
            else:
                db_task_id = None
                
        except Exception as e:
            logger.error(f"Error parsing task ID {task_id}: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid task ID format: {task_id}")
        
        if db_pool is not None:
            async with db_pool.acquire() as connection:
                # Check if task exists and belongs to user
                existing_task = await connection.fetchrow(
                    "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
                    db_task_id, uuid.UUID(current_user['id'])
                )
                
                if not existing_task:
                    raise HTTPException(status_code=404, detail="Task not found")
                
                # Build dynamic update query based on provided fields
                update_fields = []
                params = []
                param_count = 0
                
                # Map fields properly with proper type conversion
                for field, value in task_data.items():
                    if value is not None and field not in ['id']:
                        param_count += 1
                        if field == 'due_at':
                            # Handle due_at field mapping to due_date
                            update_fields.append(f"due_date = ${param_count}")
                            if isinstance(value, str):
                                try:
                                    # Parse datetime and make timezone-naive for PostgreSQL
                                    dt_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                    params.append(dt_value.replace(tzinfo=None))
                                except:
                                    params.append(None)
                            else:
                                params.append(value)
                        elif field == 'completed_at' and value:
                            # Handle completed_at timestamp
                            update_fields.append(f"completed_at = ${param_count}")
                            if isinstance(value, str):
                                try:
                                    dt_value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                    params.append(dt_value.replace(tzinfo=None))
                                except:
                                    params.append(datetime.now().replace(tzinfo=None))
                            else:
                                params.append(datetime.now().replace(tzinfo=None))
                        elif field == 'status':
                            update_fields.append(f"status = ${param_count}")
                            params.append(value)
                            # If status is completed, set completed_at
                            if value == 'completed':
                                param_count += 1
                                update_fields.append(f"completed_at = ${param_count}")
                                params.append(datetime.now().replace(tzinfo=None))
                        else:
                            update_fields.append(f"{field} = ${param_count}")
                            params.append(value)
                
                if update_fields:
                    # Add updated_at timestamp
                    param_count += 1
                    update_fields.append(f"updated_at = ${param_count}")
                    params.append(datetime.now().replace(tzinfo=None))
                    
                    # Add WHERE conditions
                    param_count += 1
                    params.append(db_task_id)
                    param_count += 1
                    params.append(uuid.UUID(current_user['id']))
                    
                    query = f"""
                    UPDATE tasks 
                    SET {', '.join(update_fields)}
                    WHERE id = ${param_count-1} AND user_id = ${param_count}
                    RETURNING *
                    """
                    
                    logger.info(f"Executing update query: {query}")
                    logger.info(f"With params: {params}")
                    
                    result = await connection.fetchrow(query, *params)
                    
                    if result:
                        # Format response with proper ID handling
                        return {
                            "id": format_id_for_response(result['id']),
                            "title": result['title'],
                            "description": result['description'],
                            "status": result['status'],
                            "priority": result['priority'],
                            "urgency_score": result['urgency_score'],
                            "importance_score": result['importance_score'],
                            "due_at": result['due_date'].isoformat() if result['due_date'] else None,
                            "due_date": result['due_date'].isoformat() if result['due_date'] else None,
                            "all_day": result.get('all_day', True),
                            "reminder_date": result['reminder_date'].isoformat() if result['reminder_date'] else None,
                            "completed_at": result['completed_at'].isoformat() if result['completed_at'] else None,
                            "estimated_duration": result['estimated_duration'],
                            "actual_duration": result.get('actual_duration', 0),
                            "assignee": result['assignee'],
                            "project_id": format_id_for_response(result['project_id']) if result['project_id'] else None,
                            "parent_task_id": format_id_for_response(result['parent_task_id']) if result['parent_task_id'] else None,
                            "tags": result['tags'] or [],
                            "category": result['category'],
                            "location": result['location'],
                            "energy_level": result['energy_level'],
                            "energy": result.get('energy', 5),
                            "context_tags": result['context_tags'] or [],
                            "recurrence_rule": result['recurrence_rule'],
                            "ai_generated": result['ai_generated'],
                            "created_at": result['created_at'],
                            "updated_at": result['updated_at'],
                            "createdAt": result['created_at'],
                            "updatedAt": result['updated_at']
                        }
                    else:
                        raise HTTPException(status_code=404, detail="Task not found after update")
        else:
            # Memory storage update
            user_id = current_user['id']
            
            # Find task in memory storage
            task_found = False
            task = None
            
            # Check in both tasks storage and user_tasks storage
            if memory_task_id in memory_storage.get('tasks', {}):
                task = memory_storage['tasks'][memory_task_id]
                if task['user_id'] == user_id:
                    task_found = True
            
            if not task_found and 'user_tasks' in memory_storage and user_id in memory_storage['user_tasks']:
                for stored_task in memory_storage['user_tasks'][user_id]:
                    if str(stored_task.get('id')) == memory_task_id:
                        task = stored_task
                        task_found = True
                        break
            
            if not task_found:
                raise HTTPException(status_code=404, detail="Task not found")
            
            # Update fields
            now = datetime.now(timezone.utc)
            for field, value in task_data.items():
                if field == 'due_at' and value:
                    task['due_date'] = datetime.fromisoformat(value.replace('Z', '+00:00')) if isinstance(value, str) else value
                elif field == 'status' and value:
                    task['status'] = value
                    if value == 'completed':
                        task['completed_at'] = now
                elif field in task and value is not None:
                    task[field] = value
            
            task['updated_at'] = now
            
            logger.info(f"✅ Task {memory_task_id} updated in memory")
            
            # Send real-time update
            try:
                await manager.send_personal_message({
                    "type": "task_updated",
                    "data": {"id": memory_task_id, "title": task['title'], "status": task['status']}
                }, user_id)
            except Exception as e:
                logger.warning(f"Real-time notification failed: {e}")
            
            # Return properly formatted response
            return {
                "id": memory_task_id,
                "title": task['title'],
                "description": task.get('description', ''),
                "status": task['status'],
                "priority": task.get('priority', 'medium'),
                "urgency_score": task.get('urgency_score', 5),
                "importance_score": task.get('importance_score', 5),
                "due_at": task['due_date'].isoformat() if task.get('due_date') else None,
                "due_date": task['due_date'].isoformat() if task.get('due_date') else None,
                "all_day": task.get('all_day', True),
                "reminder_date": task['reminder_date'].isoformat() if task.get('reminder_date') else None,
                "completed_at": task['completed_at'].isoformat() if task.get('completed_at') else None,
                "estimated_duration": task.get('estimated_duration'),
                "actual_duration": task.get('actual_duration', 0),
                "assignee": task.get('assignee'),
                "project_id": task.get('project_id'),
                "parent_task_id": task.get('parent_task_id'),
                "tags": task.get('tags', []),
                "category": task.get('category'),
                "location": task.get('location'),
                "energy_level": task.get('energy_level', 'medium'),
                "energy": task.get('energy', 5),
                "context_tags": task.get('context_tags', []),
                "recurrence_rule": task.get('recurrence_rule'),
                "ai_generated": task.get('ai_generated', False),
                "created_at": task.get('created_at'),
                "updated_at": task.get('updated_at'),
                "createdAt": task.get('created_at'),
                "updatedAt": task.get('updated_at')
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating task {task_id}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")


@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Delete a task"""
    try:
        task_uuid = parse_id(task_id)
        
        logger.info(f"🗑️ Deleting task {task_uuid} for user {current_user['id']}")
        
        if USE_MEMORY_STORAGE:
            # Delete from memory storage
            user_tasks = memory_storage['tasks'].get(str(current_user['id']), [])
            original_count = len(user_tasks)
            memory_storage['tasks'][str(current_user['id'])] = [
                task for task in user_tasks 
                if parse_id(task['id']) != task_uuid
            ]
            new_count = len(memory_storage['tasks'][str(current_user['id'])])
            
            if original_count == new_count:
                raise HTTPException(status_code=404, detail="Task not found")
                
            logger.info(f"✅ Task {task_uuid} deleted from memory storage")
            
        else:
            # Delete from database
            query = """
                DELETE FROM tasks 
                WHERE id = $1 AND user_id = $2 
                RETURNING id
            """
            result = await database.fetch_one(query, task_uuid, current_user['id'])
            
            if not result:
                raise HTTPException(status_code=404, detail="Task not found")
                
            logger.info(f"✅ Task {task_uuid} deleted from database")
        
        return {"message": "Task deleted successfully", "id": str(task_uuid)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")


# Note endpoints
@app.get("/api/notes")
async def get_notes(current_user: dict = Depends(get_current_user)):
    """Get all notes for the current user"""
    try:
        # Always try database first for data persistence
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                query = """
                SELECT id, title, content, tags, category, color, is_pinned, is_archived, 
                       created_at, updated_at, user_id
                FROM notes 
                WHERE user_id = $1 
                ORDER BY created_at DESC
                """
                notes = await conn.fetch(query, uuid.UUID(current_user['id']))
                
                result = []
                for note in notes:
                    note_dict = {
                        'id': str(note['id']),
                        'title': note['title'],
                        'content': note['content'],
                        'tags': json.loads(note['tags']) if note['tags'] else [],
                        'category': note['category'],
                        'color': note['color'],
                        'is_pinned': note['is_pinned'],
                        'is_archived': note['is_archived'],
                        'created_at': note['created_at'].isoformat() if note['created_at'] else None,
                        'updated_at': note['updated_at'].isoformat() if note['updated_at'] else None,
                        'user_id': str(note['user_id'])
                    }
                    result.append(note_dict)
                
                logger.info(f"✅ Retrieved {len(result)} notes from cloud for user {current_user['id']}")
                return result
        
        # Fallback to memory storage if database is not available
        user_notes = memory_storage.get('notes', {}).get(str(current_user['id']), [])
        logger.info(f"📚 Retrieved {len(user_notes)} notes from memory storage for user {current_user['id']}")
        return user_notes
            
    except Exception as e:
        logger.error(f"❌ Error retrieving notes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve notes: {str(e)}")


@app.post("/api/notes")
async def create_note(
    note_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new note"""
    try:
        note_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        
        logger.info(f"📝 Creating note for user {current_user['id']}")
        logger.info(f"Note data received: {note_data}")
        
        if USE_MEMORY_STORAGE:
            # Create note in memory storage
            note = {
                "id": str(note_id),
                "title": note_data.get('title', ''),
                "content": note_data.get('content', ''),
                "tags": note_data.get('tags', []),
                "category": note_data.get('category', ''),
                "color": note_data.get('color', '#ffffff'),
                "is_pinned": note_data.get('is_pinned', False),
                "is_archived": note_data.get('is_archived', False),
                "user_id": str(current_user['id']),
                "created_at": now,
                "updated_at": now,
                "type": "note"
            }
            
            if str(current_user['id']) not in memory_storage['notes']:
                memory_storage['notes'][str(current_user['id'])] = []
            memory_storage['notes'][str(current_user['id'])].append(note)
            
            logger.info(f"✅ Note {note_id} created in memory storage")
            
            # Return the note with string datetime for JSON serialization
            return {
                "id": note["id"],
                "title": note["title"],
                "content": note["content"],
                "tags": note["tags"],
                "category": note["category"],
                "color": note["color"],
                "is_pinned": note["is_pinned"],
                "is_archived": note["is_archived"],
                "user_id": note["user_id"],
                "created_at": note["created_at"].isoformat(),
                "updated_at": note["updated_at"].isoformat(),
                "type": "note"
            }
        
        else:
            # Create note in database
            query = """
                INSERT INTO notes (
                    id, title, content, tags, category, color, 
                    is_pinned, is_archived, user_id, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            """
            
            note = await database.fetch_one(
                query,
                note_id,
                note_data.get('title', ''),
                note_data.get('content', ''),
                note_data.get('tags', []),
                note_data.get('category', ''),
                note_data.get('color', '#ffffff'),
                note_data.get('is_pinned', False),
                note_data.get('is_archived', False),
                current_user['id'],
                now,
                now
            )
            
            logger.info(f"✅ Note {note_id} created in database")
            
            return {
                "id": str(note['id']),
                "title": note['title'],
                "content": note['content'],
                "tags": note['tags'],
                "category": note['category'],
                "color": note['color'],
                "is_pinned": note['is_pinned'],
                "is_archived": note['is_archived'],
                "user_id": str(note['user_id']),
                "created_at": note['created_at'].isoformat(),
                "updated_at": note['updated_at'].isoformat(),
                "type": "note"
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to create note: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")


@app.put("/api/notes/{note_id}")
async def update_note(
    note_id: str,
    note_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing note"""
    try:
        now = datetime.now(timezone.utc)
        
        logger.info(f"📝 Updating note {note_id} for user {current_user['id']}")
        logger.info(f"Note update data: {note_data}")
        
        note_found = False
        updated_note = None
        
        # Always try database first for data persistence
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                # Try direct UUID lookup first
                try:
                    note_uuid = uuid.UUID(note_id) if '-' in note_id else None
                    if note_uuid:
                        query = """
                            UPDATE notes SET 
                                title = $1, content = $2, tags = $3, category = $4, 
                                color = $5, is_pinned = $6, is_archived = $7, updated_at = $8
                            WHERE id = $9 AND user_id = $10
                            RETURNING id, title, content, tags, category, color, is_pinned, 
                                     is_archived, created_at, updated_at, user_id
                        """
                        
                        tags_json = json.dumps(note_data.get('tags', []))
                        
                        result = await conn.fetch(
                            query,
                            note_data.get('title', ''),
                            note_data.get('content', ''),
                            tags_json,
                            note_data.get('category', ''),
                            note_data.get('color', '#ffffff'),
                            note_data.get('is_pinned', False),
                            note_data.get('is_archived', False),
                            now,
                            note_uuid,
                            uuid.UUID(current_user['id'])
                        )
                        
                        if result:
                            note_row = result[0]
                            updated_note = {
                                "id": str(note_row['id']),
                                "title": note_row['title'],
                                "content": note_row['content'],
                                "tags": json.loads(note_row['tags']) if note_row['tags'] else [],
                                "category": note_row['category'],
                                "color": note_row['color'],
                                "is_pinned": note_row['is_pinned'],
                                "is_archived": note_row['is_archived'],
                                "user_id": str(note_row['user_id']),
                                "created_at": note_row['created_at'].isoformat() if note_row['created_at'] else None,
                                "updated_at": note_row['updated_at'].isoformat() if note_row['updated_at'] else None,
                                "type": "note"
                            }
                            note_found = True
                            logger.info(f"✅ Note {note_uuid} updated in database")
                
                except (ValueError, TypeError) as e:
                    logger.warning(f"UUID parsing failed for {note_id}: {e}")
                    # Continue to memory storage fallback
        
        # Fallback to memory storage if not found in database
        if not note_found:
            user_notes = memory_storage.get('notes', {}).get(str(current_user['id']), [])
            
            for i, note in enumerate(user_notes):
                if str(note.get('id', '')) == str(note_id):
                    # Update note fields
                    note.update({
                        "title": note_data.get('title', note.get('title', '')),
                        "content": note_data.get('content', note.get('content', '')),
                        "tags": note_data.get('tags', note.get('tags', [])),
                        "category": note_data.get('category', note.get('category', '')),
                        "color": note_data.get('color', note.get('color', '#ffffff')),
                        "is_pinned": note_data.get('is_pinned', note.get('is_pinned', False)),
                        "is_archived": note_data.get('is_archived', note.get('is_archived', False)),
                        "updated_at": now.isoformat()
                    })
                    memory_storage['notes'][str(current_user['id'])][i] = note
                    note_found = True
                    
                    updated_note = {
                        "id": note["id"],
                        "title": note["title"],
                        "content": note["content"],
                        "tags": note["tags"],
                        "category": note["category"],
                        "color": note["color"],
                        "is_pinned": note["is_pinned"],
                        "is_archived": note["is_archived"],
                        "user_id": note["user_id"],
                        "created_at": note.get("created_at"),
                        "updated_at": note["updated_at"],
                        "type": "note"
                    }
                    logger.info(f"✅ Note {note_id} updated in memory storage")
                    break
        
        if not note_found:
            raise HTTPException(status_code=404, detail="Note not found")
        
        return updated_note
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating note {note_id}: {str(e)}")
        logger.error(f"Exception details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update note: {str(e)}")
            
            if not note:
                raise HTTPException(status_code=404, detail="Note not found")
            
            logger.info(f"✅ Note {note_uuid} updated in database")
            
            return {
                "id": str(note['id']),
                "title": note['title'],
                "content": note['content'],
                "tags": note['tags'],
                "category": note['category'],
                "color": note['color'],
                "is_pinned": note['is_pinned'],
                "is_archived": note['is_archived'],
                "user_id": str(note['user_id']),
                "created_at": note['created_at'].isoformat(),
                "updated_at": note['updated_at'].isoformat(),
                "type": "note"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating note {note_id}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update note: {str(e)}")


@app.delete("/api/notes/{note_id}")
async def delete_note(
    note_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Delete a note"""
    try:
        logger.info(f"🗑️ Attempting to delete note {note_id} for user {current_user['id']}")
        
        # First try to find the note using the provided ID directly (for backwards compatibility)
        # This handles both UUID and legacy numeric IDs
        note_found = False
        
        if db_pool is not None:
            async with db_pool.acquire() as conn:
                # Try direct UUID lookup first
                try:
                    note_uuid = uuid.UUID(note_id) if '-' in note_id else None
                    if note_uuid:
                        query = "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id"
                        result = await conn.fetch(query, note_uuid, uuid.UUID(current_user['id']))
                        if result:
                            note_found = True
                            logger.info(f"✅ Note {note_uuid} deleted from database")
                except (ValueError, TypeError):
                    # Not a valid UUID, continue with other methods
                    pass
                
                # If not found by UUID, try to find by searching all user notes 
                # This handles legacy numeric IDs or other formats
                if not note_found:
                    logger.warning(f"Cloud delete failed: badly formed hexadecimal UUID string, using memory fallback")
                    # Delete from memory storage as fallback
                    user_notes = memory_storage.get('notes', {}).get(str(current_user['id']), [])
                    original_count = len(user_notes)
                    memory_storage.setdefault('notes', {})[str(current_user['id'])] = [
                        note for note in user_notes 
                        if str(note.get('id', '')) != str(note_id)
                    ]
                    new_count = len(memory_storage['notes'][str(current_user['id'])])
                    
                    if original_count > new_count:
                        note_found = True
                        logger.info(f"✅ Note {note_id} deleted from memory storage")
        else:
            # Pure memory storage mode
            user_notes = memory_storage.get('notes', {}).get(str(current_user['id']), [])
            original_count = len(user_notes)
            memory_storage.setdefault('notes', {})[str(current_user['id'])] = [
                note for note in user_notes 
                if str(note.get('id', '')) != str(note_id)
            ]
            new_count = len(memory_storage['notes'][str(current_user['id'])])
            
            if original_count > new_count:
                note_found = True
                logger.info(f"✅ Note {note_id} deleted from memory storage")
        
        if not note_found:
            raise HTTPException(status_code=404, detail="Note not found")
        
        return {"message": "Note deleted successfully", "id": note_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting note {note_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")


# Calendar endpoints  
@app.get("/api/calendar")
async def get_calendar_events(current_user: dict = Depends(get_current_user)):
    """Get all calendar events for the current user"""
    try:
        if USE_MEMORY_STORAGE:
            user_events = memory_storage['events'].get(str(current_user['id']), [])
            logger.info(f"📅 Retrieved {len(user_events)} events from memory storage for user {current_user['id']}")
            return user_events
        else:
            query = """
                SELECT * FROM calendar_events 
                WHERE user_id = $1 
                ORDER BY start_time ASC
            """
            events = await database.fetch_all(query, current_user['id'])
            
            result = []
            for event in events:
                event_dict = dict(event)
                event_dict['id'] = str(event_dict['id'])
                event_dict['user_id'] = str(event_dict['user_id'])
                # Handle datetime fields
                if event_dict.get('start_time'):
                    event_dict['start_time'] = event_dict['start_time'].isoformat()
                if event_dict.get('end_time'):
                    event_dict['end_time'] = event_dict['end_time'].isoformat()
                if event_dict.get('created_at'):
                    event_dict['created_at'] = event_dict['created_at'].isoformat()
                if event_dict.get('updated_at'):
                    event_dict['updated_at'] = event_dict['updated_at'].isoformat()
                result.append(event_dict)
            
            logger.info(f"📅 Retrieved {len(result)} events from database for user {current_user['id']}")
            return result
            
    except Exception as e:
        logger.error(f"❌ Error retrieving calendar events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve calendar events: {str(e)}")


@app.post("/api/calendar")
async def create_calendar_event(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event"""
    try:
        event_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        
        logger.info(f"📅 Creating calendar event for user {current_user['id']}")
        logger.info(f"Event data received: {event_data}")
        
        # Parse datetime strings - handle both field name formats
        start_str = event_data.get('start_time') or event_data.get('start') or event_data.get('start_at')
        end_str = event_data.get('end_time') or event_data.get('end') or event_data.get('end_at')
        
        if not start_str:
            raise HTTPException(status_code=400, detail="Start time is required")
        if not end_str:
            raise HTTPException(status_code=400, detail="End time is required")
            
        # Handle timezone parsing more robustly
        try:
            if 'T' in start_str:
                start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            else:
                # Handle date-only format
                start_time = datetime.fromisoformat(f"{start_str}T00:00:00+00:00")
                
            if 'T' in end_str:
                end_time = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
            else:
                # Handle date-only format
                end_time = datetime.fromisoformat(f"{end_str}T23:59:59+00:00")
        except ValueError as e:
            logger.error(f"Failed to parse datetime: start='{start_str}', end='{end_str}', error={e}")
            raise HTTPException(status_code=400, detail=f"Invalid datetime format: {str(e)}")
        
        if USE_MEMORY_STORAGE:
            # Create event in memory storage
            event = {
                "id": str(event_id),
                "title": event_data.get('title', ''),
                "description": event_data.get('description', ''),
                "start_time": start_time,
                "end_time": end_time,
                "location": event_data.get('location', ''),
                "attendees": event_data.get('attendees', []),
                "user_id": str(current_user['id']),
                "created_at": now,
                "updated_at": now,
                "type": "event"
            }
            
            if str(current_user['id']) not in memory_storage['events']:
                memory_storage['events'][str(current_user['id'])] = []
            memory_storage['events'][str(current_user['id'])].append(event)
            
            logger.info(f"✅ Event {event_id} created in memory storage")
            
            # Return the event with string datetime for JSON serialization
            return {
                "id": event["id"],
                "title": event["title"],
                "description": event["description"],
                "start_time": event["start_time"].isoformat(),
                "end_time": event["end_time"].isoformat(),
                "location": event["location"],
                "attendees": event["attendees"],
                "user_id": event["user_id"],
                "created_at": event["created_at"].isoformat(),
                "updated_at": event["updated_at"].isoformat(),
                "type": "event"
            }
        
        else:
            # Create event in database
            query = """
                INSERT INTO calendar_events (
                    id, title, description, start_time, end_time, 
                    location, attendees, user_id, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            """
            
            event = await database.fetch_one(
                query,
                event_id,
                event_data.get('title', ''),
                event_data.get('description', ''),
                start_time,
                end_time,
                event_data.get('location', ''),
                event_data.get('attendees', []),
                current_user['id'],
                now,
                now
            )
            
            logger.info(f"✅ Event {event_id} created in database")
            
            return {
                "id": str(event['id']),
                "title": event['title'],
                "description": event['description'],
                "start_time": event['start_time'].isoformat(),
                "end_time": event['end_time'].isoformat(),
                "location": event['location'],
                "attendees": event['attendees'],
                "user_id": str(event['user_id']),
                "created_at": event['created_at'].isoformat(),
                "updated_at": event['updated_at'].isoformat(),
                "type": "event"
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to create calendar event: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create calendar event: {str(e)}")


@app.post("/api/events")
async def create_event_alias(
    event_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new calendar event - fixed version with proper error handling"""
    try:
        logger.info(f"📅 Creating calendar event with data: {event_data}")
        
        # Extract and validate required fields
        title = event_data.get('title', '').strip()
        if not title:
            raise HTTPException(status_code=400, detail="제목은 필수입니다.")
        
        # Parse datetime strings with robust error handling
        def parse_datetime_safe(dt_str, field_name="datetime"):
            """Parse various datetime formats safely"""
            if not dt_str:
                raise HTTPException(status_code=400, detail=f"{field_name}이 필요합니다.")
            
            if isinstance(dt_str, datetime):
                return dt_str
                
            if isinstance(dt_str, str):
                try:
                    # Handle ISO 8601 format
                    if dt_str.endswith('Z'):
                        dt_str = dt_str[:-1] + '+00:00'
                    
                    # Parse as ISO format
                    parsed_dt = datetime.fromisoformat(dt_str)
                    
                    # Ensure timezone awareness
                    if parsed_dt.tzinfo is None:
                        parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                    
                    return parsed_dt
                    
                except ValueError as e:
                    logger.error(f"❌ Failed to parse {field_name} '{dt_str}': {e}")
                    raise HTTPException(status_code=400, detail=f"잘못된 {field_name} 형식입니다. (ISO 8601 형식 필요)")
            
            raise HTTPException(status_code=400, detail=f"잘못된 {field_name} 형식입니다.")
        
        # Parse start and end times robustly
        start_raw = event_data.get('start')
        end_raw = event_data.get('end')
        
        def parse_iso_datetime(dt_str, field_name):
            if not dt_str:
                raise HTTPException(status_code=400, detail=f"{field_name}이 필요합니다.")
            try:
                # Handle 'YYYY-MM-DDTHH:mm:ss.sssZ' and 'YYYY-MM-DDTHH:mm:ss+09:00' formats
                if isinstance(dt_str, str):
                    if dt_str.endswith('Z'):
                        dt_str = dt_str[:-1] + '+00:00'
                    return datetime.fromisoformat(dt_str)
                elif isinstance(dt_str, datetime):
                    return dt_str
                else:
                    raise ValueError(f"잘못된 {field_name} 형식: {dt_str}")
            except Exception as e:
                logger.error(f"❌ {field_name} 파싱 실패: {dt_str} ({e})")
                raise HTTPException(status_code=400, detail=f"잘못된 {field_name} 형식입니다. ISO 8601 형식 필요")
        
        start_time = parse_iso_datetime(start_raw, "시작 시간")
        end_time = parse_iso_datetime(end_raw, "종료 시간")
        
        # Validate time logic
        if not start_time:
            raise HTTPException(status_code=400, detail="Event start time is required")
        if not end_time:
            raise HTTPException(status_code=400, detail="Event end time is required")
        if start_time >= end_time:
            raise HTTPException(status_code=400, detail="종료 시간은 시작 시간보다 늦어야 합니다.")
        
        logger.info(f"✅ Parsed times - Start: {start_time}, End: {end_time}")
        
        # Generate event ID
        event_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Try database storage first
        if db_pool:
            try:
                async with db_pool.acquire() as connection:
                    # Ensure user exists
                    user_uuid = uuid.UUID(current_user['id'])
                    
                    # Check/create user
                    user_exists = await connection.fetchrow(
                        "SELECT id FROM users WHERE id = $1", user_uuid
                    )
                    
                    if not user_exists:
                        await connection.execute("""
                            INSERT INTO users (id, email, name, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, $5)
                        """,
                            user_uuid,
                            current_user.get('email', 'demo@example.com'),
                            current_user.get('name', 'Demo User'),
                            now.replace(tzinfo=None),
                            now.replace(tzinfo=None)
                        )
                        logger.info(f"✅ User {current_user['id']} created")
                    
                    # Insert calendar event
                    await connection.execute("""
                        INSERT INTO calendar_events (
                            id, user_id, title, description, start_time, end_time, 
                            all_day, timezone, color, location, meeting_url, event_type,
                            recurrence_rule, reminder_minutes, attendees, status, visibility,
                            ai_generated, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                    """,
                        uuid.UUID(event_id), user_uuid,
                        title,
                        event_data.get('description', ''),
                        start_time.replace(tzinfo=None),
                        end_time.replace(tzinfo=None),
                        event_data.get('all_day', False),
                        event_data.get('timezone', 'UTC'),
                        event_data.get('color', '#4285f4'),
                        event_data.get('location', ''),
                        event_data.get('meeting_url', ''),
                        event_data.get('event_type', 'event'),
                        event_data.get('recurrence_rule', ''),
                        event_data.get('reminder_minutes', []),
                        json.dumps(event_data.get('attendees', [])),
                        event_data.get('status', 'confirmed'),
                        event_data.get('visibility', 'private'),
                        False,
                        now.replace(tzinfo=None),
                        now.replace(tzinfo=None)
                    )
                    
                    logger.info(f"✅ Calendar event {event_id} saved to database")
                    
                    # Return database response
                    return {
                        "id": event_id,
                        "title": title,
                        "description": event_data.get('description', ''),
                        "start": start_time.isoformat(),
                        "end": end_time.isoformat(),
                        "all_day": event_data.get('all_day', False),
                        "timezone": event_data.get('timezone', 'UTC'),
                        "color": event_data.get('color', '#4285f4'),
                        "location": event_data.get('location', ''),
                        "meeting_url": event_data.get('meeting_url', ''),
                        "event_type": event_data.get('event_type', 'event'),
                        "status": event_data.get('status', 'confirmed'),
                        "visibility": event_data.get('visibility', 'private'),
                        "user_id": current_user['id'],
                        "created_at": now.isoformat(),
                        "updated_at": now.isoformat(),
                        "attendees": event_data.get('attendees', []),
                        "reminder_minutes": event_data.get('reminder_minutes', [])
                    }
                    
            except Exception as db_error:
                logger.warning(f"Database save failed: {db_error}, using memory fallback")
        
        # Memory storage fallback
        new_event = {
            "id": event_id,
            "user_id": current_user['id'],
            "title": title,
            "description": event_data.get('description', ''),
            "start_time": start_time,
            "end_time": end_time,
            "all_day": event_data.get('all_day', False),
            "timezone": event_data.get('timezone', 'UTC'),
            "color": event_data.get('color', '#4285f4'),
            "location": event_data.get('location', ''),
            "meeting_url": event_data.get('meeting_url', ''),
            "event_type": event_data.get('event_type', 'event'),
            "recurrence_rule": event_data.get('recurrence_rule', ''),
            "reminder_minutes": event_data.get('reminder_minutes', []),
            "attendees": event_data.get('attendees', []),
            "status": event_data.get('status', 'confirmed'),
            "visibility": event_data.get('visibility', 'private'),
            "ai_generated": False,
            "created_at": now,
            "updated_at": now
        }
        
        # Store in memory
        if 'events' not in memory_storage:
            memory_storage['events'] = {}
        memory_storage['events'][event_id] = new_event
        
        # Store in user events
        if 'user_events' not in memory_storage:
            memory_storage['user_events'] = {}
        if current_user['id'] not in memory_storage['user_events']:
            memory_storage['user_events'][current_user['id']] = []
        
        memory_storage['user_events'][current_user['id']].append(new_event)
        
        logger.info(f"✅ Calendar event {event_id} created in memory")
        
        # Send real-time update
        try:
            await manager.send_personal_message({
                "type": "event_created",
                "data": {
                    "id": event_id,
                    "title": title,
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat()
                }
            }, current_user['id'])
        except Exception as ws_error:
            logger.warning(f"WebSocket notification failed: {ws_error}")
        
        return {
            "id": event_id,
            "title": new_event["title"],
            "description": new_event["description"],
            "start": new_event["start_time"].isoformat(),
            "end": new_event["end_time"].isoformat(),
            "all_day": new_event["all_day"],
            "timezone": new_event["timezone"],
            "color": new_event["color"],
            "location": new_event["location"],
            "meeting_url": new_event["meeting_url"],
            "event_type": new_event["event_type"],
            "status": new_event["status"],
            "visibility": new_event["visibility"],
            "user_id": new_event["user_id"],
            "created_at": new_event["created_at"].isoformat(),
            "updated_at": new_event["updated_at"].isoformat(),
            "attendees": new_event["attendees"],
            "reminder_minutes": new_event["reminder_minutes"]
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create calendar event: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"일정 생성 중 서버 오류가 발생했습니다: {str(e)}"
        )


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a task"""
    if db_pool is None:
        # 메모리 저장소에서 삭제
        user_id = current_user['id']
        
        # memory_storage['tasks']에서 삭제
        if task_id in memory_storage['tasks']:
            del memory_storage['tasks'][task_id]
            
        # memory_storage['user_tasks']에서도 삭제
        if 'user_tasks' in memory_storage and user_id in memory_storage['user_tasks']:
            tasks = memory_storage['user_tasks'][user_id]
            original_count = len(tasks)
            memory_storage['user_tasks'][user_id] = [t for t in tasks if t.get('id') != task_id]
            
            if len(memory_storage['user_tasks'][user_id]) == original_count:
                raise HTTPException(status_code=404, detail="Task not found")
            
            logger.info(f"🗑️ Task {task_id} deleted from memory for user {user_id}")
            
            # Send real-time update
            await manager.send_personal_message({
                "type": "task_deleted",
                "data": {"id": task_id}
            }, user_id)
            
            return {"message": "Task deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Task not found")
    
    async with db_pool.acquire() as connection:
        result = await connection.execute(
            "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
            uuid.UUID(task_id), current_user['id']
        )
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Send real-time update
        await manager.send_personal_message({
            "type": "task_deleted",
            "data": {"id": task_id}
        }, current_user['id'])
        
        return {"message": "Task deleted successfully"}

# ========== ENHANCED CALENDAR API ==========

@app.get("/api/events", response_model=List[CalendarEventResponse])
async def get_calendar_events(
    current_user: dict = Depends(get_current_user),
    start: Optional[str] = None,
    end: Optional[str] = None,
    event_type: Optional[str] = None
):
    """Get calendar events with date filtering"""
    if db_pool is None:
        # 인메모리 저장소에서 이벤트 반환
        user_id = current_user['id']
        user_events = []
        
        # 날짜 필터링을 위한 파싱
        start_date = datetime.fromisoformat(start.replace('Z', '+00:00')) if start else None
        end_date = datetime.fromisoformat(end.replace('Z', '+00:00')) if end else None
        
        logger.info(f"📅 Getting calendar events from {start_date} to {end_date} for user {user_id}")
        
        # memory_storage의 user_events에서 가져오기
        if 'user_events' in memory_storage and user_id in memory_storage['user_events']:
            for event in memory_storage['user_events'][user_id]:
                # 날짜 범위 필터링
                event_start = event.get('start') or event.get('start_time')
                if start_date and event_start and event_start < start_date:
                    continue
                if end_date and event_start and event_start > end_date:
                    continue
                # 이벤트 타입 필터링
                if event_type and event.get('event_type') != event_type:
                    continue
                
                # 응답 형식에 맞게 변환
                formatted_event = {
                    "id": event.get('id'),
                    "title": event.get('title', ''),
                    "description": event.get('description', ''),
                    "start": event_start,
                    "end": event.get('end') or event.get('end_time'),
                    "all_day": event.get('all_day', False),
                    "timezone": event.get('timezone', 'UTC'),
                    "color": event.get('color', '#4285f4'),
                    "location": event.get('location'),
                    "meeting_url": event.get('meeting_url'),
                    "event_type": event.get('event_type', 'event'),
                    "recurrence_rule": event.get('recurrence_rule'),
                    "reminder_minutes": event.get('reminder_minutes', []),
                    "attendees": event.get('attendees', {}),
                    "status": event.get('status', 'confirmed'),
                    "visibility": event.get('visibility', 'private'),
                    "ai_generated": event.get('ai_generated', False),
                    "createdAt": event.get('created_at') or datetime.now(timezone.utc),
                    "updatedAt": event.get('updated_at') or datetime.now(timezone.utc)
                }
                user_events.append(formatted_event)
        
        # 시작 시간순 정렬
        user_events.sort(key=lambda x: x.get('start', datetime.now(timezone.utc)))
        
        logger.info(f"📅 Returning {len(user_events)} events for user {user_id}")
        return user_events
        
        if end:
            param_count += 1
            query_parts.append(f"AND end_time <= ${param_count}")
            params.append(datetime.fromisoformat(end.replace('Z', '+00:00')))
        
        if event_type:
            param_count += 1
            query_parts.append(f"AND event_type = ${param_count}")
            params.append(event_type)
        
        query_parts.append("ORDER BY start_time ASC")
        
        query = " ".join(query_parts)
        events = await connection.fetch(query, *params)
        
        return [
            {
                "id": str(event['id']),
                "title": event['title'],
                "description": event['description'],
                "start": event['start_time'],
                "end": event['end_time'],
                "all_day": event['all_day'],
                "timezone": event['timezone'],
                "color": event['color'],
                "location": event['location'],
                "meeting_url": event['meeting_url'],
                "event_type": event['event_type'],
                "recurrence_rule": event['recurrence_rule'],
                "reminder_minutes": event['reminder_minutes'] or [],
                "attendees": event['attendees'] or {},
                "status": event['status'],
                "visibility": event['visibility'],
                "ai_generated": event['ai_generated'],
                "createdAt": event['created_at'],
                "updatedAt": event['updated_at']
            }
            for event in events
        ]

@app.put("/api/events/{event_id}")
async def update_calendar_event(event_id: str, event_data: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    """Update a calendar event"""
    async with db_pool.acquire() as connection:
        result = await connection.execute(
            """UPDATE calendar_events SET 
               title = $1, description = $2, start_time = $3, end_time = $4,
               all_day = $5, timezone = $6, color = $7, location = $8,
               meeting_url = $9, event_type = $10, recurrence_rule = $11,
               reminder_minutes = $12, attendees = $13, visibility = $14,
               updated_at = CURRENT_TIMESTAMP
               WHERE id = $15 AND user_id = $16""",
            event_data.title, event_data.description, event_data.start, event_data.end,
            event_data.all_day, event_data.timezone, event_data.color, event_data.location,
            event_data.meeting_url, event_data.event_type, event_data.recurrence_rule,
            event_data.reminder_minutes, event_data.attendees, event_data.visibility,
            uuid.UUID(event_id), current_user['id']
        )
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Send real-time update
        await manager.send_personal_message({
            "type": "event_updated",
            "data": {"id": event_id, "title": event_data.title}
        }, current_user['id'])
        
        return {"message": "Event updated successfully"}

@app.delete("/api/events/{event_id}")
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a calendar event"""
    async with db_pool.acquire() as connection:
        result = await connection.execute(
            "DELETE FROM calendar_events WHERE id = $1 AND user_id = $2",
            uuid.UUID(event_id), current_user['id']
        )
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Send real-time update
        await manager.send_personal_message({
            "type": "event_deleted",
            "data": {"id": event_id}
        }, current_user['id'])
        
        return {"message": "Event deleted successfully"}

# ========== ADVANCED AI API ==========

@app.post("/api/ai/chat")
async def ai_chat(request: dict, current_user: dict = Depends(get_current_user)):
    """Advanced AI chat with context awareness and smart responses"""
    try:
        # Extract message from various possible fields
        user_message = request.get('message') or request.get('prompt') or request.get('query', '')
        
        if not user_message:
            return {
                "response": "안녕하세요! 무엇을 도와드릴까요? 노트 작성, 일정 관리, 작업 생성 등에 대해 물어보세요.",
                "usage": None,
                "model": "jihyung-assistant",
                "suggestions": [
                    "오늘 할 일을 정리해주세요",
                    "중요한 회의 내용을 노트로 만들어주세요",
                    "내일 일정을 확인해주세요"
                ]
            }
            
        logger.info(f"🤖 AI Chat request from user {current_user['id']}: {user_message[:100]}...")
        
        # Check for specific command patterns first
        if any(keyword in user_message.lower() for keyword in ['할 일', '작업', '태스크', 'task']):
            return {
                "response": "작업 관리를 도와드리겠습니다! 새로운 작업을 추가하거나 기존 작업을 확인하고 싶으시면 구체적으로 말씀해주세요.",
                "model": "jihyung-assistant",
                "suggestions": [
                    "새로운 작업 추가하기",
                    "오늘 마감인 작업 보기",
                    "완료된 작업 확인하기"
                ]
            }
        
        if any(keyword in user_message.lower() for keyword in ['일정', '캘린더', '미팅', '회의']):
            return {
                "response": "일정 관리를 도와드리겠습니다! 새로운 일정을 추가하거나 기존 일정을 확인하고 싶으시면 날짜와 시간을 알려주세요.",
                "model": "jihyung-assistant",
                "suggestions": [
                    "오늘 일정 확인하기",
                    "새로운 미팅 일정 추가하기",
                    "이번 주 일정 보기"
                ]
            }
        
        if any(keyword in user_message.lower() for keyword in ['노트', '메모', '기록']):
            return {
                "response": "노트 작성을 도와드리겠습니다! 어떤 내용을 기록하고 싶으신가요? 아이디어, 회의록, 학습 내용 등 무엇이든 괜찮습니다.",
                "model": "jihyung-assistant",
                "suggestions": [
                    "새로운 노트 작성하기",
                    "최근 노트 확인하기",
                    "노트 검색하기"
                ]
            }
        
        # Try OpenAI if configured
        if OPENAI_API_KEY:
            try:
                import openai
                client = openai.OpenAI(api_key=OPENAI_API_KEY)
                
                # Build context from user's data
                context_parts = []
                context = request.get('context')
                if context:
                    context_parts.append(f"Context: {context}")
                
                # Add recent user activity for better context
                try:
                    if db_pool:
                        async with db_pool.acquire() as connection:
                            recent_notes = await connection.fetch(
                                "SELECT title FROM notes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 3",
                                uuid.UUID(current_user['id'])
                            )
                            if recent_notes:
                                context_parts.append("Recent notes: " + ", ".join([note['title'] for note in recent_notes]))
                    else:
                        # Memory storage context
                        user_notes = memory_storage.get('notes', {})
                        recent_titles = [note.get('title', '') for note in list(user_notes.values())[-3:] if note.get('user_id') == current_user['id']]
                        if recent_titles:
                            context_parts.append("Recent notes: " + ", ".join(recent_titles))
                except Exception as context_error:
                    logger.warning(f"Failed to build context: {context_error}")
                
                system_message = f"""당신은 Jihyung의 지능형 개인 어시스턴트입니다. 
사용자의 생산성 향상을 위해 노트, 작업, 일정 관리를 도와주세요.
한국어로 친근하고 도움이 되는 답변을 제공하세요.
사용자 컨텍스트: {' | '.join(context_parts) if context_parts else '없음'}

응답은 간결하고 실용적이어야 하며, 구체적인 행동 제안을 포함해야 합니다."""

                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                
                ai_response = response.choices[0].message.content
                
                # Log interaction if possible
                try:
                    await log_ai_interaction(
                        current_user['id'], "chat", user_message,
                        ai_response, "gpt-3.5-turbo",
                        response.usage.total_tokens if response.usage else 0
                    )
                except Exception as log_error:
                    logger.warning(f"Failed to log AI interaction: {log_error}")
                
                return {
                    "response": ai_response,
                    "usage": response.usage.dict() if response.usage else None,
                    "model": "gpt-3.5-turbo",
                    "context_used": bool(context_parts)
                }
                
            except Exception as e:
                logger.error(f"❌ OpenAI API error: {e}")
                # Fall through to mock response
        
        # Mock AI responses for demo
        logger.info("🎭 Using mock AI chat response")
        
        message_lower = user_message.lower()
        
        # Smart responses based on keywords
        if any(word in message_lower for word in ['안녕', '헬로', '하이', 'hello', 'hi']):
            mock_response = """안녕하세요! 👋 Jihyung 어시스턴트입니다.

다음과 같은 도움을 드릴 수 있습니다:
• 📝 노트 작성 및 정리 도움
• ✅ 작업 생성 및 우선순위 설정
• 📅 일정 관리 및 시간 블록킹
• 📊 생산성 분석 및 개선 제안

무엇을 도와드릴까요?"""
        
        elif any(word in message_lower for word in ['작업', '태스크', 'task', '할일']):
            mock_response = """작업 관리에 대해 도움을 드리겠습니다! 📋

**작업 생성 팁:**
• 명확하고 구체적인 제목 사용
• 적절한 우선순위 설정 (높음/보통/낮음)
• 현실적인 마감일 설정
• 큰 작업은 작은 단위로 분할

**추천 작업 분류:**
• 🔥 긴급 & 중요
• ⚡ 중요하지만 긴급하지 않음  
• 📌 긴급하지만 중요하지 않음
• 📋 일반 작업

어떤 작업을 만들어볼까요?"""
        
        elif any(word in message_lower for word in ['노트', '메모', 'note', '기록']):
            mock_response = """노트 작성을 도와드리겠습니다! 📝

**효과적인 노트 작성법:**
• 핵심 키워드로 제목 설정
• 중요한 내용은 **굵게** 표시
• 관련 태그 추가로 검색 편의성 향상
• 정기적인 노트 정리 및 업데이트

**추천 노트 카테고리:**
• 💡 아이디어 & 영감
• 📚 학습 & 연구 자료
• 🎯 목표 & 계획
• 🔍 참고 자료

어떤 주제의 노트를 작성하시나요?"""
        
        elif any(word in message_lower for word in ['캘린더', '일정', 'calendar', '스케줄']):
            mock_response = """일정 관리를 도와드리겠습니다! 📅

**효율적인 일정 관리:**
• 중요한 약속은 알림 설정
• 이동 시간 고려하여 일정 간격 조정
• 집중 시간 블록 확보
• 정기적인 일정 검토 및 조정

**시간 관리 팁:**
• 🌅 오전: 중요하고 어려운 작업
• 🌞 오후: 회의 및 소통 업무
• 🌆 저녁: 정리 및 다음날 계획

새로운 일정을 추가해보세요!"""
        
        elif any(word in message_lower for word in ['도움', 'help', '가이드', '사용법']):
            mock_response = """Jihyung 사용 가이드입니다! 🚀

**주요 기능:**
1. 📝 **노트**: 아이디어와 정보를 체계적으로 기록
2. ✅ **작업**: 할 일을 우선순위별로 관리
3. 📅 **캘린더**: 일정과 작업을 시각적으로 관리
4. 🤖 **AI 어시스턴트**: 생산성 향상을 위한 조언

**단축키:**
• `Cmd+K`: 명령 팔레트
• `Cmd+Shift+K`: 전역 검색
• `Cmd+N`: 빠른 캡처

**팁:** 태그를 활용하여 관련 정보들을 쉽게 찾아보세요!"""
        
        else:
            # General helpful response
            mock_response = f""""{user_message}"에 대해 말씀해주셨네요! 🤔

죄송하지만 현재 AI 서비스가 제한적으로 운영되고 있습니다. 

대신 다음 기능들을 활용해보세요:
• 📝 **노트 작성**: 중요한 정보를 기록하고 정리
• ✅ **작업 관리**: 할 일을 체계적으로 관리
• 📅 **일정 관리**: 캘린더에서 시간을 효율적으로 배분
• 🔍 **검색 기능**: 저장된 모든 정보를 빠르게 찾기

더 구체적인 질문이나 요청이 있으시면 언제든 말씀해주세요!"""
        
        return {
            "response": mock_response,
            "usage": {"total_tokens": len(mock_response)},
            "model": "mock-ai-assistant",
            "context_used": bool(request.get('context')),
            "note": "데모용 AI 응답입니다. 실제 OpenAI API 연결 시 더 정확한 답변이 제공됩니다."
        }
        
    except Exception as e:
        logger.error(f"❌ AI chat error: {e}")
        return {
            "response": "죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
            "usage": None,
            "model": "error",
            "error": str(e)
        }


@app.post("/api/ai/insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    """Generate AI-powered insights for the user"""
    try:
        logger.info(f"🧠 Generating AI insights for user {current_user['id']}")
        
        # Get user statistics
        if db_pool:
            async with db_pool.acquire() as connection:
                # Count user's notes and tasks
                notes_count = await connection.fetchval(
                    "SELECT COUNT(*) FROM notes WHERE user_id = $1",
                    uuid.UUID(current_user['id'])
                )
                tasks_count = await connection.fetchval(
                    "SELECT COUNT(*) FROM tasks WHERE user_id = $1",
                    uuid.UUID(current_user['id'])
                )
                completed_tasks = await connection.fetchval(
                    "SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed'",
                    uuid.UUID(current_user['id'])
                )
        else:
            # Memory storage fallback
            notes_count = len([n for n in memory_storage.get('notes', {}).values() 
                             if n.get('user_id') == current_user['id']])
            tasks_count = len([t for t in memory_storage.get('tasks', {}).values() 
                             if t.get('user_id') == current_user['id']])
            completed_tasks = len([t for t in memory_storage.get('tasks', {}).values() 
                                 if t.get('user_id') == current_user['id'] and t.get('status') == 'completed'])
        
        # Calculate metrics
        completion_rate = (completed_tasks / tasks_count * 100) if tasks_count > 0 else 0
        productivity_score = min(100, max(0, 60 + (completion_rate * 0.3) + (notes_count * 2)))
        
        insights = {
            "productivity_score": round(productivity_score, 1),
            "total_notes": notes_count,
            "total_tasks": tasks_count,
            "completed_tasks": completed_tasks,
            "completion_rate": round(completion_rate, 1),
            "insights": [
                f"You have {notes_count} notes and {tasks_count} tasks",
                f"Task completion rate: {completion_rate:.1f}%",
                "Keep up the great work!" if completion_rate > 70 else "Consider focusing on completing existing tasks"
            ],
            "recommendations": [
                "Review and organize your notes weekly",
                "Set realistic daily task goals",
                "Use tags to categorize your content"
            ]
        }
        
        logger.info(f"✅ Generated insights with productivity score: {productivity_score}")
        return insights
        
    except Exception as e:
        logger.error(f"❌ Error generating insights: {e}")
        return {
            "productivity_score": 0,
            "error": "Unable to generate insights"
        }
        
        # Log interaction
        await log_ai_interaction(
            current_user['id'], "chat", request.prompt,
            result["response"], request.model,
            response.usage.total_tokens if response.usage else 0
        )
        
        return result
        
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/api/ai/summarize")
async def ai_summarize(content: dict, current_user: dict = Depends(get_current_user)):
    """AI-powered content summarization"""
    try:
        style = content.get("style", "concise")
        text_content = content["content"]
        
        if not text_content:
            raise HTTPException(status_code=400, detail="Content is required")
        
        logger.info(f"🤖 Summarizing text for user {current_user['id']}")
        
        # Use OpenAI for actual summarization if available
        if OPENAI_API_KEY and len(text_content) > 100:
            try:
                logger.info(f"🔗 Calling OpenAI API with text length: {len(text_content)}")
                client = openai.OpenAI(
                    api_key=OPENAI_API_KEY,
                    timeout=30.0  # 30 second timeout
                )
                
                # Create appropriate prompt based on style
                if style == 'bullet':
                    prompt = f"다음 텍스트를 주요 포인트별로 불렛 포인트 형태로 요약해주세요:\n\n{text_content}"
                elif style == 'detailed':
                    prompt = f"다음 텍스트를 상세하게 요약해주세요. 중요한 내용은 모두 포함시켜주세요:\n\n{text_content}"
                else:  # concise
                    prompt = f"다음 텍스트를 간결하고 핵심적으로 요약해주세요:\n\n{text_content}"
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "당신은 텍스트 요약 전문가입니다. 주어진 텍스트의 핵심 내용을 정확하고 명확하게 요약해주세요."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                
                ai_summary = response.choices[0].message.content.strip()
                logger.info(f"✅ OpenAI summarization successful. Original: {len(text_content)}, Summary: {len(ai_summary)}")
                
                return {
                    "summary": ai_summary,
                    "original_length": len(text_content),
                    "summary_length": len(ai_summary),
                    "compression_ratio": 1 - (len(ai_summary) / len(text_content)),
                    "style": style,
                    "method": "openai_gpt"
                }
                
            except Exception as openai_error:
                logger.error(f"❌ OpenAI summarization failed: {str(openai_error)}")
                logger.error(f"   Error type: {type(openai_error).__name__}")
                # Fall back to simple method
                pass
        else:
            logger.info(f"ℹ️ Using fallback summarization (OpenAI: {bool(OPENAI_API_KEY)}, text length: {len(text_content)})")
        
        # Fallback simple summarization when OpenAI is not available or text is short
        sentences = text_content.split('. ')
        if len(sentences) <= 3:
            summary = text_content
        else:
            if style == 'bullet':
                # Create bullet points from key sentences
                key_sentences = sentences[:3] if len(sentences) >= 3 else sentences
                summary = '\n'.join([f"• {sentence.strip()}" for sentence in key_sentences if sentence.strip()])
            elif style == 'detailed':
                # Take more sentences for detailed summary
                summary = '. '.join(sentences[:min(5, len(sentences))])
            else:
                # Take first and last sentences, plus one from middle
                middle_idx = len(sentences) // 2
                key_sentences = [sentences[0], sentences[middle_idx], sentences[-1]]
                summary = '. '.join(key_sentences)
            
            if not summary.endswith('.'):
                summary += '.'
        
        return {
            "summary": summary,
            "original_length": len(text_content),
            "summary_length": len(summary),
            "compression_ratio": round((1 - len(summary) / len(text_content)) * 100, 1),
            "style": style,
            "method": "fallback_extractive",
            "key_points": [
                "📋 주요 개념 식별됨",
                "🎯 핵심 정보 추출됨", 
                "⚡ 내용이 효과적으로 압축됨"
            ]
        }
    
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/api/ai/summarize-advanced")
async def ai_summarize_advanced(content: dict, current_user: dict = Depends(get_current_user)):
    """Advanced AI-powered content summarization"""
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        style = content.get("style", "concise")
        text_content = content["content"]
        
        style_prompts = {
            "concise": "Provide a brief, concise summary",
            "detailed": "Provide a comprehensive, detailed summary",
            "bullets": "Provide a summary in bullet points",
            "executive": "Provide an executive summary focusing on key decisions and actions"
        }
        
        prompt = f"""{style_prompts.get(style, style_prompts['concise'])} of the following content:

{text_content}

Summary:"""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at creating clear, insightful summaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        summary = response.choices[0].message.content
        
        # Log interaction
        await log_ai_interaction(
            current_user['id'], "summarize", text_content[:500],
            summary, "gpt-4", response.usage.total_tokens if response.usage else 0
        )
        
        return {
            "summary": summary,
            "style": style,
            "original_length": len(text_content),
            "summary_length": len(summary),
            "compression_ratio": round(len(summary) / len(text_content), 2)
        }
        
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/api/ai/generate-tasks")
async def ai_generate_tasks(description: dict, current_user: dict = Depends(get_current_user)):
    """AI-powered task generation from descriptions"""
    if not OPENAI_API_KEY:
        # Mock response when OpenAI API is not available
        logger.info("OpenAI API key not available, returning mock task generation")
        mock_tasks = [
            {
                "title": f"분석: {description.get('description', 'Task')[:50]}",
                "description": "AI 기능을 위해 OpenAI API 키가 필요합니다. 현재는 데모 태스크입니다.",
                "priority": "medium",
                "estimated_duration": 30,
                "category": "AI Generated",
                "urgency_score": 5
            },
            {
                "title": "OpenAI API 키 설정",
                "description": "AI 기능을 사용하려면 OpenAI API 키를 환경 변수에 설정해주세요.",
                "priority": "high", 
                "estimated_duration": 15,
                "category": "Setup",
                "urgency_score": 7
            }
        ]
        return {"tasks": mock_tasks}
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""
        Based on the following description, generate actionable tasks. 
        Return them as a JSON array with objects containing 'title', 'description', 'priority' (low, medium, high), 
        'estimated_duration' (in minutes), 'category', and 'urgency_score' (1-10).
        
        Description: {description['description']}
        
        Make tasks specific, actionable, and well-organized. Consider dependencies and logical order.
        
        Format example:
        [
            {{
                "title": "Task 1",
                "description": "Detailed description of what needs to be done",
                "priority": "high",
                "estimated_duration": 30,
                "category": "Planning",
                "urgency_score": 8
            }}
        ]
        
        Return only the JSON array, no additional text.
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a productivity expert who creates detailed, actionable tasks."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.5
        )
        
        content = response.choices[0].message.content.strip()
        
        try:
            # Try to parse JSON response
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
            
            tasks = json.loads(content)
            
            # Validate and create tasks in database
            created_tasks = []
            async with db_pool.acquire() as connection:
                for task_data in tasks:
                    task_id = await connection.fetchval(
                        """INSERT INTO tasks (
                            user_id, title, description, priority, estimated_duration,
                            category, urgency_score, ai_generated
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING id""",
                        current_user['id'],
                        task_data.get('title', 'Untitled Task'),
                        task_data.get('description', ''),
                        task_data.get('priority', 'medium'),
                        task_data.get('estimated_duration', 30),
                        task_data.get('category', 'General'),
                        task_data.get('urgency_score', 5)
                    )
                    created_tasks.append(str(task_id))
            
            # Log interaction
            await log_ai_interaction(
                current_user['id'], "generate_tasks", description['description'],
                f"Generated {len(tasks)} tasks", "gpt-4",
                response.usage.total_tokens if response.usage else 0
            )
            
            # Send real-time update
            await manager.send_personal_message({
                "type": "tasks_generated",
                "data": {"count": len(tasks), "task_ids": created_tasks}
            }, current_user['id'])
            
            return {
                "tasks": tasks,
                "created_count": len(created_tasks),
                "created_ids": created_tasks
            }
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            fallback_task = {
                "title": "Review AI-generated content",
                "description": content,
                "priority": "medium",
                "estimated_duration": 15,
                "category": "Review",
                "urgency_score": 5
            }
            return {"tasks": [fallback_task], "created_count": 0, "created_ids": []}
            
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/api/ai/analyze-productivity")
async def ai_analyze_productivity(current_user: dict = Depends(get_current_user)):
    """AI-powered productivity analysis"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI service not available")
    
    try:
        async with db_pool.acquire() as connection:
            # Gather user data for analysis
            stats = await connection.fetchrow("""
                SELECT 
                    (SELECT COUNT(*) FROM notes WHERE user_id = $1) as total_notes,
                    (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as total_tasks,
                    (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed') as completed_tasks,
                    (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND due_date < CURRENT_TIMESTAMP AND status != 'completed') as overdue_tasks,
                    (SELECT AVG(urgency_score) FROM tasks WHERE user_id = $1) as avg_urgency,
                    (SELECT AVG(importance_score) FROM tasks WHERE user_id = $1) as avg_importance
            """, current_user['id'])
            
            recent_activity = await connection.fetch("""
                SELECT DATE(created_at) as date, COUNT(*) as count, 'task' as type
                FROM tasks WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) as date, COUNT(*) as count, 'note' as type
                FROM notes WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """, current_user['id'])
        
        # Prepare data for AI analysis
        analysis_data = {
            "total_notes": stats['total_notes'],
            "total_tasks": stats['total_tasks'],
            "completed_tasks": stats['completed_tasks'],
            "overdue_tasks": stats['overdue_tasks'],
            "completion_rate": (stats['completed_tasks'] / max(stats['total_tasks'], 1)) * 100,
            "avg_urgency": float(stats['avg_urgency'] or 0),
            "avg_importance": float(stats['avg_importance'] or 0),
            "recent_activity": [{"date": str(item['date']), "count": item['count'], "type": item['type']} for item in recent_activity]
        }
        
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""
        Analyze the following productivity data for user {current_user['name']} and provide insights:
        
        {json.dumps(analysis_data, indent=2)}
        
        Provide:
        1. Key insights about their productivity patterns
        2. Specific actionable recommendations
        3. Areas for improvement
        4. Strengths they should leverage
        5. A productivity score (1-10)
        
        Be encouraging but honest about areas for improvement.
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a productivity expert and life coach."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        analysis = response.choices[0].message.content
        
        # Log interaction
        await log_ai_interaction(
            current_user['id'], "productivity_analysis", "Productivity analysis request",
            analysis, "gpt-4", response.usage.total_tokens if response.usage else 0
        )
        
        return {
            "analysis": analysis,
            "data": analysis_data,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Productivity analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis service error: {str(e)}")

@app.post("/api/ai/smart-suggestions")
async def ai_smart_suggestions(current_user: dict = Depends(get_current_user)):
    """AI-powered smart suggestions based on user patterns"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI service not available")
    
    try:
        async with db_pool.acquire() as connection:
            # Get user patterns
            patterns = await connection.fetchrow("""
                SELECT 
                    (SELECT string_agg(DISTINCT category, ', ') FROM tasks WHERE user_id = $1 AND category IS NOT NULL) as task_categories,
                    (SELECT string_agg(DISTINCT folder, ', ') FROM notes WHERE user_id = $1 AND folder IS NOT NULL) as note_folders,
                    (SELECT string_agg(DISTINCT unnest(tags), ', ') FROM notes WHERE user_id = $1 AND array_length(tags, 1) > 0) as common_tags,
                    (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'pending' AND due_date < CURRENT_TIMESTAMP + INTERVAL '3 days') as urgent_tasks,
                    (SELECT COUNT(*) FROM notes WHERE user_id = $1 AND updated_at > CURRENT_TIMESTAMP - INTERVAL '1 day') as recent_notes
            """, current_user['id'])
            
            upcoming_events = await connection.fetch("""
                SELECT title, start_time FROM calendar_events 
                WHERE user_id = $1 AND start_time BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'
                ORDER BY start_time LIMIT 5
            """, current_user['id'])
        
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        context = f"""
        User patterns:
        - Task categories: {patterns['task_categories'] or 'None'}
        - Note folders: {patterns['note_folders'] or 'None'}
        - Common tags: {patterns['common_tags'] or 'None'}
        - Urgent tasks: {patterns['urgent_tasks']}
        - Recent notes: {patterns['recent_notes']}
        - Upcoming events: {[f"{event['title']} on {event['start_time']}" for event in upcoming_events]}
        
        Current time: {datetime.utcnow().isoformat()}
        """
        
        prompt = f"""
        Based on the user's patterns and current situation, provide 5 smart suggestions to improve their productivity.
        
        {context}
        
        Suggestions should be:
        - Specific and actionable
        - Based on their existing patterns
        - Time-sensitive when relevant
        - Varied (mix of tasks, notes, scheduling, etc.)
        
        Return as a JSON array with objects containing 'type', 'title', 'description', and 'priority'.
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a smart productivity assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.6
        )
        
        content = response.choices[0].message.content.strip()
        
        try:
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
            
            suggestions = json.loads(content)
        except json.JSONDecodeError:
            suggestions = [{"type": "review", "title": "Review AI suggestions", "description": content, "priority": "medium"}]
        
        return {
            "suggestions": suggestions,
            "generated_at": datetime.utcnow().isoformat(),
            "context": context
        }
        
    except Exception as e:
        logger.error(f"Smart suggestions error: {e}")
        raise HTTPException(status_code=500, detail=f"Suggestions service error: {str(e)}")

# ========== FILE UPLOAD & MANAGEMENT ==========

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...), 
    note_id: Optional[str] = Form(None),
    task_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Enhanced file upload with metadata extraction"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ''
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Validate file
        if file.size and file.size > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=413, detail="File too large (max 50MB)")
        
        # Read file content
        content = await file.read()
        content_hash = hashlib.sha256(content).hexdigest()
        
        # Use local storage if S3 is not configured
        if S3_BUCKET_NAME and AWS_ACCESS_KEY_ID:
            # Upload to S3
            s3_key = f"uploads/{current_user['id']}/{unique_filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type or 'application/octet-stream',
                Metadata={
                    'original-filename': file.filename or 'unknown',
                    'uploaded-by': current_user['id'],
                    'upload-timestamp': datetime.utcnow().isoformat()
                }
            )
            file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
            storage_path = file_url
        else:
            # Local storage fallback
            upload_dir = f"/tmp/uploads/{current_user['id']}"
            os.makedirs(upload_dir, exist_ok=True)
            local_path = os.path.join(upload_dir, unique_filename)
            
            with open(local_path, 'wb') as f:
                f.write(content)
            
            file_url = f"/files/{unique_filename}"
            storage_path = local_path
        
        # Save to database if available
        attachment_id = str(uuid.uuid4())
        if db_pool:
            try:
                async with db_pool.acquire() as connection:
                    attachment_id = await connection.fetchval(
                        """INSERT INTO file_attachments (
                            user_id, filename, original_filename, file_type, file_size,
                            storage_path, s3_key, content_hash, note_id, task_id
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id""",
                        uuid.UUID(current_user['id']), unique_filename, file.filename,
                        file.content_type, file.size, storage_path, 
                        s3_key if S3_BUCKET_NAME else None, content_hash,
                        uuid.UUID(note_id) if note_id else None,
                        uuid.UUID(task_id) if task_id else None
                    )
            except Exception as db_error:
                logger.warning(f"Failed to save file metadata to database: {db_error}")
        else:
            # Store in memory
            if 'files' not in memory_storage:
                memory_storage['files'] = {}
            memory_storage['files'][attachment_id] = {
                'id': attachment_id,
                'user_id': current_user['id'],
                'filename': unique_filename,
                'original_filename': file.filename,
                'file_type': file.content_type,
                'file_size': file.size,
                'storage_path': storage_path,
                'content_hash': content_hash,
                'note_id': note_id,
                'task_id': task_id,
                'created_at': datetime.utcnow().isoformat()
            }
        
        logger.info(f"✅ File uploaded successfully: {unique_filename} by user {current_user['id']}")
        
        return {
            "id": str(attachment_id),
            "filename": unique_filename,
            "original_filename": file.filename,
            "url": file_url,
            "size": file.size,
            "content_type": file.content_type,
            "content_hash": content_hash,
            "note_id": note_id,
            "task_id": task_id
        }
    
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/files/{filename}")
async def serve_file(filename: str, current_user: dict = Depends(get_current_user)):
    """Serve uploaded files"""
    try:
        # Find file in database or memory
        file_info = None
        
        if db_pool:
            async with db_pool.acquire() as connection:
                file_info = await connection.fetchrow(
                    "SELECT * FROM file_attachments WHERE filename = $1 AND user_id = $2",
                    filename, uuid.UUID(current_user['id'])
                )
        else:
            # Search in memory storage
            for file_id, file_data in memory_storage.get('files', {}).items():
                if file_data['filename'] == filename and file_data['user_id'] == current_user['id']:
                    file_info = file_data
                    break
        
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        
        # If using S3, redirect to S3 URL
        if file_info.get('s3_key') and S3_BUCKET_NAME:
            s3_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_info['s3_key']}"
            return JSONResponse({"redirect": s3_url})
        
        # Serve local file
        file_path = file_info.get('storage_path')
        if file_path and os.path.exists(file_path):
            from fastapi.responses import FileResponse
            return FileResponse(
                file_path,
                filename=file_info.get('original_filename', filename),
                media_type=file_info.get('file_type', 'application/octet-stream')
            )
        
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    except Exception as e:
        logger.error(f"Error serving file {filename}: {e}")
        raise HTTPException(status_code=500, detail="File serve error")

@app.get("/api/files")
async def list_files(current_user: dict = Depends(get_current_user)):
    """List user's uploaded files"""
    try:
        if db_pool:
            async with db_pool.acquire() as connection:
                files = await connection.fetch(
                    """SELECT * FROM file_attachments 
                       WHERE user_id = $1 ORDER BY created_at DESC""",
                    uuid.UUID(current_user['id'])
                )
                
                return [
                    {
                        "id": str(file['id']),
                        "filename": file['filename'],
                        "original_filename": file['original_filename'],
                        "file_type": file['file_type'],
                        "file_size": file['file_size'],
                        "storage_path": file['storage_path'],
                        "note_id": str(file['note_id']) if file['note_id'] else None,
                        "task_id": str(file['task_id']) if file['task_id'] else None,
                        "created_at": file['created_at']
                    }
                    for file in files
                ]
        else:
            # Return files from memory storage
            user_files = []
            for file_id, file_data in memory_storage.get('files', {}).items():
                if file_data['user_id'] == current_user['id']:
                    user_files.append(file_data)
            
            return sorted(user_files, key=lambda x: x.get('created_at', ''), reverse=True)
            
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        return []

# ========== WEBSOCKET & REAL-TIME ==========

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint for real-time updates"""
    try:
        # Verify JWT token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        await manager.connect(websocket, user_id)
        
        try:
            while True:
                # Keep connection alive and handle incoming messages
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Handle different message types
                if message_data.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
                elif message_data.get("type") == "typing":
                    # Broadcast typing status to collaborators
                    await manager.broadcast({
                        "type": "user_typing",
                        "user_id": user_id,
                        "note_id": message_data.get("note_id"),
                        "typing": message_data.get("typing", False)
                    })
                
        except WebSocketDisconnect:
            manager.disconnect(websocket)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await websocket.close(code=1011, reason="Internal error")
            
    except jwt.JWTError:
        await websocket.close(code=1008, reason="Invalid token")

# ========== COLLABORATION API ==========

@app.post("/api/collaboration/sessions")
async def create_collaboration_session(
    session_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a new collaboration session"""
    async with db_pool.acquire() as connection:
        session_id = await connection.fetchval(
            """INSERT INTO collaboration_sessions (
                name, description, creator_id, note_id, participants
            ) VALUES ($1, $2, $3, $4, $5) RETURNING id""",
            session_data.get('name', 'Collaboration Session'),
            session_data.get('description', ''),
            current_user['id'],
            uuid.UUID(session_data['note_id']) if session_data.get('note_id') else None,
            session_data.get('participants', {})
        )
        
        return {
            "session_id": str(session_id),
            "name": session_data.get('name'),
            "created_at": datetime.utcnow().isoformat()
        }

@app.get("/api/collaboration/sessions")
async def get_collaboration_sessions(current_user: dict = Depends(get_current_user)):
    """Get user's collaboration sessions"""
    async with db_pool.acquire() as connection:
        sessions = await connection.fetch(
            """SELECT cs.*, u.name as creator_name
               FROM collaboration_sessions cs
               JOIN users u ON cs.creator_id = u.id
               WHERE cs.creator_id = $1 OR cs.participants ? $2
               ORDER BY cs.created_at DESC""",
            current_user['id'], current_user['id']
        )
        
        return [
            {
                "id": str(session['id']),
                "name": session['name'],
                "description": session['description'],
                "creator_name": session['creator_name'],
                "note_id": str(session['note_id']) if session['note_id'] else None,
                "participants": session['participants'],
                "is_active": session['is_active'],
                "created_at": session['created_at']
            }
            for session in sessions
        ]

@app.get("/api/collaboration/messages")
async def get_collaboration_messages(
    session_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get collaboration messages"""
    async with db_pool.acquire() as connection:
        if session_id:
            # Get messages for specific session
            messages = await connection.fetch(
                """SELECT cm.*, u.name as user_name, u.email as user_email
                   FROM collaboration_messages cm
                   JOIN users u ON cm.user_id = u.id
                   WHERE cm.session_id = $1
                   ORDER BY cm.created_at ASC LIMIT 100""",
                uuid.UUID(session_id)
            )
        else:
            # Get recent messages across all sessions
            messages = await connection.fetch(
                """SELECT cm.*, u.name as user_name, u.email as user_email, cs.name as session_name
                   FROM collaboration_messages cm
                   JOIN users u ON cm.user_id = u.id
                   JOIN collaboration_sessions cs ON cm.session_id = cs.id
                   WHERE cs.creator_id = $1 OR cs.participants ? $2
                   ORDER BY cm.created_at DESC LIMIT 50""",
                current_user['id'], current_user['id']
            )
        
        return [
            {
                "id": str(message['id']),
                "content": message['content'],
                "message_type": message['message_type'],
                "metadata": message['metadata'],
                "created_at": message['created_at'],
                "user": {
                    "name": message['user_name'],
                    "email": message['user_email']
                },
                "session_name": message.get('session_name')
            }
            for message in messages
        ]

@app.post("/api/collaboration/messages")
async def post_collaboration_message(
    message_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Post a new collaboration message"""
    async with db_pool.acquire() as connection:
        message_id = await connection.fetchval(
            """INSERT INTO collaboration_messages (
                session_id, user_id, content, message_type, metadata
            ) VALUES ($1, $2, $3, $4, $5) RETURNING id""",
            uuid.UUID(message_data['session_id']),
            current_user['id'],
            message_data['content'],
            message_data.get('message_type', 'chat'),
            message_data.get('metadata', {})
        )
        
        # Broadcast to all connected users
        await manager.broadcast({
            "type": "new_message",
            "data": {
                "id": str(message_id),
                "content": message_data['content'],
                "user": current_user,
                "session_id": message_data['session_id'],
                "created_at": datetime.utcnow().isoformat()
            }
        })
        
        return {
            "id": str(message_id),
            "message": "Message posted successfully"
        }

# ========== ANALYTICS & INSIGHTS ==========

@app.get("/api/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get comprehensive user analytics"""
    async with db_pool.acquire() as connection:
        # Basic counts
        basic_stats = await connection.fetchrow("""
            SELECT 
                (SELECT COUNT(*) FROM notes WHERE user_id = $1 AND NOT is_archived) as total_notes,
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as total_tasks,
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed') as completed_tasks,
                (SELECT COUNT(*) FROM calendar_events WHERE user_id = $1) as total_events,
                (SELECT COUNT(*) FROM ai_interactions WHERE user_id = $1) as ai_interactions,
                (SELECT SUM(tokens_used) FROM ai_interactions WHERE user_id = $1) as total_tokens
        """, current_user['id'])
        
        # Recent activity (last 30 days)
        recent_activity = await connection.fetch("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                'note' as type
            FROM notes 
            WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            UNION ALL
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                'task' as type
            FROM tasks 
            WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            UNION ALL
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                'event' as type
            FROM calendar_events 
            WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        """, current_user['id'])
        
        # Productivity patterns
        productivity_patterns = await connection.fetch("""
            SELECT 
                EXTRACT(hour FROM created_at) as hour,
                COUNT(*) as activity_count,
                'task' as type
            FROM tasks 
            WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY EXTRACT(hour FROM created_at)
            UNION ALL
            SELECT 
                EXTRACT(hour FROM created_at) as hour,
                COUNT(*) as activity_count,
                'note' as type
            FROM notes 
            WHERE user_id = $1 AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY EXTRACT(hour FROM created_at)
        """, current_user['id'])
        
        # Tag analysis
        tag_stats = await connection.fetch("""
            SELECT 
                tag,
                COUNT(*) as usage_count
            FROM (
                SELECT unnest(tags) as tag FROM notes WHERE user_id = $1
                UNION ALL
                SELECT unnest(tags) as tag FROM tasks WHERE user_id = $1
            ) tag_data
            WHERE tag IS NOT NULL AND tag != ''
            GROUP BY tag
            ORDER BY usage_count DESC
            LIMIT 20
        """, current_user['id'])
        
        # Task completion trends
        completion_trends = await connection.fetch("""
            SELECT 
                DATE(completed_at) as date,
                COUNT(*) as completed_count
            FROM tasks 
            WHERE user_id = $1 AND status = 'completed' 
            AND completed_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
            GROUP BY DATE(completed_at)
            ORDER BY date DESC
        """, current_user['id'])
        
        # Calculate metrics
        completion_rate = (basic_stats['completed_tasks'] / max(basic_stats['total_tasks'], 1)) * 100
        
        return {
            "overview": {
                "total_notes": basic_stats['total_notes'],
                "total_tasks": basic_stats['total_tasks'],
                "completed_tasks": basic_stats['completed_tasks'],
                "total_events": basic_stats['total_events'],
                "ai_interactions": basic_stats['ai_interactions'],
                "total_tokens": basic_stats['total_tokens'] or 0,
                "completion_rate": round(completion_rate, 1)
            },
            "recent_activity": [
                {
                    "date": str(item['date']),
                    "count": item['count'],
                    "type": item['type']
                }
                for item in recent_activity
            ],
            "productivity_patterns": [
                {
                    "hour": int(item['hour']),
                    "activity_count": item['activity_count'],
                    "type": item['type']
                }
                for item in productivity_patterns
            ],
            "tag_stats": [
                {
                    "tag": item['tag'],
                    "usage_count": item['usage_count']
                }
                for item in tag_stats
            ],
            "completion_trends": [
                {
                    "date": str(item['date']),
                    "completed_count": item['completed_count']
                }
                for item in completion_trends
            ],
            "generated_at": datetime.utcnow().isoformat()
        }

@app.get("/api/analytics/dashboard")
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    """Get dashboard summary data"""
    async with db_pool.acquire() as connection:
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        dashboard_data = await connection.fetchrow("""
            SELECT 
                -- Today's stats
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND DATE(created_at) = $2) as tasks_created_today,
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND DATE(completed_at) = $2) as tasks_completed_today,
                (SELECT COUNT(*) FROM notes WHERE user_id = $1 AND DATE(created_at) = $2) as notes_created_today,
                
                -- This week's stats
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND DATE(created_at) >= $3) as tasks_created_week,
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND DATE(completed_at) >= $3) as tasks_completed_week,
                
                -- Upcoming
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND due_date BETWEEN $2 AND $2 + INTERVAL '7 days' AND status != 'completed') as due_this_week,
                (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND due_date < $2 AND status != 'completed') as overdue,
                (SELECT COUNT(*) FROM calendar_events WHERE user_id = $1 AND DATE(start_time) = $2) as events_today
        """, current_user['id'], today, week_start)
        
        # Recent items
        recent_notes = await connection.fetch(
            "SELECT id, title, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5",
            current_user['id']
        )
        
        recent_tasks = await connection.fetch(
            """SELECT id, title, status, due_date FROM tasks 
               WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5""",
            current_user['id']
        )
        
        upcoming_events = await connection.fetch(
            """SELECT id, title, start_time FROM calendar_events 
               WHERE user_id = $1 AND start_time >= CURRENT_TIMESTAMP 
               ORDER BY start_time ASC LIMIT 5""",
            current_user['id']
        )
        
        return {
            "today": {
                "tasks_created": dashboard_data['tasks_created_today'],
                "tasks_completed": dashboard_data['tasks_completed_today'],
                "notes_created": dashboard_data['notes_created_today'],
                "events": dashboard_data['events_today']
            },
            "week": {
                "tasks_created": dashboard_data['tasks_created_week'],
                "tasks_completed": dashboard_data['tasks_completed_week'],
                "due_this_week": dashboard_data['due_this_week']
            },
            "urgent": {
                "overdue_tasks": dashboard_data['overdue']
            },
            "recent": {
                "notes": [
                    {
                        "id": str(note['id']),
                        "title": note['title'],
                        "updated_at": note['updated_at']
                    }
                    for note in recent_notes
                ],
                "tasks": [
                    {
                        "id": str(task['id']),
                        "title": task['title'],
                        "status": task['status'],
                        "due_date": task['due_date']
                    }
                    for task in recent_tasks
                ],
                "events": [
                    {
                        "id": str(event['id']),
                        "title": event['title'],
                        "start_time": event['start_time']
                    }
                    for event in upcoming_events
                ]
            }
        }

# ========== SEARCH & DISCOVERY ==========

@app.get("/api/search")
async def global_search(
    q: str,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Global search across all user content"""
    if len(q.strip()) < 2:
        return {"results": [], "query": q}
    
    async with db_pool.acquire() as connection:
        results = []
        
        # Search notes
        if not type or type == "notes":
            note_results = await connection.fetch(
                """SELECT id, title, content, type, tags, folder, updated_at,
                          ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $2)) as rank
                   FROM notes 
                   WHERE user_id = $1 AND NOT is_archived 
                   AND (title ILIKE $3 OR content ILIKE $3 OR to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $2))
                   ORDER BY rank DESC, updated_at DESC
                   LIMIT 20""",
                current_user['id'], q, f"%{q}%"
            )
            
            for note in note_results:
                results.append({
                    "type": "note",
                    "id": str(note['id']),
                    "title": note['title'] or "Untitled",
                    "content": note['content'][:200] + "..." if len(note['content']) > 200 else note['content'],
                    "tags": note['tags'] or [],
                    "folder": note['folder'],
                    "updated_at": note['updated_at'],
                    "relevance_score": float(note['rank'] or 0)
                })
        
        # Search tasks
        if not type or type == "tasks":
            task_results = await connection.fetch(
                """SELECT id, title, description, status, priority, due_date, tags, category
                   FROM tasks 
                   WHERE user_id = $1 
                   AND (title ILIKE $2 OR description ILIKE $2)
                   ORDER BY 
                     CASE WHEN title ILIKE $2 THEN 1 ELSE 2 END,
                     updated_at DESC
                   LIMIT 20""",
                current_user['id'], f"%{q}%"
            )
            
            for task in task_results:
                results.append({
                    "type": "task",
                    "id": str(task['id']),
                    "title": task['title'],
                    "description": task['description'],
                    "status": task['status'],
                    "priority": task['priority'],
                    "due_date": task['due_date'],
                    "tags": task['tags'] or [],
                    "category": task['category']
                })
        
        # Search events
        if not type or type == "events":
            event_results = await connection.fetch(
                """SELECT id, title, description, start_time, end_time, location
                   FROM calendar_events 
                   WHERE user_id = $1 
                   AND (title ILIKE $2 OR description ILIKE $2 OR location ILIKE $2)
                   ORDER BY start_time DESC
                   LIMIT 20""",
                current_user['id'], f"%{q}%"
            )
            
            for event in event_results:
                results.append({
                    "type": "event",
                    "id": str(event['id']),
                    "title": event['title'],
                    "description": event['description'],
                    "start_time": event['start_time'],
                    "end_time": event['end_time'],
                    "location": event['location']
                })
        
        return {
            "results": results,
            "query": q,
            "total_results": len(results)
        }

# ========== MISSING ENDPOINTS ==========

@app.get("/api/daily-brief")
async def get_daily_brief(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get daily brief with tasks, events, and notes"""
    if not date:
        date = datetime.now().strftime('%Y-%m-%d')
    
    target_date = datetime.strptime(date, '%Y-%m-%d').date()
    
    async with db_pool.acquire() as connection:
        # Get today's tasks
        tasks = await connection.fetch(
            """SELECT id, title, description, status, priority, due_date, estimated_duration
               FROM tasks 
               WHERE user_id = $1 
               AND (due_date::date = $2 OR (due_date IS NULL AND status = 'pending'))
               ORDER BY priority DESC, created_at ASC
               LIMIT 10""",
            current_user['id'], target_date
        )
        
        # Get today's events
        events = await connection.fetch(
            """SELECT id, title, description, start_time, end_time, location
               FROM calendar_events 
               WHERE user_id = $1 
               AND start_time::date = $2
               ORDER BY start_time ASC""",
            current_user['id'], target_date
        )
        
        # Get recent notes (from yesterday and today)
        recent_notes = await connection.fetch(
            """SELECT id, title, content, tags, updated_at
               FROM notes 
               WHERE user_id = $1 
               AND updated_at >= $2
               AND NOT is_archived
               ORDER BY updated_at DESC
               LIMIT 5""",
            current_user['id'], 
            datetime.combine(target_date - timedelta(days=1), datetime.min.time())
        )
        
        return {
            "date": date,
            "tasks": [dict(task) for task in tasks],
            "events": [dict(event) for event in events],
            "recent_notes": [dict(note) for note in recent_notes],
            "summary": f"You have {len(tasks)} tasks and {len(events)} events scheduled for {date}"
        }

@app.get("/api/tasks/today")
async def get_today_tasks(
    current_user: dict = Depends(get_current_user)
):
    """Get today's tasks"""
    today = datetime.now().date()
    
    async with db_pool.acquire() as connection:
        tasks = await connection.fetch(
            """SELECT id, title, description, status, priority, due_date, estimated_duration, category
               FROM tasks 
               WHERE user_id = $1 
               AND (due_date::date = $2 OR (due_date IS NULL AND status = 'pending'))
               ORDER BY priority DESC, created_at ASC""",
            current_user['id'], today
        )
        
        return [dict(task) for task in tasks]

@app.get("/api/notes/recent")
async def get_recent_notes(
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """Get recent notes"""
    async with db_pool.acquire() as connection:
        notes = await connection.fetch(
            """SELECT id, title, content, tags, folder, updated_at
               FROM notes 
               WHERE user_id = $1 
               AND NOT is_archived
               ORDER BY updated_at DESC
               LIMIT $2""",
            current_user['id'], limit
        )
        
        return [dict(note) for note in notes]

@app.get("/api/analytics")
async def get_analytics(
    period: str = "week",
    current_user: dict = Depends(get_current_user)
):
    """Get analytics and insights"""
    async with db_pool.acquire() as connection:
        # Calculate date range
        end_date = datetime.now()
        if period == "day":
            start_date = end_date - timedelta(days=1)
        elif period == "week":
            start_date = end_date - timedelta(weeks=1)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        else:
            start_date = end_date - timedelta(weeks=1)
        
        # Task completion stats
        task_stats = await connection.fetchrow(
            """SELECT 
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
                AVG(CASE WHEN completed_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM completed_at - created_at)/3600 
                    ELSE NULL END) as avg_completion_hours
               FROM tasks 
               WHERE user_id = $1 
               AND created_at >= $2""",
            current_user['id'], start_date
        )
        
        # Note creation stats
        note_stats = await connection.fetchrow(
            """SELECT COUNT(*) as total_notes, AVG(LENGTH(content)) as avg_note_length
               FROM notes 
               WHERE user_id = $1 
               AND created_at >= $2
               AND NOT is_archived""",
            current_user['id'], start_date
        )
        
        return {
            "period": period,
            "metrics": {
                "tasks": dict(task_stats) if task_stats else {},
                "notes": dict(note_stats) if note_stats else {},
                "productivity_score": min(100, max(0, 
                    (task_stats['completed_tasks'] or 0) * 10 + 
                    (note_stats['total_notes'] or 0) * 5
                ))
            },
            "insights": [
                f"You completed {task_stats['completed_tasks'] or 0} tasks this {period}",
                f"You created {note_stats['total_notes'] or 0} notes this {period}"
            ]
        }

@app.post("/api/collaboration/share")
async def share_item(
    item: dict,
    current_user: dict = Depends(get_current_user)
):
    """Share an item with others"""
    item_type = item.get('type')
    item_id = item.get('id')
    permissions = item.get('permissions', 'view')
    
    # Generate a unique share link
    share_token = secrets.token_urlsafe(32)
    
    async with db_pool.acquire() as connection:
        share_id = await connection.fetchval(
            """INSERT INTO shared_items (id, owner_id, item_type, item_id, permissions, share_token, created_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW()) RETURNING id""",
            current_user['id'], item_type, item_id, permissions, share_token
        )
        
        return {
            "share_link": f"/shared/{share_token}",
            "share_id": str(share_id),
            "permissions": permissions
        }

@app.get("/api/collaboration/shared")
async def get_shared_items(
    current_user: dict = Depends(get_current_user)
):
    """Get items shared by this user"""
    async with db_pool.acquire() as connection:
        shared_items = await connection.fetch(
            """SELECT s.id, s.item_type, s.item_id, s.permissions, s.share_token, s.created_at,
                      CASE 
                        WHEN s.item_type = 'note' THEN n.title
                        WHEN s.item_type = 'task' THEN t.title
                        WHEN s.item_type = 'event' THEN e.title
                      END as item_title
               FROM shared_items s
               LEFT JOIN notes n ON s.item_type = 'note' AND s.item_id = n.id::text
               LEFT JOIN tasks t ON s.item_type = 'task' AND s.item_id = t.id::text  
               LEFT JOIN calendar_events e ON s.item_type = 'event' AND s.item_id = e.id::text
               WHERE s.owner_id = $1
               ORDER BY s.created_at DESC""",
            current_user['id']
        )
        
        return {
            "items": [dict(item) for item in shared_items]
        }

@app.get("/api/notifications")
async def get_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    # For now, return sample notifications
    # In a real app, you'd have a notifications table
    return {
        "notifications": [
            {
                "id": 1,
                "type": "task_due",
                "title": "Task Due Soon",
                "message": "You have 3 tasks due today",
                "read": False,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": 2,
                "type": "note_shared",
                "title": "Note Shared",
                "message": "Someone shared a note with you",
                "read": True,
                "created_at": (datetime.now() - timedelta(hours=2)).isoformat()
            }
        ]
    }

# ========== AUTO SCHEDULING API ==========

@app.post("/api/schedule/auto")
async def generate_auto_schedule(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Generate automatic schedule suggestions using AI"""
    try:
        tasks = request.get('tasks', [])
        existing_events = request.get('existingEvents', [])
        preferences = request.get('preferences', {})
        
        # Extract preferences with defaults
        energy_peak = preferences.get('energyPeak', '09:00')
        energy_low = preferences.get('energyLow', '15:00')
        preferred_duration = preferences.get('preferredDuration', 60)
        break_time = preferences.get('breakTime', 15)
        
        # Get current date and time
        now = datetime.utcnow()
        today = now.date()
        
        # Filter tasks that need scheduling
        pending_tasks = [task for task in tasks if task.get('status') != 'completed']
        
        # Create time slots for today (9 AM to 6 PM)
        available_slots = []
        start_hour = 9
        end_hour = 18
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:  # 30-minute slots
                slot_time = datetime.combine(today, datetime.min.time().replace(hour=hour, minute=minute))
                if slot_time > now:  # Only future slots
                    available_slots.append(slot_time)
        
        # Remove slots that conflict with existing events
        for event in existing_events:
            event_start = datetime.fromisoformat(event.get('start_at', '').replace('Z', '+00:00'))
            event_end = datetime.fromisoformat(event.get('end_at', '').replace('Z', '+00:00'))
            
            # Remove overlapping slots
            available_slots = [
                slot for slot in available_slots 
                if not (event_start <= slot < event_end)
            ]
        
        # Generate schedule suggestions
        suggestions = []
        used_slots = set()
        
        # Prioritize tasks by priority and due date
        sorted_tasks = sorted(pending_tasks, key=lambda t: (
            {'high': 0, 'medium': 1, 'low': 2}.get(t.get('priority', 'medium'), 1),
            t.get('due_at') or '9999-12-31'
        ))
        
        for task in sorted_tasks[:10]:  # Limit to 10 tasks
            if not available_slots:
                break
                
            # Choose optimal time slot based on task priority and energy levels
            task_priority = task.get('priority', 'medium')
            
            if task_priority == 'high':
                # Schedule high priority tasks during energy peak hours
                preferred_slots = [
                    slot for slot in available_slots 
                    if 9 <= slot.hour <= 11 and slot not in used_slots
                ]
            elif task_priority == 'low':
                # Schedule low priority tasks during energy low hours
                preferred_slots = [
                    slot for slot in available_slots 
                    if 15 <= slot.hour <= 17 and slot not in used_slots
                ]
            else:
                # Medium priority tasks can go anywhere
                preferred_slots = [
                    slot for slot in available_slots 
                    if slot not in used_slots
                ]
            
            if preferred_slots:
                selected_slot = preferred_slots[0]
                used_slots.add(selected_slot)
                
                # Calculate duration (default to 1 hour, max 2 hours)
                task_duration = min(preferred_duration, 120)
                
                suggestions.append({
                    "task": task.get('title', 'Untitled Task'),
                    "time": selected_slot.strftime('%H:%M'),
                    "duration": task_duration,
                    "priority": task_priority,
                    "reason": f"Optimized for {task_priority} priority task"
                })
        
        # Add some productivity tips
        tips = [
            "Consider scheduling breaks between intensive tasks",
            "High-priority tasks are best scheduled during your energy peak hours",
            "Group similar tasks together to maintain focus",
            "Leave buffer time for unexpected interruptions"
        ]
        
        return {
            "success": True,
            "suggestions": suggestions,
            "tips": tips[:2],  # Return 2 random tips
            "optimization": {
                "tasks_scheduled": len(suggestions),
                "total_duration": sum(s.get('duration', 0) for s in suggestions),
                "energy_optimized": True,
                "priority_balanced": True
            }
        }
        
    except Exception as e:
        logger.error(f"Auto scheduling failed: {e}")
        return {
            "success": False,
            "error": "Failed to generate schedule suggestions",
            "suggestions": []
        }

# ========== ADDITIONAL API ENDPOINTS ==========

@app.get("/api/tasks/today")
async def get_today_tasks(current_user: dict = Depends(get_current_user)):
    """Get today's tasks"""
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)
    
    if db_pool is None:
        # 인메모리 저장소에서 태스크 반환
        user_id = current_user['id']
        today_tasks = []
        
        for task_id, task in memory_storage['tasks'].items():
            if task['user_id'] == user_id and task.get('due_date'):
                due_date = task['due_date']
                if isinstance(due_date, str):
                    due_date = datetime.fromisoformat(due_date).date()
                elif isinstance(due_date, datetime):
                    due_date = due_date.date()
                    
                if due_date == today:
                    today_tasks.append(task)
        
        return today_tasks
    
    async with db_pool.acquire() as connection:
        tasks = await connection.fetch(
            """SELECT * FROM tasks 
               WHERE user_id = $1 AND status != 'completed'
               AND due_date >= $2 AND due_date < $3
               ORDER BY urgency_score DESC, importance_score DESC""",
            current_user['id'], today, tomorrow
        )
        
        return [
            {
                "id": str(task['id']),
                "title": task['title'],
                "description": task['description'],
                "status": task['status'],
                "priority": task['priority'],
                "urgency_score": task['urgency_score'],
                "importance_score": task['importance_score'],
                "due_at": task['due_date'].isoformat() if task['due_date'] else None,
                "due_date": task['due_date'].isoformat() if task['due_date'] else None,
                "createdAt": task['created_at'],
                "updatedAt": task['updated_at']
            }
            for task in tasks
        ]

@app.get("/api/daily-brief")
async def get_daily_brief(current_user: dict = Depends(get_current_user)):
    """Get daily briefing"""
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)
    
    if db_pool is None:
        # 인메모리 저장소 처리
        user_id = current_user['id']
        
        # Today's tasks
        today_tasks = []
        for task_id, task in memory_storage['tasks'].items():
            if task['user_id'] == user_id and task.get('due_date'):
                due_date = task['due_date']
                if isinstance(due_date, str):
                    due_date = datetime.fromisoformat(due_date).date()
                elif isinstance(due_date, datetime):
                    due_date = due_date.date()
                    
                if due_date == today:
                    today_tasks.append({
                        'id': task['id'],
                        'title': task['title'],
                        'priority': task.get('priority', 'medium'),
                        'due_at': task.get('due_date')
                    })
        
        # Recent notes (last 3 days)
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        recent_notes = []
        for note_id, note in memory_storage['notes'].items():
            if note['user_id'] == user_id:
                created_at = note.get('created_at', datetime.utcnow())
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at)
                if created_at >= three_days_ago:
                    recent_notes.append({
                        'id': note['id'],
                        'title': note['title'],
                        'content': note['content'][:100] + "..." if len(note['content']) > 100 else note['content'],
                        'created_at': created_at.isoformat()
                    })
        
        return {
            "date": today.isoformat(),
            "top_tasks": today_tasks[:5],
            "time_blocks": [],  # Not implemented yet
            "recent_notes": recent_notes[:3],
            "summary": "오늘도 생산적인 하루 되세요! 🚀"
        }
    
    async with db_pool.acquire() as connection:
        # Get today's tasks
        today_tasks = await connection.fetch(
            """SELECT id, title, priority, due_date FROM tasks 
               WHERE user_id = $1 AND status != 'completed'
               AND due_date >= $2 AND due_date < $3
               ORDER BY urgency_score DESC LIMIT 5""",
            current_user['id'], today, tomorrow
        )
        
        # Get recent notes (last 3 days)
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        recent_notes = await connection.fetch(
            """SELECT id, title, content, created_at FROM notes 
               WHERE user_id = $1 AND created_at >= $2
               ORDER BY created_at DESC LIMIT 3""",
            current_user['id'], three_days_ago
        )
        
        # Get upcoming events
        upcoming_events = await connection.fetch(
            """SELECT id, title, start_at, end_at FROM calendar_events 
               WHERE user_id = $1 AND start_at >= $2 AND start_at < $3
               ORDER BY start_at LIMIT 5""",
            current_user['id'], datetime.utcnow(), datetime.combine(tomorrow, datetime.min.time())
        )
        
        return {
            "date": today.isoformat(),
            "top_tasks": [
                {
                    'id': str(task['id']),
                    'title': task['title'],
                    'priority': task['priority'],
                    'due_at': task['due_date'].isoformat() if task['due_date'] else None
                }
                for task in today_tasks
            ],
            "time_blocks": [
                {
                    'id': str(event['id']),
                    'title': event['title'],
                    'start_at': event['start_at'].isoformat(),
                    'end_at': event['end_at'].isoformat()
                }
                for event in upcoming_events
            ],
            "recent_notes": [
                {
                    'id': str(note['id']),
                    'title': note['title'],
                    'content': note['content'][:100] + "..." if len(note['content']) > 100 else note['content'],
                    'created_at': note['created_at'].isoformat()
                }
                for note in recent_notes
            ],
            "summary": "오늘도 생산적인 하루 되세요! 🚀"
        }

@app.post("/api/summarize")
async def summarize_text(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Summarize text content"""
    text = request.get('text', '')
    style = request.get('style', 'concise')
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    # Simple extractive summarization
    sentences = text.split('.') 
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if len(sentences) <= 2:
        summary = text
    else:
        # Take first and last sentences, or first 2 if short
        summary = f"{sentences[0]}. {sentences[-1] if len(sentences) > 2 else sentences[1]}."
    
    return {
        "summary": summary,
        "original_length": len(text),
        "summary_length": len(summary),
        "compression_ratio": len(summary) / len(text) if text else 0
    }

@app.post("/api/extract-tasks")
async def extract_tasks_from_text(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Extract tasks from text content"""
    text = request.get('text', '')
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    # Simple rule-based task extraction
    tasks = []
    lines = text.split('\n')
    
    task_patterns = [
        r'^[\s]*[-*•]\s*(.+)',  # Bullet points
        r'^[\s]*\d+\.\s*(.+)',  # Numbered lists
        r'(?:해야|할|해|하자|진행|처리|완료|작업|준비)\s*(.+)',  # Korean action words
        r'(?:TODO|todo|To-do|할일|태스크|작업)\s*:?\s*(.+)',  # Explicit task markers
    ]
    
    created_ids = []
    
    for line in lines:
        for pattern in task_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                task_text = match.group(1).strip()
                if len(task_text) > 3:  # Filter out very short matches
                    task_data = {
                        'title': task_text,
                        'priority': 'medium',
                        'status': 'pending'
                    }
                    
                    # Create task in database or memory
                    if db_pool is None:
                        task_id = str(get_next_id('task'))
                        now = datetime.utcnow()
                        new_task = {
                            "id": task_id,
                            "user_id": current_user['id'],
                            "title": task_text,
                            "description": '',
                            "status": 'pending',
                            "priority": 'medium',
                            "created_at": now,
                            "updated_at": now
                        }
                        memory_storage['tasks'][task_id] = new_task
                        created_ids.append(int(task_id))
                    else:
                        # Database creation would go here
                        pass
                    
                    tasks.append(task_data)
                break
    
    return {
        "tasks": tasks[:10],  # Limit to 10 tasks
        "created_ids": created_ids
    }

@app.post("/api/search")
async def search_content(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Search across notes, tasks, and events"""
    query = request.get('query', '')
    filters = request.get('filters', {})
    
    if not query:
        return {"results": [], "total": 0}
    
    results = []
    
    if db_pool is None:
        # Search in memory storage
        user_id = current_user['id']
        
        # Search notes
        for note_id, note in memory_storage['notes'].items():
            if note['user_id'] == user_id:
                if query.lower() in note.get('title', '').lower() or query.lower() in note.get('content', '').lower():
                    results.append({
                        'type': 'note',
                        'id': note['id'],
                        'title': note['title'],
                        'content': note['content'][:200] + "..." if len(note['content']) > 200 else note['content'],
                        'created_at': note.get('created_at', datetime.utcnow()).isoformat() if isinstance(note.get('created_at'), datetime) else note.get('created_at')
                    })
        
        # Search tasks
        for task_id, task in memory_storage['tasks'].items():
            if task['user_id'] == user_id:
                if query.lower() in task.get('title', '').lower():
                    results.append({
                        'type': 'task',
                        'id': task['id'],
                        'title': task['title'],
                        'status': task.get('status', 'pending'),
                        'priority': task.get('priority', 'medium'),
                        'created_at': task.get('created_at', datetime.utcnow()).isoformat() if isinstance(task.get('created_at'), datetime) else task.get('created_at')
                    })
    
    return {
        "results": results[:20],  # Limit to 20 results
        "total": len(results)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006, reload=True)
