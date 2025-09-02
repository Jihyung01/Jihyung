#!/usr/bin/env python3
"""
🚀 최첨단 Jihyung 앱 - 완전한 클라우드 솔루션
협업, 실시간 동기화, 사용자 계정 기반 저장 지원
"""
import asyncio
import asyncpg
import uuid
from datetime import datetime
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase 연결 설정
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres.lxrzlszthqoufxapdqml:dyddmlrltk98%21@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres')

async def setup_cloud_database():
    """최첨단 협업 앱을 위한 완전한 클라우드 데이터베이스 설정"""
    try:
        # Supabase 연결
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("✅ Supabase 클라우드 데이터베이스 연결 성공")
        
        # 1. 사용자 관리 시스템 (협업 기반)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                avatar_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                preferences JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active, last_active);
        """)
        
        # 2. 핵심 노트 시스템 (클라우드 저장)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(500) NOT NULL,
                content TEXT,
                content_type VARCHAR(50) DEFAULT 'markdown',
                type VARCHAR(50) DEFAULT 'note',
                tags TEXT[] DEFAULT '{}',
                folder VARCHAR(255),
                color VARCHAR(7) DEFAULT '#ffffff',
                
                -- 협업 및 공유 기능
                is_pinned BOOLEAN DEFAULT FALSE,
                is_archived BOOLEAN DEFAULT FALSE,
                is_public BOOLEAN DEFAULT FALSE,
                shared_with UUID[] DEFAULT '{}',
                collaboration_settings JSONB DEFAULT '{"edit_permission": "owner", "comment_permission": "shared"}',
                
                -- AI 기능 강화
                word_count INTEGER DEFAULT 0,
                character_count INTEGER DEFAULT 0,
                reading_time INTEGER DEFAULT 1,
                ai_summary TEXT,
                ai_tags TEXT[] DEFAULT '{}',
                ai_insights JSONB DEFAULT '{}',
                
                -- 버전 관리
                version INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- 성능 최적화 인덱스
            CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
            CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notes_title_search ON notes USING gin(to_tsvector('english', title));
            CREATE INDEX IF NOT EXISTS idx_notes_content_search ON notes USING gin(to_tsvector('english', content));
            CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
            CREATE INDEX IF NOT EXISTS idx_notes_shared ON notes USING gin(shared_with);
            CREATE INDEX IF NOT EXISTS idx_notes_public ON notes(is_public) WHERE is_public = true;
        """)
        
        # 3. 실시간 협업 시스템
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS note_collaborations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                permission VARCHAR(20) DEFAULT 'read', -- read, comment, edit, admin
                invited_by UUID REFERENCES users(id),
                invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
                
                UNIQUE(note_id, user_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_collaborations_note_id ON note_collaborations(note_id);
            CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON note_collaborations(user_id);
        """)
        
        # 4. 실시간 변경 추적 (협업)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS note_changes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                change_type VARCHAR(50) NOT NULL, -- create, update, delete, share, comment
                field_changed VARCHAR(100),
                old_value TEXT,
                new_value TEXT,
                change_description TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_changes_note_id ON note_changes(note_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_changes_user_id ON note_changes(user_id, created_at DESC);
        """)
        
        # 5. AI 작업 관리 시스템
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS ai_tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
                task_type VARCHAR(50) NOT NULL, -- summarize, extract_tasks, schedule, translate
                input_data JSONB,
                result_data JSONB,
                status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_tasks(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
        """)
        
        # 6. Demo 사용자 생성 (테스트용)
        demo_user_id = "12345678-1234-1234-1234-123456789012"
        await conn.execute("""
            INSERT INTO users (id, email, name, avatar_url, preferences)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET
                updated_at = CURRENT_TIMESTAMP,
                last_active = CURRENT_TIMESTAMP
        """, 
            uuid.UUID(demo_user_id),
            "demo@example.com",
            "Demo User",
            "https://i.pravatar.cc/150?u=demo",
            {
                "theme": "light",
                "language": "ko",
                "ai_features": True,
                "collaboration": True
            }
        )
        
        # 7. 데이터베이스 상태 확인
        stats = await conn.fetchrow("""
            SELECT 
                (SELECT COUNT(*) FROM users) as user_count,
                (SELECT COUNT(*) FROM notes) as note_count,
                (SELECT COUNT(*) FROM note_collaborations) as collaboration_count
        """)
        
        await conn.close()
        
        print(f"""
🎉 최첨단 Jihyung 클라우드 데이터베이스 설정 완료!

📊 현재 상태:
   👥 사용자: {stats['user_count']}명
   📝 노트: {stats['note_count']}개
   🤝 협업: {stats['collaboration_count']}개

✨ 지원 기능:
   🌐 클라우드 저장 (기기간 동기화)
   👥 실시간 협업
   🤖 AI 기능 (요약, 태스크 추출, 스케줄링)
   🔍 전문 검색
   📱 멀티 디바이스 지원
   🔒 권한 관리
   📈 버전 관리
   
🚀 이제 진짜 최첨단 앱입니다!
        """)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 클라우드 데이터베이스 설정 실패: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(setup_cloud_database())
    if success:
        print("\n✅ 클라우드 설정 완료 - 백엔드를 재시작하세요!")
    else:
        print("\n❌ 설정 실패 - 로그를 확인하세요.")
