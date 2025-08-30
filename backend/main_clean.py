#!/usr/bin/env python3
"""
Simple and Clean Backend for Spark Template
Port: 8006 (unified)
All features preserved, syntax errors eliminated
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import uuid
from datetime import datetime, timedelta
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Spark Template API",
    version="2.0.0",
    description="Revolutionary AI-powered productivity backend"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (simple and reliable)
memory_storage = {
    "users": {},
    "notes": {},
    "tasks": {},
    "events": {},
    "ai_insights": {}
}

# Counter for IDs
counters = {"notes": 0, "tasks": 0, "events": 0}

def get_next_id(entity_type: str) -> int:
    counters[entity_type] += 1
    return counters[entity_type]

# Mock current user (for simplicity)
def get_current_user():
    return {
        "id": "demo-user-123",
        "name": "Demo User",
        "email": "demo@example.com"
    }

# ============= HEALTH & STATUS =============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Spark Template Backend is running",
        "port": 8006,
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Spark Template API v2.0 - Revolutionary AI Backend"}

# ============= NOTES API =============

@app.get("/api/notes")
async def get_notes(current_user: dict = Depends(get_current_user)):
    """Get all notes for current user"""
    try:
        user_notes = [note for note in memory_storage["notes"].values() 
                     if note.get("user_id") == current_user["id"]]
        logger.info(f"✅ Retrieved {len(user_notes)} notes")
        return user_notes
    except Exception as e:
        logger.error(f"❌ Error getting notes: {e}")
        return []

@app.post("/api/notes")
async def create_note(note_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new note"""
    try:
        note_id = get_next_id("notes")
        now = datetime.utcnow().isoformat()
        
        note = {
            "id": note_id,
            "user_id": current_user["id"],
            "title": note_data.get("title", "New Note"),
            "content": note_data.get("content", ""),
            "tags": note_data.get("tags", []),
            "created_at": now,
            "updated_at": now,
            "version": 1,
            "is_archived": False
        }
        
        memory_storage["notes"][note_id] = note
        logger.info(f"✅ Created note: {note_id}")
        return note
    except Exception as e:
        logger.error(f"❌ Error creating note: {e}")
        raise HTTPException(status_code=500, detail="Failed to create note")

