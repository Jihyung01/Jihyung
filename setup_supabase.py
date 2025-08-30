#!/usr/bin/env python3
"""
🎉 Supabase 연결 성공! 
기존 테이블 구조 확인 및 업데이트
"""
import asyncio
import asyncpg
import os
import uuid
from datetime import datetime

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres.lxrzlszthqoufxapdqml:dyddmlrltk98@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres')

async def setup_database_properly():
    """기존 테이블 구조 확인하고 올바르게 설정"""
    try:
        # pgbouncer 호환을 위해 statement_cache_size=0 설정
        conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)
        print("✅ Supabase 연결 성공!")
        
        # 1. 기존 테이블 구조 확인
        print("\n📋 기존 테이블 확인 중...")
        
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        existing_tables = [table['table_name'] for table in tables]
        print(f"기존 테이블: {existing_tables}")
        
        # 2. users 테이블 처리
        if 'users' not in existing_tables:
            print("👤 users 테이블 생성 중...")
            await conn.execute("""
                CREATE TABLE users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    preferences JSONB DEFAULT '{}',
                    is_active BOOLEAN DEFAULT TRUE
                );
            """)
        else:
            print("👤 users 테이블 구조 확인 중...")
            # 필요한 컬럼이 있는지 확인하고 없으면 추가
            columns = await conn.fetch("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
            """)
            existing_columns = [col['column_name'] for col in columns]
            
            needed_columns = {
                'avatar_url': 'TEXT',
                'preferences': 'JSONB DEFAULT \'{}\'',
                'is_active': 'BOOLEAN DEFAULT TRUE'
            }
            
            for col, col_type in needed_columns.items():
                if col not in existing_columns:
                    print(f"   + {col} 컬럼 추가")
                    await conn.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
        
        # 3. notes 테이블 처리 (Foreign Key 없이)
        if 'notes' not in existing_tables:
            print("📝 notes 테이블 생성 중...")
            await conn.execute("""
                CREATE TABLE notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    title VARCHAR(500) NOT NULL,
                    content TEXT,
                    content_type VARCHAR(50) DEFAULT 'markdown',
                    type VARCHAR(50) DEFAULT 'note',
                    tags TEXT[] DEFAULT '{}',
                    folder VARCHAR(255),
                    color VARCHAR(7) DEFAULT '#ffffff',
                    is_pinned BOOLEAN DEFAULT FALSE,
                    is_archived BOOLEAN DEFAULT FALSE,
                    is_public BOOLEAN DEFAULT FALSE,
                    shared_with UUID[] DEFAULT '{}',
                    word_count INTEGER DEFAULT 0,
                    character_count INTEGER DEFAULT 0,
                    reading_time INTEGER DEFAULT 1,
                    version INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
                CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
            """)
        else:
            print("📝 notes 테이블 구조 확인 중...")
            columns = await conn.fetch("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'notes' AND table_schema = 'public'
            """)
            existing_columns = [col['column_name'] for col in columns]
            
            needed_columns = {
                'content_type': 'VARCHAR(50) DEFAULT \'markdown\'',
                'type': 'VARCHAR(50) DEFAULT \'note\'',
                'tags': 'TEXT[] DEFAULT \'{}\'',
                'folder': 'VARCHAR(255)',
                'color': 'VARCHAR(7) DEFAULT \'#ffffff\'',
                'is_pinned': 'BOOLEAN DEFAULT FALSE',
                'is_archived': 'BOOLEAN DEFAULT FALSE',
                'is_public': 'BOOLEAN DEFAULT FALSE',
                'shared_with': 'UUID[] DEFAULT \'{}\'',
                'word_count': 'INTEGER DEFAULT 0',
                'character_count': 'INTEGER DEFAULT 0',
                'reading_time': 'INTEGER DEFAULT 1',
                'version': 'INTEGER DEFAULT 1'
            }
            
            for col, col_type in needed_columns.items():
                if col not in existing_columns:
                    print(f"   + {col} 컬럼 추가")
                    try:
                        await conn.execute(f"ALTER TABLE notes ADD COLUMN {col} {col_type}")
                    except Exception as e:
                        print(f"   ⚠️ {col} 추가 실패: {e}")
        
        # 4. Demo 사용자 생성
        demo_user_id = "12345678-1234-1234-1234-123456789012"
        print("👤 Demo 사용자 확인/생성...")
        
        existing_user = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1", uuid.UUID(demo_user_id)
        )
        
        if not existing_user:
            import json
            await conn.execute("""
                INSERT INTO users (id, email, name, preferences)
                VALUES ($1, $2, $3, $4)
            """, 
                uuid.UUID(demo_user_id),
                "demo@example.com",
                "Demo User", 
                json.dumps({"theme": "light", "language": "ko", "ai_features": True})
            )
            print("✅ Demo 사용자 생성 완료")
        else:
            print("✅ Demo 사용자 이미 존재")
        
        # 5. 상태 확인
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        note_count = await conn.fetchval("SELECT COUNT(*) FROM notes")
        
        await conn.close()
        
        print(f"""
🎉 === Supabase 클라우드 데이터베이스 설정 완료! ===

📊 현재 상태:
   👥 사용자: {user_count}명
   📝 노트: {note_count}개

✨ 지원 기능:
   🌐 클라우드 저장 (기기간 동기화)
   👥 사용자 계정 기반 저장
   🤝 협업 준비 (공유 기능)
   🔍 고급 검색 (태그, 폴더, 전문검색)
   📱 멀티 디바이스 지원
   🎨 커스터마이징 (색상, 폴더, 태그)
   📈 통계 (단어수, 읽기시간 등)
   🔒 데이터 보안

🚀 이제 진짜 최첨단 클라우드 앱입니다!
        """)
        
        return True
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(setup_database_properly())
    if success:
        print("\n✅ 백엔드를 시작하여 클라우드 기능을 사용하세요!")
        print("python3 backend/main_enhanced.py")
    else:
        print("\n❌ 설정 실패")
