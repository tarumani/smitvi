#!/bin/sh
set -e

echo "[smitvi] Running database migrations..."
npx prisma migrate deploy

echo "[smitvi] Starting Next.js on :${PORT:-3000}"
exec node server.js
