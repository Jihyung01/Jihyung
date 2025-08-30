import re
import logging
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse, parse_qs
import requests
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

logger = logging.getLogger(__name__)

class YouTubeService:
    def __init__(self):
        self.formatter = TextFormatter()
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from various URL formats."""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
            r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def get_video_metadata(self, video_id: str) -> Dict[str, Any]:
        """Get video metadata (title, duration, etc.) using oEmbed API."""
        try:
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            response = requests.get(oembed_url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return {
                'title': data.get('title', ''),
                'author': data.get('author_name', ''),
                'thumbnail': data.get('thumbnail_url', ''),
                'duration': None  # oEmbed doesn't provide duration
            }
        except Exception as e:
            logger.warning(f"Failed to get video metadata: {e}")
            return {
                'title': f'YouTube Video {video_id}',
                'author': '',
                'thumbnail': '',
                'duration': None
            }
    
    def get_transcript(self, video_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get transcript with timestamps from YouTube."""
        try:
            # Try to get Korean transcript first, then English, then auto-generated
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            transcript = None
            
            # Priority order: manual Korean > manual English > auto Korean > auto English
            try:
                transcript = transcript_list.find_manually_created_transcript(['ko'])
            except:
                try:
                    transcript = transcript_list.find_manually_created_transcript(['en'])
                except:
                    try:
                        transcript = transcript_list.find_generated_transcript(['ko'])
                    except:
                        try:
                            transcript = transcript_list.find_generated_transcript(['en'])
                        except:
                            pass
            
            if not transcript:
                raise Exception("No transcript available")
            
            return transcript.fetch()
            
        except Exception as e:
            logger.error(f"Failed to get transcript for video {video_id}: {e}")
            return None
    
    def create_chapters(self, transcript: List[Dict[str, Any]], chapter_duration: int = 300) -> List[Dict[str, Any]]:
        """Create chapters from transcript based on time intervals."""
        if not transcript:
            return []
        
        chapters = []
        current_chapter = {
            'start_time': 0,
            'end_time': 0,
            'text': '',
            'title': ''
        }
        
        for entry in transcript:
            entry_start = entry['start']
            entry_text = entry['text']
            
            # If this entry starts a new chapter
            if entry_start >= current_chapter['start_time'] + chapter_duration:
                if current_chapter['text']:
                    # Finalize current chapter
                    current_chapter['end_time'] = entry_start
                    current_chapter['title'] = self._generate_chapter_title(current_chapter['text'])
                    chapters.append(current_chapter)
                
                # Start new chapter
                current_chapter = {
                    'start_time': entry_start,
                    'end_time': entry_start,
                    'text': entry_text,
                    'title': ''
                }
            else:
                # Add to current chapter
                current_chapter['text'] += ' ' + entry_text
        
        # Add final chapter
        if current_chapter['text']:
            current_chapter['end_time'] = transcript[-1]['start'] + transcript[-1].get('duration', 0)
            current_chapter['title'] = self._generate_chapter_title(current_chapter['text'])
            chapters.append(current_chapter)
        
        return chapters
    
    def _generate_chapter_title(self, text: str) -> str:
        """Generate a chapter title from text content."""
        # Simple approach: take first meaningful sentence or first 50 characters
        sentences = text.split('.')
        first_sentence = sentences[0].strip()
        
        if len(first_sentence) > 50:
            return first_sentence[:47] + "..."
        elif len(first_sentence) > 10:
            return first_sentence
        else:
            return text[:50] + "..." if len(text) > 50 else text
    
    def format_timestamp(self, seconds: float) -> str:
        """Format seconds to YouTube timestamp format (e.g., '1:23:45')."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        
        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes}:{secs:02d}"
    
    def summarize_video(self, url: str) -> Dict[str, Any]:
        """Summarize YouTube video with chapters and timestamps."""
        try:
            # Extract video ID
            video_id = self.extract_video_id(url)
            if not video_id:
                raise ValueError("Invalid YouTube URL")
            
            # Get metadata
            metadata = self.get_video_metadata(video_id)
            
            # Get transcript
            transcript = self.get_transcript(video_id)
            if not transcript:
                raise ValueError("No transcript available for this video")
            
            # Create full transcript text
            transcript_text = self.formatter.format_transcript(transcript)
            
            # Create chapters
            chapters = self.create_chapters(transcript, chapter_duration=300)  # 5-minute chapters
            
            # Format chapters with timestamps
            formatted_chapters = []
            for chapter in chapters:
                formatted_chapters.append({
                    'title': chapter['title'],
                    'start_time': chapter['start_time'],
                    'end_time': chapter['end_time'],
                    'timestamp': self.format_timestamp(chapter['start_time']),
                    'url': f"https://www.youtube.com/watch?v={video_id}&t={int(chapter['start_time'])}s",
                    'summary': chapter['text'][:200] + "..." if len(chapter['text']) > 200 else chapter['text']
                })
            
            # Generate key quotes with timestamps
            key_quotes = self._extract_key_quotes(transcript)
            
            return {
                'ok': True,
                'video_id': video_id,
                'url': url,
                'title': metadata['title'],
                'author': metadata['author'],
                'thumbnail': metadata['thumbnail'],
                'transcript_text': transcript_text,
                'chapters': formatted_chapters,
                'key_quotes': key_quotes,
                'total_duration': self.format_timestamp(transcript[-1]['start'] + transcript[-1].get('duration', 0)) if transcript else '0:00'
            }
            
        except Exception as e:
            logger.error(f"YouTube summarization failed: {e}")
            return {
                'ok': False,
                'error': str(e),
                'video_id': None,
                'transcript_text': '',
                'chapters': []
            }
    
    def _extract_key_quotes(self, transcript: List[Dict[str, Any]], num_quotes: int = 5) -> List[Dict[str, Any]]:
        """Extract key quotes from transcript based on sentence completeness and length."""
        if not transcript:
            return []
        
        quotes = []
        current_sentence = ""
        sentence_start_time = 0
        
        for entry in transcript:
            text = entry['text'].strip()
            start_time = entry['start']
            
            if not current_sentence:
                sentence_start_time = start_time
            
            current_sentence += " " + text
            
            # Check if sentence is complete (ends with . ! ?)
            if re.search(r'[.!?]\s*$', current_sentence):
                # Check if sentence is substantial (more than 20 characters)
                if len(current_sentence.strip()) > 20:
                    quotes.append({
                        'text': current_sentence.strip(),
                        'start_time': sentence_start_time,
                        'timestamp': self.format_timestamp(sentence_start_time),
                        'url': f"&t={int(sentence_start_time)}s"
                    })
                
                current_sentence = ""
        
        # Sort by relevance (longer sentences first) and return top quotes
        quotes.sort(key=lambda x: len(x['text']), reverse=True)
        return quotes[:num_quotes]