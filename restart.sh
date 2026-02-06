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

# Check Firebase configuration
echo "🔥 Checking Firebase configuration..."
if [ -f "frontend/.env.local" ]; then
  # Check for Firebase variables
  FIREBASE_VARS=("VITE_FIREBASE_API_KEY" "VITE_FIREBASE_AUTH_DOMAIN" "VITE_FIREBASE_PROJECT_ID" "VITE_FIREBASE_STORAGE_BUCKET" "VITE_FIREBASE_MESSAGING_SENDER_ID" "VITE_FIREBASE_APP_ID")

  ALL_SET=true
  for VAR in "${FIREBASE_VARS[@]}"; do
    if grep -q "^${VAR}=" frontend/.env.local; then
      VALUE=$(grep "^${VAR}=" frontend/.env.local | cut -d '=' -f 2)
      if [ -z "$VALUE" ]; then
        echo "   ❌ ${VAR} is empty"
        ALL_SET=false
      else
        echo "   ✅ ${VAR} is set"
      fi
    else
      echo "   ❌ ${VAR} is missing"
      ALL_SET=false
    fi
  done

  if [ "$ALL_SET" = true ]; then
    echo ""
    echo "✅ Firebase configuration complete!"
    echo "   Open browser console to verify connection:"
    echo "   Should see: '✅ Firebase initialized successfully'"
    echo "   Should see: '🔥 Project ID: homeswipe-50d93'"
  else
    echo ""
    echo "⚠️  Firebase configuration incomplete!"
    echo "   Please check frontend/.env.local"
  fi
else
  echo "   ❌ frontend/.env.local not found!"
  echo "   Firebase will not work without this file"
fi

echo ""
echo "📋 Services running:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000 (or next available port)"
echo ""
echo "🔍 Next steps:"
echo "   1. Open http://localhost:3000 in browser"
echo "   2. Press F12 to open DevTools Console"
echo "   3. Look for Firebase initialization messages"
echo ""
echo "✨ Done!"
