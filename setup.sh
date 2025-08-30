#!/bin/bash

# AI Second Brain - Complete Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 AI Second Brain - Complete Setup Script"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Starting complete project setup..."

# 1. Frontend Dependencies Check
print_info "Step 1: Checking Frontend Dependencies"
if command -v npm &> /dev/null; then
    print_status "npm found"
    npm --version
else
    print_error "npm not found. Please install Node.js and npm"
    exit 1
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
npm install

# 2. Python/Backend Setup
print_info "Step 2: Setting up Python Backend"
if command -v python3 &> /dev/null; then
    print_status "Python3 found"
    python3 --version
else
    print_error "Python3 not found. Please install Python 3.8+"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
print_info "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt 2>/dev/null || pip install fastapi uvicorn python-dotenv websockets python-multipart sqlalchemy psycopg2-binary openai python-jose passlib

# 3. Environment Configuration
print_info "Step 3: Environment Configuration"

# Check .env.local
if [ ! -f ".env.local" ]; then
    print_info "Creating .env.local file..."
    cat > .env.local << EOF
VITE_API_URL=http://localhost:8008
VITE_WS_URL=ws://localhost:1234
VITE_APP_NAME=AI Second Brain
VITE_APP_VERSION=2.0.0
EOF
    print_status ".env.local created"
else
    print_status ".env.local already exists"
fi

# Check backend/.env
if [ ! -f "backend/.env" ]; then
    print_info "Creating backend/.env file..."
    mkdir -p backend
    cat > backend/.env << EOF
DATABASE_URL=sqlite:///./second_brain.db
OPENAI_API_KEY=your-key-here
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8008
EOF
    print_status "backend/.env created"
else
    print_status "backend/.env already exists"
fi

# 4. Directory Structure
print_info "Step 4: Creating Directory Structure"
mkdir -p src/components/ui
mkdir -p src/components/Layout
mkdir -p src/components/Copilot
mkdir -p src/components/Calendar
mkdir -p src/components/Inbox
mkdir -p src/components/CommandPalette
mkdir -p src/pages
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p backend/models
mkdir -p backend/routes
mkdir -p backend/services
mkdir -p public
mkdir -p tests
print_status "Directory structure created"

# 5. Build Test
print_info "Step 5: Testing Build Process"
if npm run build; then
    print_status "Frontend build successful"
else
    print_warning "Frontend build failed - check for errors above"
fi

# 6. Backend Test
print_info "Step 6: Testing Backend"
if python3 -c "import sys; sys.path.append('./backend'); from main import app; print('Backend imports successful')"; then
    print_status "Backend imports successful"
else
    print_warning "Backend test failed - check for errors above"
fi

# 7. Final Summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
print_info "Project Structure:"
echo "├── src/                    # Frontend source code"
echo "│   ├── components/         # React components"
echo "│   ├── pages/             # Page components"
echo "│   ├── hooks/             # Custom React hooks"
echo "│   └── lib/               # Utility libraries"
echo "├── backend/               # Python FastAPI backend"
echo "│   ├── models/            # Database models"
echo "│   ├── routes/            # API routes"
echo "│   └── services/          # Business logic"
echo "└── public/                # Static assets"
echo ""
print_info "Available Commands:"
echo "🖥️  Frontend Development:     npm run dev"
echo "🐍  Backend Development:      npm run dev:be"
echo "🚀  Full Development:         npm run dev"
echo "🏗️  Build for Production:     npm run build"
echo "🧪  Run Tests:               npm run test"
echo ""
print_info "Environment Files:"
echo "📄  Frontend: .env.local"
echo "📄  Backend:  backend/.env"
echo ""
print_warning "Next Steps:"
echo "1. Update backend/.env with your actual API keys"
echo "2. Run 'npm run dev' to start both frontend and backend"
echo "3. Open http://localhost:5177 in your browser"
echo ""
print_status "Happy coding! 🚀"
