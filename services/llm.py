import os
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.default_model = "gpt-4o"
        self.transcribe_model = "gpt-4o-transcribe"
    
    def extract_tasks(self, text: str) -> List[Dict[str, Any]]:
        """Extract actionable tasks from text using LLM."""
        
        system_prompt = """당신은 텍스트에서 실행 가능한 태스크를 추출하는 전문가입니다.

다음 규칙을 따라 태스크를 추출하세요:
1. 명령형 동사로 시작하는 구체적인 행동만 추출
2. 모호하거나 추상적인 내용은 제외
3. 기한이 명시되지 않은 경우 null로 설정
4. 우선순위는 텍스트의 맥락을 바탕으로 추론 (low, medium, high, urgent)
5. 담당자가 명시되지 않은 경우 null로 설정

응답은 반드시 JSON 배열 형태로만 반환하세요:
[
  {
    "title": "구체적인 태스크 제목",
    "description": "부가 설명 (선택사항)",
    "due_date": "YYYY-MM-DD" 또는 null,
    "priority": "low|medium|high|urgent",
    "assignee": "담당자 이름" 또는 null
  }
]

텍스트에 실행 가능한 태스크가 없으면 빈 배열 []을 반환하세요."""

        try:
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            tasks = json.loads(result)
            
            # Ensure it's a list
            if isinstance(tasks, dict) and 'tasks' in tasks:
                tasks = tasks['tasks']
            elif not isinstance(tasks, list):
                tasks = []
            
            return tasks
            
        except Exception as e:
            logger.error(f"Task extraction failed: {e}")
            return []
    
    def summarize(self, text: str, style: str = "concise") -> str:
        """Summarize text with specified style."""
        
        style_prompts = {
            "concise": "3-5개의 핵심 포인트를 간결하게 요약하세요.",
            "detailed": "주요 내용과 세부사항을 포함하여 상세히 요약하세요.",
            "bullet": "불릿 포인트 형태로 핵심 내용을 정리하세요.",
            "executive": "경영진을 위한 요약 보고서 형태로 작성하세요."
        }
        
        system_prompt = f"""당신은 전문적인 요약 작성자입니다.

다음 지침을 따라 요약을 작성하세요:
1. {style_prompts.get(style, style_prompts['concise'])}
2. 원문의 핵심 메시지와 주요 논점을 유지하세요
3. 출처나 근거가 언급된 경우 포함하세요
4. 명확하고 이해하기 쉬운 한국어로 작성하세요
5. 개인적인 의견이나 추측은 포함하지 마세요

요약은 마크다운 형식으로 작성하여 가독성을 높이세요."""

        try:
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.4
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            raise
    
    def transcribe_audio(self, audio_file) -> str:
        """Transcribe audio file using OpenAI's transcription API."""
        
        try:
            # Reset file pointer to beginning
            audio_file.seek(0)
            
            response = self.client.audio.transcriptions.create(
                model=self.transcribe_model,
                file=audio_file,
                language="ko"  # Korean language hint
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Audio transcription failed: {e}")
            raise
    
    def generate_daily_brief(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate daily brief from task list."""
        
        system_prompt = """당신은 ADHD 친화적인 일일 계획 도우미입니다.

주어진 태스크 목록을 바탕으로 다음을 포함한 일일 브리프를 생성하세요:

1. **상위 3-5 우선순위**: 오늘 집중해야 할 가장 중요한 태스크들
2. **시간 블록 제안**: 각 태스크에 대한 예상 소요시간과 최적 실행 시간
3. **포커스 모드 제안**: 25분 집중 세션으로 나눈 실행 계획
4. **미완료 태스크**: 이전에 완료하지 못한 태스크들의 carry-over

응답은 JSON 형태로 반환하되, 내용은 마크다운으로 포맷하세요:
{
  "top_tasks": [
    {
      "id": 태스크_ID,
      "title": "태스크 제목",
      "priority": "우선순위",
      "estimated_time": "예상 소요시간 (분)",
      "best_time": "최적 실행 시간대"
    }
  ],
  "time_blocks": [
    {
      "time": "09:00-09:25",
      "task": "태스크 제목",
      "type": "focus|break|admin"
    }
  ],
  "focus_sessions": [
    {
      "session": 1,
      "duration": 25,
      "task": "태스크 제목",
      "break_after": 5
    }
  ],
  "carry_over": ["미완료 태스크들"],
  "motivation": "오늘 하루를 위한 동기부여 메시지"
}

ADHD 특성을 고려하여:
- 한 번에 하나의 태스크에만 집중하도록 안내
- 과도한 계획보다는 실현 가능한 목표 설정
- 명확한 시작점과 완료 기준 제시
- 정기적인 휴식과 보상 포함"""

        try:
            tasks_text = json.dumps(tasks, ensure_ascii=False, indent=2)
            
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"다음 태스크들을 바탕으로 일일 브리프를 생성해주세요:\n\n{tasks_text}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.6
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Daily brief generation failed: {e}")
            return {
                "top_tasks": [],
                "time_blocks": [],
                "focus_sessions": [],
                "carry_over": [],
                "motivation": "오늘도 할 수 있습니다! 한 번에 하나씩 차근차근 진행해보세요."
            }
    
    def structure_voice_note(self, transcript: str) -> Dict[str, Any]:
        """Structure voice note into organized sections."""
        
        system_prompt = """당신은 음성 노트를 구조화하는 전문가입니다.

음성 전사 텍스트를 다음 섹션으로 구조화하세요:

1. **요약** (3-5문장): 전체 내용의 핵심 요지
2. **키토픽**: 주요 주제들을 키워드로 추출
3. **액션아이템**: 실행 가능한 항목들 (담당자/기한/우선순위 포함)
4. **결정사항**: 내려진 결정이나 합의사항
5. **열린 질문**: 해결되지 않은 질문이나 고민거리

응답은 JSON 형태로 반환하세요:
{
  "summary": "전체 요약",
  "key_topics": ["주제1", "주제2", "주제3"],
  "action_items": [
    {
      "title": "해야 할 일",
      "assignee": "담당자 또는 null",
      "due_date": "기한 또는 null",
      "priority": "low|medium|high|urgent"
    }
  ],
  "decisions": ["결정사항1", "결정사항2"],
  "open_questions": ["질문1", "질문2"]
}

불명확한 기한은 제안 형태로 추론하되, 추론임을 명시하세요."""

        try:
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": transcript}
                ],
                response_format={"type": "json_object"},
                temperature=0.4
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Voice note structuring failed: {e}")
            return {
                "summary": transcript[:500] + "..." if len(transcript) > 500 else transcript,
                "key_topics": [],
                "action_items": [],
                "decisions": [],
                "open_questions": []
            }