# API Setup Verification - Jihyung

## ✅ Changes Made

### 1. Flask Blueprint Structure
- **Created API Blueprint** with `/api` prefix
- **Moved all routes** from `@app.route("/api/...")` to `@api.route("/...")`
- **Registered blueprint** with `app.register_blueprint(api)`
- **Added test endpoint** at `/api/test` for debugging

### 2. CORS Configuration
- **Updated CORS** to allow wildcard (`*`) for development
- **Environment variable** `ORIGINS=*` in `.env`
- **Flexible origins** handling in Flask-CORS setup

### 3. Vite Proxy Setup
- **Port changed** from 5174 to 5175
- **Host enabled** with `host: true` for Codespaces
- **WebSocket support** added with `ws: true`
- **Proxy maintained** at `/api` → `http://127.0.0.1:5000`

### 4. Environment Configuration
- **Simplified auth** with `DISABLE_AUTH=true` for development
- **API token** set to `dev-123` for consistency
- **Frontend env** at `.env.local` with `VITE_API_BASE=/api`

### 5. Package.json Updates
- **Dev script** updated to `vite --host --port 5175`
- **Ensures proper** Codespaces port exposure

## 🔧 Current API Routes

With the Blueprint structure, all routes are now under `/api` prefix:

### Core Routes
- `GET /api/health` - Health check
- `GET /api/test` - Debug endpoint (NEW)

### Notes API
- `GET /api/notes` - List notes with search/filter
- `POST /api/notes` - Create note
- `PUT /api/notes/<id>` - Update note
- `DELETE /api/notes/<id>` - Delete note

### Tasks API  
- `GET /api/tasks` - List tasks with date filters
- `POST /api/tasks` - Create task
- `PUT /api/tasks/<id>` - Update task
- `DELETE /api/tasks/<id>` - Delete task

### AI Processing
- `POST /api/extract-tasks` - Extract tasks from text
- `POST /api/summarize` - Summarize text
- `POST /api/summarize/yt` - YouTube analysis
- `POST /api/transcribe` - Audio transcription

### Calendar & Other
- `GET /api/daily-brief` - Get daily planning
- `GET /api/calendar` - Calendar events
- `POST /api/calendar` - Create calendar event
- `POST /api/upload/presign` - S3 presigned URL

## 🚀 How to Test

### 1. Start Backend
```bash
python app.py
```
Backend runs on http://localhost:5000

### 2. Start Frontend  
```bash
npm run dev
```
Frontend runs on http://localhost:5175 with Vite proxy

### 3. Verify API Access
In browser DevTools (Network tab):
- `GET /api/health` should return `{"status": "ok", ...}`
- `GET /api/test` should return `{"message": "API Blueprint working!", ...}`
- `GET /api/daily-brief` should return daily planning data

### 4. Expected Behavior
- ✅ **No 404 errors** on `/api/*` endpoints
- ✅ **No CORS errors** in browser console
- ✅ **Preflight OPTIONS** requests return 204
- ✅ **All API calls** proxied through Vite (same-origin)

## 🔍 Debugging Tips

### If API Still Returns 404:
1. Check backend console for startup errors
2. Verify `.env` file has required `OPENAI_API_KEY`
3. Test direct backend access: `curl http://localhost:5000/api/health`

### If CORS Errors Persist:
1. Ensure `ORIGINS=*` in backend `.env`
2. Restart both frontend and backend
3. Clear browser cache with `Ctrl+Shift+R`

### If Vite Proxy Fails:
1. Check if backend is running on port 5000
2. Verify Vite config proxy target points to `127.0.0.1:5000`
3. Clear Vite cache: `rm -rf node_modules/.vite && npm run dev`

## 📝 File Structure Summary

```
/workspaces/spark-template/
├── app.py                 # Flask app with Blueprint structure
├── vite.config.ts         # Vite config with proxy setup
├── package.json           # npm scripts updated
├── .env                   # Backend environment (ORIGINS=*)
├── .env.local             # Frontend environment (VITE_API_BASE=/api)
└── src/lib/api.ts         # API client (already correct)
```

## ✅ Final Verification Checklist

- [x] Flask Blueprint created with `/api` prefix
- [x] All routes moved to Blueprint structure  
- [x] CORS configured for development (`ORIGINS=*`)
- [x] Vite proxy setup maintained at `/api`
- [x] Port changed to 5175 for frontend
- [x] Auth simplified for development
- [x] Error handlers added (404 → JSON)
- [x] Test endpoint added for debugging
- [x] Documentation updated

The API routing issue should now be resolved. Frontend calls to `/api/*` will be proxied to the Flask backend which serves routes under the `/api` Blueprint prefix.