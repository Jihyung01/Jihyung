from flask import Flask, Blueprint, request, jsonify, make_response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import os
import logging
import json
import re
from typing import Optional, List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.url_map.strict_slashes = False

# Environment configuration with safe defaults
class Config:
    def __init__(self):
        self.DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///ai_brain.db')
        self.OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
        self.DISABLE_AUTH = os.getenv('DISABLE_AUTH', 'true').lower() == 'true'
        self.API_TOKEN = os.getenv('API_TOKEN', 'dev-123')
        self.PORT = int(os.getenv('PORT', 8006))
        self.CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
        self.RATE_LIMIT = os.getenv('RATE_LIMIT', '50 per minute')
        self.USE_OPENAI = bool(self.OPENAI_API_KEY)
        
        if not self.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set. AI features will use fallback implementations.")

config = Config()

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = config.DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[config.RATE_LIMIT]
)

# CORS setup
if config.CORS_ORIGINS:
    origins = config.CORS_ORIGINS.split(',') if config.CORS_ORIGINS != '*' else '*'
    CORS(app, resources={r"/api/*": {"origins": origins}})

# Models
class Note(db.Model):
    __tablename__ = 'notes'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    content = Column(Text, nullable=False)
    tags = Column(JSON, default=list)
    source_type = Column(String(50), default='text')  # text, url, audio, file
    source_meta = Column(JSON, default=dict)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tasks = relationship("Task", back_populates="note")

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    status = Column(String(20), default='pending')  # pending, in_progress, completed
    priority = Column(String(10), default='medium')  # low, medium, high
    energy = Column(Integer, default=2)  # 1-3 scale
    due_at = Column(DateTime)
    repeat_rule = Column(String(255))  # RRULE or simple text
    parent_id = Column(Integer, ForeignKey('tasks.id'))
    note_id = Column(Integer, ForeignKey('notes.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    note = relationship("Note", back_populates="tasks")
    subtasks = relationship("Task", remote_side=[id])

class Event(db.Model):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    source = Column(String(50), default='manual')  # manual, calendar_sync, time_block
    external_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Authentication helper
def require_auth(f):
    def wrapper(*args, **kwargs):
        if config.DISABLE_AUTH:
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization', '')
        api_key = request.headers.get('x-api-key')
        token = api_key or (auth_header[7:] if auth_header.startswith('Bearer ') else '')
        
        if config.API_TOKEN and token == config.API_TOKEN:
            return f(*args, **kwargs)
        
        return jsonify({"error": "unauthorized"}), 401
    
    wrapper.__name__ = f.__name__
    return wrapper

# Preflight handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response("", 204)
        if config.CORS_ORIGINS:
            origin = request.headers.get('Origin')
            if config.CORS_ORIGINS == '*' or (origin and origin in config.CORS_ORIGINS.split(',')):
                response.headers['Access-Control-Allow-Origin'] = origin or '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-api-key'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

# API Blueprint
api = Blueprint('api', __name__, url_prefix='/api')

# Health check
@api.route('/health', methods=['GET', 'OPTIONS'])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})

# Notes endpoints
@api.route('/notes', methods=['GET'])
def get_notes():
    query = request.args.get('query', '')
    tags_param = request.args.get('tags', '')
    tags = [t.strip() for t in tags_param.split(',') if t.strip()] if tags_param else []
    
    notes_query = Note.query
    
    if query:
        notes_query = notes_query.filter(
            db.or_(
                Note.title.ilike(f'%{query}%'),
                Note.content.ilike(f'%{query}%')
            )
        )
    
    if tags:
        for tag in tags:
            notes_query = notes_query.filter(Note.tags.contains([tag]))
    
    notes = notes_query.order_by(Note.created_at.desc()).limit(50).all()
    
    return jsonify([{
        'id': note.id,
        'title': note.title,
        'content': note.content,
        'tags': note.tags or [],
        'source_type': note.source_type,
        'source_meta': note.source_meta or {},
        'summary': note.summary,
        'created_at': note.created_at.isoformat(),
        'updated_at': note.updated_at.isoformat()
    } for note in notes])