@app.put("/api/notes/{note_id}")
async def update_note(note_id: int, note_data: dict, current_user: dict = Depends(get_current_user)):
    """Update an existing note"""
    try:
        if note_id not in memory_storage["notes"]:
            raise HTTPException(status_code=404, detail="Note not found")
        
        note = memory_storage["notes"][note_id]
        if note["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update fields
        note.update({
            "title": note_data.get("title", note["title"]),
            "content": note_data.get("content", note["content"]),
            "tags": note_data.get("tags", note["tags"]),
            "updated_at": datetime.utcnow().isoformat(),
            "version": note["version"] + 1
        })
        
        logger.info(f"✅ Updated note: {note_id}")
        return note
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating note: {e}")
        raise HTTPException(status_code=500, detail="Failed to update note")

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a note"""
    try:
        if note_id not in memory_storage["notes"]:
            raise HTTPException(status_code=404, detail="Note not found")
        
        note = memory_storage["notes"][note_id]
        if note["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        del memory_storage["notes"][note_id]
        logger.info(f"✅ Deleted note: {note_id}")
        return {"message": "Note deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting note: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete note")

# ============= TASKS API =============

@app.get("/api/tasks")
async def get_tasks(current_user: dict = Depends(get_current_user)):
    """Get all tasks for current user"""
    try:
        user_tasks = [task for task in memory_storage["tasks"].values() 
                     if task.get("user_id") == current_user["id"]]
        logger.info(f"✅ Retrieved {len(user_tasks)} tasks")
        return user_tasks
    except Exception as e:
        logger.error(f"❌ Error getting tasks: {e}")
        return []

@app.post("/api/tasks")
async def create_task(task_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new task"""
    try:
        task_id = get_next_id("tasks")
        now = datetime.utcnow().isoformat()
        
        task = {
            "id": task_id,
            "user_id": current_user["id"],
            "title": task_data.get("title", "New Task"),
            "description": task_data.get("description", ""),
            "status": task_data.get("status", "pending"),
            "priority": task_data.get("priority", "medium"),
            "due_date": task_data.get("due_date"),
            "all_day": task_data.get("all_day", True),
            "tags": task_data.get("tags", []),
            "created_at": now,
            "updated_at": now,
            "completed_at": None
        }
        
        memory_storage["tasks"][task_id] = task
        logger.info(f"✅ Created task: {task_id}")
        return task
    except Exception as e:
        logger.error(f"❌ Error creating task: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task")

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: int, task_data: dict, current_user: dict = Depends(get_current_user)):
    """Update an existing task"""
    try:
        if task_id not in memory_storage["tasks"]:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = memory_storage["tasks"][task_id]
        if task["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Handle completion
        if task_data.get("status") == "completed" and task["status"] != "completed":
            task_data["completed_at"] = datetime.utcnow().isoformat()
        
        # Update fields
        task.update({
            "title": task_data.get("title", task["title"]),
            "description": task_data.get("description", task["description"]),
            "status": task_data.get("status", task["status"]),
            "priority": task_data.get("priority", task["priority"]),
            "due_date": task_data.get("due_date", task["due_date"]),
            "all_day": task_data.get("all_day", task["all_day"]),
            "tags": task_data.get("tags", task["tags"]),
            "updated_at": datetime.utcnow().isoformat(),
            "completed_at": task_data.get("completed_at", task.get("completed_at"))
        })
        
        logger.info(f"✅ Updated task: {task_id}")
        return task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating task: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a task"""
    try:
        if task_id not in memory_storage["tasks"]:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = memory_storage["tasks"][task_id]
        if task["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        del memory_storage["tasks"][task_id]
        logger.info(f"✅ Deleted task: {task_id}")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting task: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task")

# ============= CALENDAR API =============

@app.get("/api/calendar")
async def get_calendar_events(
    from_date: str = Query(alias="from"),
    to_date: str = Query(alias="to"),
    current_user: dict = Depends(get_current_user)
):
    """Get calendar events for date range"""
    try:
        events = []
        
        # Get calendar events
        for event in memory_storage["events"].values():
            if event.get("user_id") == current_user["id"]:
                events.append(event)
        
        # Get tasks as calendar events
        for task in memory_storage["tasks"].values():
            if (task.get("user_id") == current_user["id"] and 
                task.get("due_date") and 
                task.get("status") != "completed"):
                
                task_event = {
                    "id": f"task-{task['id']}",
                    "title": f"📋 {task['title']}",
                    "description": task.get("description", ""),
                    "start_at": task["due_date"],
                    "end_at": task["due_date"],
                    "type": "task",
                    "priority": task.get("priority", "medium"),
                    "all_day": task.get("all_day", True)
                }
                events.append(task_event)
        
        logger.info(f"✅ Retrieved {len(events)} calendar events")
        return events
    except Exception as e:
        logger.error(f"❌ Error getting calendar events: {e}")
        return []

@app.post("/api/calendar/events")
async def create_calendar_event(event_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new calendar event"""
    try:
        event_id = get_next_id("events")
        now = datetime.utcnow().isoformat()
        
        event = {
            "id": event_id,
            "user_id": current_user["id"],
            "title": event_data.get("title", "New Event"),
            "description": event_data.get("description", ""),
            "start_at": event_data.get("start_at") or event_data.get("start"),
            "end_at": event_data.get("end_at") or event_data.get("end"),
            "location": event_data.get("location", ""),
            "attendees": event_data.get("attendees", []),
            "created_at": now,
            "updated_at": now
        }
        
        memory_storage["events"][event_id] = event
        logger.info(f"✅ Created calendar event: {event_id}")
        return event
    except Exception as e:
        logger.error(f"❌ Error creating calendar event: {e}")
        raise HTTPException(status_code=500, detail="Failed to create calendar event")

# ============= AI FEATURES =============

@app.post("/api/ai/chat")
async def ai_chat(request_data: dict, current_user: dict = Depends(get_current_user)):
    """AI Chat endpoint - mock intelligent responses"""
    try:
        message = request_data.get("message", "")
        context = request_data.get("context", {})
        
        # Mock AI response based on message content
        if "task" in message.lower():
            response = {
                "response": "I can help you create and manage tasks! What would you like to accomplish?",
                "suggestions": [
                    "Create a new task",
                    "Show my pending tasks",
                    "Set task priorities"
                ],
                "confidence": 0.95
            }
        elif "note" in message.lower():
            response = {
                "response": "I can assist with note-taking and organization. What do you want to document?",
                "suggestions": [
                    "Create a new note",
                    "Search existing notes",
                    "Organize by tags"
                ],
                "confidence": 0.93
            }
        elif "schedule" in message.lower() or "calendar" in message.lower():
            response = {
                "response": "Let me help you with scheduling and calendar management!",
                "suggestions": [
                    "View today's schedule",
                    "Create an event",
                    "Find available time slots"
                ],
                "confidence": 0.97
            }
        else:
            response = {
                "response": "I'm your AI assistant for productivity and organization. How can I help you today?",
                "suggestions": [
                    "Manage tasks",
                    "Take notes",
                    "Schedule events",
                    "Get insights"
                ],
                "confidence": 0.90
            }
        
        logger.info(f"✅ AI chat response generated")
        return response
    except Exception as e:
        logger.error(f"❌ Error in AI chat: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")

@app.get("/api/ai/insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    """Get AI-generated insights"""
    try:
        # Generate mock insights based on user data
        tasks_count = len([t for t in memory_storage["tasks"].values() if t.get("user_id") == current_user["id"]])
        notes_count = len([n for n in memory_storage["notes"].values() if n.get("user_id") == current_user["id"]])
        
        insights = {
            "productivity_score": min(95, 70 + (tasks_count * 2) + (notes_count * 1)),
            "total_tasks": tasks_count,
            "total_notes": notes_count,
            "suggestions": [
                "Great progress on task completion!",
                "Consider organizing notes with more tags",
                "Schedule regular review sessions"
            ],
            "weekly_trend": "📈 Productivity trending upward",
            "next_actions": [
                "Review pending tasks",
                "Create daily planning routine",
                "Set priority levels for better focus"
            ]
        }
        
        logger.info(f"✅ Generated AI insights")
        return insights
    except Exception as e:
        logger.error(f"❌ Error generating insights: {e}")
        return {"error": "Unable to generate insights"}

# ============= SEARCH =============

@app.get("/api/search")
async def search_content(q: str, current_user: dict = Depends(get_current_user)):
    """Search across notes and tasks"""
    try:
        results = {
            "notes": [],
            "tasks": [],
            "total": 0
        }
        
        query = q.lower()
        
        # Search notes
        for note in memory_storage["notes"].values():
            if (note.get("user_id") == current_user["id"] and
                (query in note.get("title", "").lower() or 
                 query in note.get("content", "").lower() or
                 any(query in tag.lower() for tag in note.get("tags", [])))):
                results["notes"].append(note)
        
        # Search tasks
        for task in memory_storage["tasks"].values():
            if (task.get("user_id") == current_user["id"] and
                (query in task.get("title", "").lower() or 
                 query in task.get("description", "").lower() or
                 any(query in tag.lower() for tag in task.get("tags", [])))):
                results["tasks"].append(task)
        
        results["total"] = len(results["notes"]) + len(results["tasks"])
        logger.info(f"✅ Search found {results['total']} results for '{q}'")
        return results
    except Exception as e:
        logger.error(f"❌ Error in search: {e}")
        return {"notes": [], "tasks": [], "total": 0}

# ============= MAIN =============

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8006))
    logger.info(f"🚀 Starting Spark Template Backend on port {port}")
    logger.info(f"💎 All features enabled: Notes, Tasks, Calendar, AI")
    logger.info(f"🔧 Health check: http://localhost:{port}/api/health")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )
