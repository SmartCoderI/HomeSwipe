#!/bin/bash

echo "🛑 Stopping frontend and backend..."

# Kill backend (port 3001)
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Kill frontend (any node process running vite)
pkill -f "vite" 2>/dev/null

sleep 1

echo "✅ Services stopped"
echo ""
echo "🚀 Starting backend..."

# Start backend
cd backend
nohup node index.js > /dev/null 2>&1 &
cd ..
sleep 2

echo "✅ Backend started on port 3001"
echo ""
echo "🚀 Starting frontend..."

# Start frontend
cd frontend
nohup npm run dev > /dev/null 2>&1 &
cd ..
sleep 3

echo "✅ Frontend started"
echo ""
echo "📋 Services running:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000 (or next available port)"
echo ""
echo "✨ Done!"
