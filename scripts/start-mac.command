#!/bin/bash
# Mason Hub launcher (macOS). Double-click in Finder.
# First time only: run `chmod +x start-mac.command` so macOS lets it run.
cd "$(dirname "$0")/.."

# Clear Next.js cache (avoids OneDrive readlink issues).
rm -rf .next

# Install deps on first run.
if [ ! -d node_modules ]; then
  echo "Installing dependencies, one moment..."
  npm install
fi

echo "Starting Mason Hub..."
npm run dev &
SERVER_PID=$!

sleep 7
open "http://localhost:3000"

echo ""
echo "Mason Hub is running at http://localhost:3000"
echo "Press Ctrl+C in this window to stop."
wait $SERVER_PID
