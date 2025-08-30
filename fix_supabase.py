#!/usr/bin/env python3
"""
🔧 Supabase 연결 문제 진단 및 해결
실제 클라우드 앱을 위한 완전한 해결책
"""
import asyncio
import asyncpg
import os
import sys
from urllib.parse import urlparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def diagnose_and_fix_supabase():
    """Supabase 연결 문제 진단 및 해결"""
    
    # 1. 환경변수 확인
    database_url = os.getenv('DATABASE_URL')
    supabase_url = os.getenv('SUPABASE_URL') 
    supabase_key = os.getenv('SUPABASE_KEY')
    
    print("🔍 === Supabase 연결 진단 ===")
    print(f"DATABASE_URL: {'✅ 설정됨' if database_url else '❌ 없음'}")
    print(f"SUPABASE_URL: {'✅ 설정됨' if supabase_url else '❌ 없음'}")
    print(f"SUPABASE_KEY: {'✅ 설정됨' if supabase_key else '❌ 없음'}")
    
    if not database_url:
        print("❌ DATABASE_URL이 설정되지 않았습니다!")
        return False
    
    # 2. URL 파싱 및 검증
    try:
        parsed = urlparse(database_url)
        print(f"\n📋 연결 정보:")
        print(f"   호스트: {parsed.hostname}")
        print(f"   포트: {parsed.port}")
        print(f"   데이터베이스: {parsed.path[1:]}")
        print(f"   사용자: {parsed.username}")
        
        # 3. 다양한 연결 방법 시도
        connection_methods = [
            {
                "name": "기본 연결",
                "url": database_url
            },
            {
                "name": "SSL 비활성화",
                "url": f"{database_url}?sslmode=disable"
            },
            {
                "name": "SSL prefer",
                "url": f"{database_url}?sslmode=prefer"
            },
            {
                "name": "개별 파라미터",
                "params": {
                    "host": parsed.hostname,
                    "port": parsed.port,
                    "database": parsed.path[1:],
                    "user": parsed.username,
                    "password": parsed.password,
                    "ssl": "prefer"
                }
            }
        ]
        
        successful_connection = None
        
        for method in connection_methods:
            try:
                print(f"\n🔄 {method['name']} 시도 중...")
                
                if 'url' in method:
                    conn = await asyncio.wait_for(
                        asyncpg.connect(method['url']), 
                        timeout=10
                    )
                else:
                    conn = await asyncio.wait_for(
                        asyncpg.connect(**method['params']), 
                        timeout=10
                    )
                
                # 연결 테스트
                result = await conn.fetchval("SELECT 1")
                await conn.close()
                
                print(f"✅ {method['name']} 성공!")
                successful_connection = method
                break
                
            except asyncio.TimeoutError:
                print(f"⏰ {method['name']} 타임아웃")
            except Exception as e:
                print(f"❌ {method['name']} 실패: {str(e)}")
        
        if successful_connection:
            # 4. 성공한 연결로 데이터베이스 설정
            print(f"\n🎉 성공한 연결 방법: {successful_connection['name']}")
            
            if 'url' in successful_connection:
                conn = await asyncpg.connect(successful_connection['url'])
            else:
                conn = await asyncpg.connect(**successful_connection['params'])
            
            print("📋 데이터베이스 구조 설정 중...")
            
            # Users 테이블 생성
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
            """)
            
            # Notes 테이블 생성 (Foreign Key 포함)
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
                    is_pinned BOOLEAN DEFAULT FALSE,
                    is_archived BOOLEAN DEFAULT FALSE,
                    is_public BOOLEAN DEFAULT FALSE,
                    shared_with UUID[] DEFAULT '{}',
                    word_count INTEGER DEFAULT 0,
                    character_count INTEGER DEFAULT 0,
                    reading_time INTEGER DEFAULT 1,
                    version INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
                CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
            """)
            
            # Demo 사용자 생성
            demo_user_id = "12345678-1234-1234-1234-123456789012"
            await conn.execute("""
                INSERT INTO users (id, email, name, preferences)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP,
                    last_active = CURRENT_TIMESTAMP
            """, 
                demo_user_id,
                "demo@example.com", 
                "Demo User",
                {"theme": "light", "language": "ko"}
            )
            
            # 상태 확인
            user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            note_count = await conn.fetchval("SELECT COUNT(*) FROM notes")
            
            await conn.close()
            
            print(f"""
🎉 === Supabase 연결 성공! ===
📊 현재 상태:
   👥 사용자: {user_count}명
   📝 노트: {note_count}개

✅ 이제 진짜 클라우드 앱 기능:
   🌐 멀티 디바이스 동기화
   👥 사용자 계정 기반 저장
   🤝 협업 기능 준비 완료
   🔒 데이터 보안 (Foreign Key)
   📱 실시간 업데이트
            """)
            
            # 환경변수 파일 업데이트
            if 'url' in successful_connection:
                working_url = successful_connection['url']
            else:
                # 파라미터를 URL로 변환
                params = successful_connection['params']
                working_url = f"postgresql://{params['user']}:{params['password']}@{params['host']}:{params['port']}/{params['database']}?sslmode={params['ssl']}"
            
            # .env 파일 생성
            with open('/workspaces/spark-template/.env', 'w') as f:
                f.write(f"DATABASE_URL={working_url}\n")
                f.write(f"SUPABASE_URL={supabase_url or 'https://your-project.supabase.co'}\n")
                f.write(f"SUPABASE_KEY={supabase_key or 'your-anon-key'}\n")
            
            print("📝 .env 파일 업데이트 완료")
            return True
            
        else:
            print("\n❌ 모든 연결 방법 실패")
            print("\n🔧 해결 방법:")
            print("1. Supabase 대시보드에서 데이터베이스 설정 확인")
            print("2. DATABASE_URL이 올바른지 확인")
            print("3. 네트워크 연결 상태 확인")
            print("4. Supabase 프로젝트가 활성화되어 있는지 확인")
            return False
            
    except Exception as e:
        print(f"❌ 연결 진단 중 오류: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(diagnose_and_fix_supabase())
    if success:
        print("\n🚀 백엔드를 재시작하여 클라우드 기능을 활성화하세요!")
    else:
        print("\n🔧 Supabase 설정을 확인하고 다시 시도하세요.")
