#!/bin/bash

#    echo "VITE_API_BASE=http://localhost:8006" > .env.localJihyung - Startup Script
echo "🚀 Starting Jihyung..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Please copy .env.example to .env and configure your settings."
    exit 1
fi

# Check if .env.local exists for frontend
if [ ! -f .env.local ]; then
    echo "ℹ️  Creating .env.local for frontend..."
    echo "VITE_API_BASE=http://localhost:5000" > .env.local
fi

echo "📦 Installing dependencies..."

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "🗄️  Setting up database..."
# Run database migrations
alembic upgrade head

echo "🌟 Starting servers..."

# Start backend in background
echo "Starting Flask backend on http://localhost:8006..."
python app.py &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
echo "Starting Vite frontend on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Jihyung is running!"
echo "📊 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8006"
echo "📖 API Docs: http://localhost:8006/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C to cleanup
trap cleanup SIGINT

# Wait for either process to exit
wait