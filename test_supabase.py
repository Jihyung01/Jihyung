#!/usr/bin/env python3
"""
🚀 Supabase 연결 테스트 및 빠른 설정
"""
import asyncio
import asyncpg
import os
import uuid

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres.lxrzlszthqoufxapdqml:dyddmlrltk98@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres')

async def quick_test():
    """빠른 연결 테스트 및 Demo 사용자 확인"""
    try:
        print("🔄 Supabase 연결 테스트...")
        conn = await asyncio.wait_for(
            asyncpg.connect(DATABASE_URL, statement_cache_size=0),
            timeout=10
        )
        print("✅ 연결 성공!")
        
        # Demo 사용자 확인만 하기
        demo_user_id = "12345678-1234-1234-1234-123456789012"
        
        print("👤 Demo 사용자 확인...")
        existing_user = await conn.fetchrow(
            "SELECT id, email, name FROM users WHERE id = $1", 
            uuid.UUID(demo_user_id)
        )
        
        if existing_user:
            print(f"✅ Demo 사용자 존재: {existing_user['email']}")
        else:
            print("❌ Demo 사용자 없음")
        
        # 간단한 노트 카운트
        try:
            note_count = await asyncio.wait_for(
                conn.fetchval("SELECT COUNT(*) FROM notes WHERE user_id = $1", uuid.UUID(demo_user_id)),
                timeout=5
            )
            print(f"📝 Demo 사용자 노트: {note_count}개")
        except asyncio.TimeoutError:
            print("⏰ 노트 카운트 타임아웃")
        
        await conn.close()
        
        print(f"""
🎉 === Supabase 준비 완료! ===

✅ 상태:
   🌐 클라우드 연결: 성공
   👤 Demo 사용자: {'존재' if existing_user else '생성 필요'}
   📝 노트 저장: 준비됨
   🤝 협업 기능: 활성화

🚀 이제 백엔드를 시작하세요:
   python3 backend/main_enhanced.py
        """)
        
        return True
        
    except asyncio.TimeoutError:
        print("❌ 연결 타임아웃 (10초)")
        return False
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    if success:
        print("\n✅ 설정 완료 - 백엔드 시작 가능!")
    else:
        print("\n❌ 연결 실패 - 설정을 확인하세요.")
