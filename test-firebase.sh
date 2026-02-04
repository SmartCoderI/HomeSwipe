#!/bin/bash

echo "🔥 Firebase Connection Test"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f "frontend/.env.local" ]; then
  echo "❌ ERROR: frontend/.env.local not found!"
  echo ""
  echo "Firebase credentials are missing. Please create frontend/.env.local with:"
  echo ""
  echo "VITE_FIREBASE_API_KEY=..."
  echo "VITE_FIREBASE_AUTH_DOMAIN=..."
  echo "VITE_FIREBASE_PROJECT_ID=..."
  echo "VITE_FIREBASE_STORAGE_BUCKET=..."
  echo "VITE_FIREBASE_MESSAGING_SENDER_ID=..."
  echo "VITE_FIREBASE_APP_ID=..."
  echo "VITE_FIREBASE_MEASUREMENT_ID=..."
  exit 1
fi

echo "✅ Found frontend/.env.local"
echo ""

# Check each Firebase variable
echo "📝 Checking Firebase environment variables:"
echo ""

FIREBASE_VARS=("VITE_FIREBASE_API_KEY" "VITE_FIREBASE_AUTH_DOMAIN" "VITE_FIREBASE_PROJECT_ID" "VITE_FIREBASE_STORAGE_BUCKET" "VITE_FIREBASE_MESSAGING_SENDER_ID" "VITE_FIREBASE_APP_ID" "VITE_FIREBASE_MEASUREMENT_ID")

ALL_SET=true
for VAR in "${FIREBASE_VARS[@]}"; do
  if grep -q "^${VAR}=" frontend/.env.local; then
    VALUE=$(grep "^${VAR}=" frontend/.env.local | cut -d '=' -f 2)
    if [ -z "$VALUE" ]; then
      echo "❌ ${VAR}: EMPTY"
      ALL_SET=false
    else
      # Show first 20 chars of value for verification
      PREVIEW="${VALUE:0:20}..."
      echo "✅ ${VAR}: ${PREVIEW}"
    fi
  else
    echo "❌ ${VAR}: MISSING"
    ALL_SET=false
  fi
done

echo ""

if [ "$ALL_SET" = true ]; then
  echo "✅ All Firebase variables are configured!"
  echo ""

  # Extract project ID for display
  PROJECT_ID=$(grep "^VITE_FIREBASE_PROJECT_ID=" frontend/.env.local | cut -d '=' -f 2)
  echo "🔥 Firebase Project: ${PROJECT_ID}"
  echo ""

  echo "📋 Next steps to verify connection:"
  echo ""
  echo "1. Make sure services are running:"
  echo "   ./restart.sh"
  echo ""
  echo "2. Open browser to http://localhost:3000"
  echo ""
  echo "3. Open DevTools Console (F12)"
  echo ""
  echo "4. Look for these messages:"
  echo "   ✅ Firebase initialized successfully"
  echo "   🔥 Project ID: ${PROJECT_ID}"
  echo ""
  echo "5. Test registration:"
  echo "   - Click 'Login' button"
  echo "   - Click 'Register'"
  echo "   - Create test account"
  echo ""
  echo "If registration works without errors, Firebase is fully connected! 🎉"
else
  echo "❌ Firebase configuration is incomplete!"
  echo ""
  echo "Please add missing variables to frontend/.env.local"
  echo ""
  echo "You can find your Firebase config at:"
  echo "https://console.firebase.google.com/project/homeswipe-50d93/settings/general"
  exit 1
fi

echo ""
echo "🔐 Security reminder:"
echo "   - Never commit .env.local to git"
echo "   - .env.local is already in .gitignore"
echo ""