@api.route('/notes', methods=['POST'])
@require_auth
@limiter.limit("10 per minute")
def create_note():
    data = request.get_json() or {}
    
    note = Note(
        title=data.get('title', ''),
        content=data.get('content', ''),
        tags=data.get('tags', []),
        source_type=data.get('source_type', 'text'),
        source_meta=data.get('source_meta', {}),
        summary=data.get('summary')
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify({
        'created': True,
        'data': {
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'tags': note.tags or [],
            'source_type': note.source_type,
            'source_meta': note.source_meta or {},
            'summary': note.summary,
            'created_at': note.created_at.isoformat(),
            'updated_at': note.updated_at.isoformat()
        }
    }), 201

# Tasks endpoints
@api.route('/tasks', methods=['GET'])
def get_tasks():
    from_date = request.args.get('from')
    to_date = request.args.get('to')
    
    tasks_query = Task.query
    
    if from_date:
        tasks_query = tasks_query.filter(Task.due_at >= datetime.fromisoformat(from_date))
    if to_date:
        tasks_query = tasks_query.filter(Task.due_at <= datetime.fromisoformat(to_date))
    
    tasks = tasks_query.order_by(Task.created_at.desc()).limit(100).all()
    
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'priority': task.priority,
        'energy': task.energy,
        'due_at': task.due_at.isoformat() if task.due_at else None,
        'repeat_rule': task.repeat_rule,
        'parent_id': task.parent_id,
        'note_id': task.note_id,
        'created_at': task.created_at.isoformat(),
        'updated_at': task.updated_at.isoformat()
    } for task in tasks])

@api.route('/tasks/today', methods=['GET'])
def get_today_tasks():
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    # Get high priority, due today, or energy-matched tasks
    tasks = Task.query.filter(
        Task.status != 'completed',
        db.or_(
            Task.priority == 'high',
            db.and_(Task.due_at >= today, Task.due_at < tomorrow),
            Task.energy <= 2  # Low energy tasks for curation
        )
    ).order_by(
        Task.priority.desc(),
        Task.due_at.asc()
    ).limit(5).all()
    
    return jsonify([{
        'id': task.id,
        'title': task.title,
        'status': task.status,
        'priority': task.priority,
        'energy': task.energy,
        'due_at': task.due_at.isoformat() if task.due_at else None,
        'created_at': task.created_at.isoformat()
    } for task in tasks])

@api.route('/tasks', methods=['POST'])
@require_auth
@limiter.limit("20 per minute")
def create_task():
    data = request.get_json() or {}
    
    due_at = None
    if data.get('due_at'):
        try:
            due_at = datetime.fromisoformat(data['due_at'])
        except ValueError:
            pass
    
    task = Task(
        title=data.get('title', ''),
        status=data.get('status', 'pending'),
        priority=data.get('priority', 'medium'),
        energy=data.get('energy', 2),
        due_at=due_at,
        repeat_rule=data.get('repeat_rule'),
        parent_id=data.get('parent_id'),
        note_id=data.get('note_id')
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({
        'created': True,
        'data': {
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'priority': task.priority,
            'energy': task.energy,
            'due_at': task.due_at.isoformat() if task.due_at else None,
            'created_at': task.created_at.isoformat()
        }
    }), 201

@api.route('/tasks/<int:task_id>', methods=['PATCH'])
@require_auth
@limiter.limit("30 per minute")
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}
    
    if 'title' in data:
        task.title = data['title']
    if 'status' in data:
        task.status = data['status']
    if 'priority' in data:
        task.priority = data['priority']
    if 'energy' in data:
        task.energy = data['energy']
    if 'due_at' in data:
        try:
            task.due_at = datetime.fromisoformat(data['due_at']) if data['due_at'] else None
        except ValueError:
            pass
    
    task.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'updated': True,
        'data': {
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'priority': task.priority,
            'energy': task.energy,
            'due_at': task.due_at.isoformat() if task.due_at else None,
            'updated_at': task.updated_at.isoformat()
        }
    })

