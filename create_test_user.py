#!/usr/bin/env python3
"""
테스트용 사용자 생성 스크립트
"""
import asyncio
import asyncpg
import os
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_user():
    """테스트 사용자 생성"""
    try:
        # 데이터베이스 연결
        conn = await asyncpg.connect(DATABASE_URL)
        
        # 기존 사용자 확인
        existing_user = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", 
            "test@example.com"
        )
        
        if existing_user:
            print("테스트 사용자가 이미 존재합니다.")
            await conn.close()
            return
        
        # 비밀번호 해시
        hashed_password = pwd_context.hash("test123")
        
        # 사용자 생성
        user_id = await conn.fetchval(
            '''INSERT INTO users (name, email, password_hash) 
               VALUES ($1, $2, $3) RETURNING id''',
            "Test User", "test@example.com", hashed_password
        )
        
        print(f"테스트 사용자가 생성되었습니다:")
        print(f"ID: {user_id}")
        print(f"이메일: test@example.com")
        print(f"비밀번호: test123")
        
        await conn.close()
        
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    asyncio.run(create_test_user())
