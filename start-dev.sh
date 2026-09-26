#!/bin/bash
export OMNIROUTE_BASE_URL="http://10.0.10.223:20128/v1"
export OMNIROUTE_API_KEY="sk-1a2610a1aca72e66-2f1f9d-f1fd9906"
export SUPABASE_URL="https://gtjtkocgzimmpqulkdwe.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0anRrb2NnemltbXBxdWxrZHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI3ODEyOCwiZXhwIjoyMTA1ODU0MTI4fQ.KIlIka_ciLFuV101rDej0hE3v1aciiu1KJIuPolfULs"
export PORT=3002

fuser -k 3000/tcp 3002/tcp 2>/dev/null
sleep 1

echo "Starting tRPC Server on port 3002..."
(cd apps/server && nohup npx tsx src/index.ts > /tmp/server-dev.log 2>&1 &)

echo "Starting Vite Dev Server on port 3000..."
(cd apps/web && nohup npx vite --port 3000 --host > /tmp/web-dev.log 2>&1 &)

sleep 3
echo "Checking running ports:"
ss -tlnp | grep -E "3000|3002"