# AI Features with fallbacks
def fallback_summarize(text: str) -> str:
    """Simple extractive summarization when OpenAI is not available"""
    sentences = re.split(r'[.!?]+', text)
    # Take first and last sentences, or first 2 if short
    if len(sentences) >= 3:
        return f"{sentences[0].strip()}. {sentences[-2].strip()}."
    return text[:200] + "..." if len(text) > 200 else text

def fallback_extract_tasks(text: str) -> List[Dict[str, Any]]:
    """Rule-based task extraction when OpenAI is not available"""
    tasks = []
    lines = text.split('\n')
    
    task_patterns = [
        r'^[\s]*[-*•]\s*(.+)',  # Bullet points
        r'^[\s]*\d+\.\s*(.+)',  # Numbered lists
        r'(?:해야|할|해|하자|진행|처리|완료|작업|준비)\s*(.+)',  # Korean action words
        r'(?:TODO|todo|To-do|할일|태스크|작업)\s*:?\s*(.+)',  # Explicit task markers
    ]
    
    for line in lines:
        for pattern in task_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                task_text = match.group(1).strip()
                if len(task_text) > 3:  # Filter out very short matches
                    tasks.append({
                        'title': task_text,
                        'priority': 'medium',
                        'due': None
                    })
                break
    
    return tasks[:10]  # Limit to 10 tasks

@api.route('/summarize', methods=['POST'])
@require_auth
@limiter.limit("20 per minute")
def summarize_text():
    data = request.get_json() or {}
    text = data.get('text', '')
    style = data.get('style', 'concise')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    if config.USE_OPENAI:
        try:
            import openai
            client = openai.OpenAI(api_key=config.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"Summarize the following text in a {style} style. Keep it practical and actionable."},
                    {"role": "user", "content": text}
                ],
                max_tokens=300
            )
            
            summary = response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI summarization failed: {e}")
            summary = fallback_summarize(text)
    else:
        summary = fallback_summarize(text)
    
    return jsonify({"summary": summary})

@api.route('/extract-tasks', methods=['POST'])
@require_auth
@limiter.limit("15 per minute")
def extract_tasks_from_text():
    data = request.get_json() or {}
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    if config.USE_OPENAI:
        try:
            import openai
            client = openai.OpenAI(api_key=config.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """Extract actionable tasks from the text. Return ONLY a JSON array of objects with these fields:
- title: clear, actionable task description
- due: ISO date string if a date is mentioned, null otherwise  
- priority: "low", "medium", or "high"

Example: [{"title": "Review project proposal", "due": null, "priority": "medium"}]"""},
                    {"role": "user", "content": text}
                ],
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content.strip()
            extracted_data = json.loads(content)
            extracted_tasks = extracted_data if isinstance(extracted_data, list) else extracted_data.get('tasks', [])
        except Exception as e:
            logger.error(f"OpenAI task extraction failed: {e}")
            extracted_tasks = fallback_extract_tasks(text)
    else:
        extracted_tasks = fallback_extract_tasks(text)
    
    # Create tasks in database
    created_ids = []
    for task_data in extracted_tasks:
        due_at = None
        if task_data.get('due'):
            try:
                due_at = datetime.fromisoformat(task_data['due'])
            except (ValueError, TypeError):
                pass
        
        task = Task(
            title=task_data.get('title', ''),
            priority=task_data.get('priority', 'medium'),
            due_at=due_at
        )
        db.session.add(task)
        db.session.flush()
        created_ids.append(task.id)
    
    db.session.commit()
    
    return jsonify({
        "tasks": extracted_tasks,
        "created_ids": created_ids
    })

