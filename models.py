from datetime import datetime
from typing import Optional, Dict, Any, List
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    notes = db.relationship('Note', backref='user', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    sources = db.relationship('Source', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False, default='')
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text)
    tags = db.Column(db.JSON, default=list)
    links = db.Column(db.JSON, default=list)
    source_refs = db.Column(db.JSON, default=list)
    entities = db.Column(db.JSON, default=list)
    key_points = db.Column(db.JSON, default=list)
    open_questions = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'tags': self.tags or [],
            'links': self.links or [],
            'source_refs': self.source_refs or [],
            'entities': self.entities or [],
            'key_points': self.key_points or [],
            'open_questions': self.open_questions or [],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, default='')
    due_date = db.Column(db.DateTime, nullable=True, index=True)
    priority = db.Column(db.String(20), default='medium', index=True)  # low, medium, high, urgent
    assignee = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending', index=True)  # pending, in_progress, completed, cancelled
    recurring_rule = db.Column(db.Text, nullable=True)  # RRULE string for recurring tasks
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'priority': self.priority,
            'assignee': self.assignee,
            'status': self.status,
            'recurring_rule': self.recurring_rule,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'note_id': self.note_id,
            'user_id': self.user_id
        }

class Source(db.Model):
    __tablename__ = 'sources'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False, index=True)  # url, file, audio, youtube
    url = db.Column(db.String(2000), nullable=True)
    title = db.Column(db.String(500), nullable=False, default='')
    author = db.Column(db.String(255), nullable=True)
    content = db.Column(db.Text)
    transcript = db.Column(db.Text)
    highlights = db.Column(db.JSON, default=list)
    meta = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'type': self.type,
            'url': self.url,
            'title': self.title,
            'author': self.author,
            'content': self.content,
            'transcript': self.transcript,
            'highlights': self.highlights or [],
            'meta': self.meta or {},
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id
        }

class GraphEdge(db.Model):
    __tablename__ = 'graph_edges'
    
    id = db.Column(db.Integer, primary_key=True)
    from_id = db.Column(db.Integer, nullable=False, index=True)
    to_id = db.Column(db.Integer, nullable=False, index=True)
    from_type = db.Column(db.String(20), nullable=False)  # note, task, source
    to_type = db.Column(db.String(20), nullable=False)    # note, task, source
    edge_type = db.Column(db.String(20), nullable=False, index=True)  # ref, similar, topic
    weight = db.Column(db.Float, default=1.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    __table_args__ = (
        db.UniqueConstraint('from_id', 'to_id', 'from_type', 'to_type', 'edge_type'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'from_id': self.from_id,
            'to_id': self.to_id,
            'from_type': self.from_type,
            'to_type': self.to_type,
            'edge_type': self.edge_type,
            'weight': self.weight,
            'created_at': self.created_at.isoformat(),
            'user_id': self.user_id
        }

class UserPreference(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    focus_mode = db.Column(db.JSON, default=dict)
    daily_brief_time = db.Column(db.String(10), default='09:00')
    shortcuts = db.Column(db.JSON, default=dict)
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'focus_mode': self.focus_mode or {},
            'daily_brief_time': self.daily_brief_time,
            'shortcuts': self.shortcuts or {},
            'language': self.language,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }