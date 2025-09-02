# Jihyung - Complete Project Setup Guide

## 🎯 Overview

This is a comprehensive AI-powered senpm run dev:fe       # Start frontend only (port 5178)ond brain application built with modern technologies:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + Python + WebSockets
- **AI Integration**: OpenAI GPT for intelligent features
- **Real-time**: WebSocket collaboration
- **Offline Support**: IndexedDB + Service Workers

## 🚀 Quick Start

### Option 1: Automated Setup
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

#### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

#### 2. Clone and Setup
```bash
git clone <your-repo-url> ai-second-brain
cd ai-second-brain
git checkout -b complete-upgrade
```

#### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Additional UI components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot
npm install framer-motion @tanstack/react-query axios lucide-react
npm install class-variance-authority clsx tailwind-merge react-hot-toast
```

#### 4. Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 5. Environment Configuration
```bash
# Frontend environment
echo "VITE_API_URL=http://localhost:8000" > .env.local
echo "VITE_WS_URL=ws://localhost:1234" >> .env.local

# Backend environment
echo "DATABASE_URL=sqlite:///./second_brain.db" > backend/.env
echo "OPENAI_API_KEY=your-key-here" >> backend/.env
```

## 📁 Project Structure

```
ai-second-brain/
├── src/                          # Frontend React Application
│   ├── components/               # Reusable React Components
│   │   ├── ui/                  # UI Components (buttons, cards, etc.)
│   │   ├── Layout/              # Layout components
│   │   ├── Calendar/            # Calendar-specific components
│   │   ├── CommandPalette/      # Command palette system
│   │   └── Copilot/            # AI copilot features
│   ├── pages/                   # Page-level components
│   │   ├── TodayScreen.tsx      # Today's overview
│   │   ├── NotesScreen.tsx      # Notes management
│   │   ├── TasksScreen.tsx      # Task management
│   │   └── CalendarScreen.tsx   # Calendar view
│   ├── hooks/                   # Custom React hooks
│   │   ├── useOfflineSync.ts    # Offline synchronization
│   │   ├── useTheme.ts          # Theme management
│   │   └── useCollaboration.ts  # Real-time collaboration
│   └── lib/                     # Utility libraries
│       ├── api.ts               # API client
│       └── utils.ts             # Helper functions
├── backend/                     # Python FastAPI Backend
│   ├── main.py                  # Main FastAPI application
│   ├── models/                  # Database models
│   ├── routes/                  # API route handlers
│   └── services/                # Business logic services
├── public/                      # Static assets
└── tests/                       # Test files
```

## 🛠️ Available Commands

### Development
```bash
npm run dev          # Start both frontend and backend
npm run dev:fe       # Start frontend only (port 5177)
npm run dev:be       # Start backend only (port 8000)
```

### Build & Deploy
```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy to Vercel
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run typecheck    # TypeScript type checking
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🌟 Key Features

### 1. **Smart Note-Taking**
- Rich text editor with markdown support
- AI-powered summarization and tagging
- Real-time collaborative editing
- Offline-first with sync capabilities

### 2. **Intelligent Task Management**
- Priority-based task organization
- AI-powered action suggestions
- Auto-scheduling based on preferences
- Time-blocking and focus sessions

### 3. **Calendar Integration**
- Full calendar view with drag-and-drop
- Time-blocking for deep work
- Meeting scheduling and management
- Smart suggestions for optimal scheduling

### 4. **AI-Powered Features**
- Content summarization
- Automatic tag generation
- Action item extraction
- Smart scheduling recommendations

### 5. **Real-time Collaboration**
- Live cursor tracking
- Simultaneous editing
- Presence indicators
- Conflict-free collaborative editing

### 6. **Offline Capabilities**
- Service worker for offline access
- IndexedDB for local data storage
- Background sync when online
- Progressive Web App (PWA) support

## 🔧 Configuration

### Frontend Environment Variables (.env.local)
```env
VITE_API_URL=http://localhost:8000          # Backend API URL
VITE_WS_URL=ws://localhost:1234             # WebSocket URL
VITE_APP_NAME=Jihyung               # Application name
VITE_APP_VERSION=2.0.0                      # Version number
```

### Backend Environment Variables (backend/.env)
```env
DATABASE_URL=sqlite:///./second_brain.db    # Database connection
OPENAI_API_KEY=your-key-here                # OpenAI API key
SECRET_KEY=your-secret-key-here             # JWT secret key
ENVIRONMENT=development                      # Environment type
HOST=0.0.0.0                               # Server host
PORT=8000                                   # Server port
```

## 🔌 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/today` - Today's dashboard data

### Notes API
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/{id}` - Update note
- `DELETE /api/notes/{id}` - Delete note

### Tasks API
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### AI Services
- `POST /api/ai/summarize` - Generate content summary
- `POST /api/ai/suggest-actions` - Get action suggestions
- `POST /api/ai/generate-tags` - Generate tags for content

### Real-time
- `WS /ws/{user_id}` - WebSocket connection for real-time features

## 🎨 UI Components

### Design System
- **Color Scheme**: Light/Dark mode support
- **Typography**: Consistent font hierarchy
- **Spacing**: 8px grid system
- **Components**: Radix UI + custom components

### Key Components
- `CommandPalette` - Global command interface
- `Calendar` - Full-featured calendar with time-blocking
- `CollaborativeEditor` - Real-time text editing
- `TaskManager` - Intelligent task organization
- `AIAssistant` - Contextual AI suggestions

## 📱 Progressive Web App (PWA)

The application includes PWA features:
- Offline functionality
- App-like experience
- Push notifications (planned)
- Background sync
- Install prompt

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run Playwright tests
```

### Backend Tests
```bash
cd backend
pytest                    # Run Python tests
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run deploy
```

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy `dist/` folder to your hosting service
3. Configure environment variables on your hosting platform

### Backend Deployment
1. Use Docker or deploy to services like Railway, Heroku, or DigitalOcean
2. Set production environment variables
3. Configure database (PostgreSQL recommended for production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Build Errors**
   - Run `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

2. **Backend Import Errors**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

3. **WebSocket Connection Issues**
   - Check if port 1234 is available
   - Verify backend is running

4. **Environment Variables Not Loading**
   - Ensure `.env.local` is in project root
   - Restart development server

### Getting Help

- Check the [Issues](link-to-issues) section
- Review the [Documentation](link-to-docs)
- Contact the development team

---

**Happy Coding! 🚀**
