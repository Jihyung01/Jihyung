#!/usr/bin/env python3
"""
데이터베이스 Foreign Key 문제 해결
Demo 사용자를 실제로 생성하여 협업과 클라우드 저장이 가능하도록 수정
"""
import asyncio
import asyncpg
import uuid
from datetime import datetime
import os

# 데이터베이스 설정
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/postgres')

async def fix_database():
    """데이터베이스 스키마 및 demo 사용자 생성"""
    try:
        # 데이터베이스 연결
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ 데이터베이스 연결 성공")
        
        # 1. users 테이블이 존재하는지 확인
        users_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        """)
        
        if not users_exists:
            print("📋 users 테이블 생성 중...")
            await conn.execute("""
                CREATE TABLE users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    avatar_url TEXT,
                    is_active BOOLEAN DEFAULT TRUE
                );
            """)
            print("✅ users 테이블 생성 완료")
        
        # 2. Demo 사용자 확인/생성
        demo_user_id = "12345678-1234-1234-1234-123456789012"
        demo_user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            uuid.UUID(demo_user_id)
        )
        
        if not demo_user:
            print("👤 Demo 사용자 생성 중...")
            await conn.execute("""
                INSERT INTO users (id, email, name, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5)
            """, 
                uuid.UUID(demo_user_id),
                "demo@example.com",
                "Demo User",
                datetime.utcnow(),
                datetime.utcnow()
            )
            print("✅ Demo 사용자 생성 완료")
        else:
            print("✅ Demo 사용자 이미 존재")
        
        # 3. notes 테이블 확인/생성 (Foreign Key 포함)
        notes_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'notes'
            );
        """)
        
        if not notes_exists:
            print("📝 notes 테이블 생성 중...")
            await conn.execute("""
                CREATE TABLE notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(500) NOT NULL,
                    content TEXT,
                    content_type VARCHAR(50) DEFAULT 'markdown',
                    type VARCHAR(50) DEFAULT 'note',
                    tags TEXT[] DEFAULT '{}',
                    folder VARCHAR(255),
                    color VARCHAR(7) DEFAULT '#ffffff',
                    is_pinned BOOLEAN DEFAULT FALSE,
                    is_archived BOOLEAN DEFAULT FALSE,
                    word_count INTEGER DEFAULT 0,
                    character_count INTEGER DEFAULT 0,
                    reading_time INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    -- 협업 기능을 위한 필드들
                    shared_with UUID[] DEFAULT '{}',
                    is_public BOOLEAN DEFAULT FALSE,
                    collaboration_settings JSONB DEFAULT '{}',
                    
                    -- 인덱스 생성
                    CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                -- 성능 최적화 인덱스들
                CREATE INDEX idx_notes_user_id ON notes(user_id);
                CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
                CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
                CREATE INDEX idx_notes_title ON notes USING gin(to_tsvector('korean', title));
                CREATE INDEX idx_notes_content ON notes USING gin(to_tsvector('korean', content));
                CREATE INDEX idx_notes_tags ON notes USING gin(tags);
                CREATE INDEX idx_notes_shared ON notes USING gin(shared_with);
            """)
            print("✅ notes 테이블 생성 완료 (협업 기능 포함)")
        
        # 4. 협업을 위한 추가 테이블들 생성
        
        # 공유 권한 테이블
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS note_shares (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                permission VARCHAR(20) DEFAULT 'read', -- read, write, admin
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                
                UNIQUE(note_id, shared_with)
            );
        """)
        
        # 실시간 협업을 위한 변경 로그 테이블
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS note_changes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                change_type VARCHAR(50) NOT NULL, -- create, update, delete, share
                old_content JSONB,
                new_content JSONB,
                change_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("✅ 협업 테이블들 생성 완료")
        
        # 5. 기존 note 테이블이 있다면 데이터 마이그레이션
        note_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'note'
            );
        """)
        
        if note_exists:
            print("🔄 기존 note 테이블에서 notes로 데이터 마이그레이션...")
            await conn.execute("""
                INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
                SELECT 
                    id,
                    $1 as user_id,  -- Demo 사용자 ID 사용
                    title,
                    content,
                    COALESCE(created_at, CURRENT_TIMESTAMP),
                    COALESCE(updated_at, CURRENT_TIMESTAMP)
                FROM note
                WHERE NOT EXISTS (SELECT 1 FROM notes WHERE notes.id = note.id);
            """, uuid.UUID(demo_user_id))
            print("✅ 데이터 마이그레이션 완료")
        
        # 6. 데이터베이스 상태 확인
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        note_count = await conn.fetchval("SELECT COUNT(*) FROM notes")
        
        print(f"\n📊 데이터베이스 상태:")
        print(f"   👥 사용자 수: {user_count}")
        print(f"   📝 노트 수: {note_count}")
        
        await conn.close()
        print("\n🎉 데이터베이스 수정 완료! 이제 클라우드 저장과 협업이 가능합니다.")
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_database())