# Daily Brief
@api.route('/daily-brief', methods=['GET'])
def daily_brief():
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    # Get today's tasks
    today_tasks = Task.query.filter(
        Task.status != 'completed',
        Task.due_at >= today,
        Task.due_at < tomorrow
    ).order_by(Task.priority.desc()).limit(5).all()
    
    # Get recent notes (last 3 days)
    three_days_ago = datetime.now() - timedelta(days=3)
    recent_notes = Note.query.filter(
        Note.created_at >= three_days_ago
    ).order_by(Note.created_at.desc()).limit(3).all()
    
    # Get upcoming events
    upcoming_events = Event.query.filter(
        Event.start_at >= datetime.now(),
        Event.start_at < datetime.combine(tomorrow, datetime.min.time())
    ).order_by(Event.start_at).limit(5).all()
    
    return jsonify({
        "date": today.isoformat(),
        "top_tasks": [{
            'id': task.id,
            'title': task.title,
            'priority': task.priority,
            'due_at': task.due_at.isoformat() if task.due_at else None
        } for task in today_tasks],
        "time_blocks": [{
            'id': event.id,
            'title': event.title,
            'start_at': event.start_at.isoformat(),
            'end_at': event.end_at.isoformat()
        } for event in upcoming_events],
        "recent_notes": [{
            'id': note.id,
            'title': note.title,
            'content': note.content[:100] + "..." if len(note.content) > 100 else note.content,
            'created_at': note.created_at.isoformat()
        } for note in recent_notes],
        "summary": "오늘도 생산적인 하루 되세요! 🚀"
    })

# Calendar endpoints
@api.route('/calendar', methods=['GET'])
def get_calendar_events():
    from_date = request.args.get('from')
    to_date = request.args.get('to')
    
    events_query = Event.query
    
    if from_date:
        events_query = events_query.filter(Event.start_at >= datetime.fromisoformat(from_date))
    if to_date:
        events_query = events_query.filter(Event.end_at <= datetime.fromisoformat(to_date))
    
    events = events_query.order_by(Event.start_at).all()
    
    return jsonify([{
        'id': event.id,
        'title': event.title,
        'start': event.start_at.isoformat(),
        'end': event.end_at.isoformat(),
        'description': event.description
    } for event in events])

@api.route('/calendar', methods=['POST'])
@require_auth
@limiter.limit("30 per minute")
def create_calendar_event():
    data = request.get_json() or {}
    
    try:
        start_at = datetime.fromisoformat(data['start_at'])
        end_at = datetime.fromisoformat(data['end_at'])
    except (KeyError, ValueError):
        return jsonify({"error": "Invalid start_at or end_at"}), 400
    
    event = Event(
        title=data.get('title', ''),
        description=data.get('description', ''),
        start_at=start_at,
        end_at=end_at
    )
    
    db.session.add(event)
    db.session.commit()
    
    return jsonify({
        'created': True,
        'data': {
            'id': event.id,
            'title': event.title,
            'start': event.start_at.isoformat(),
            'end': event.end_at.isoformat(),
            'description': event.description
        }
    }), 201

# Search endpoint (basic implementation)
@api.route('/search', methods=['POST'])
def search_content():
    data = request.get_json() or {}
    query = data.get('query', '')
    filters = data.get('filters', {})
    
    if not query:
        return jsonify({"results": [], "total": 0})
    
    # Search notes
    notes = Note.query.filter(
        db.or_(
            Note.title.ilike(f'%{query}%'),
            Note.content.ilike(f'%{query}%')
        )
    ).limit(20).all()
    
    # Search tasks
    tasks = Task.query.filter(
        Task.title.ilike(f'%{query}%')
    ).limit(10).all()
    
    results = []
    
    # Add notes to results
    for note in notes:
        results.append({
            'type': 'note',
            'id': note.id,
            'title': note.title,
            'content': note.content[:200] + "..." if len(note.content) > 200 else note.content,
            'created_at': note.created_at.isoformat()
        })
    
    # Add tasks to results
    for task in tasks:
        results.append({
            'type': 'task',
            'id': task.id,
            'title': task.title,
            'status': task.status,
            'priority': task.priority,
            'created_at': task.created_at.isoformat()
        })
    
    return jsonify({
        "results": results,
        "total": len(results)
    })

# Register blueprint
app.register_blueprint(api)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Database initialization
def init_db():
    """Initialize database tables"""
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")

if __name__ == '__main__':
    # Initialize database
    with app.app_context():
        init_db()
    
    # Run app
    app.run(
        host='127.0.0.1',
        port=config.PORT,
        debug=True
    )