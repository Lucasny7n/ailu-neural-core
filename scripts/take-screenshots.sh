#!/bin/bash

# Ensure we're in the right directory
cd "$(dirname "$0")/.."

echo "Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

echo "Waiting for development server to be ready on port 5173..."
while ! nc -z localhost 5173; do   
  sleep 1
done
echo "Development server is ready."

echo "Taking screenshots via Playwright..."
npx playwright test tests/screenshots.spec.ts

echo "Screenshots saved to tests-results or screenshots folder."
echo "Killing development server..."
kill $DEV_SERVER_PID
