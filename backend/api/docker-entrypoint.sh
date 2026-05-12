#!/bin/sh
set -e

echo "Pushing Prisma schema to database..."
cd /app && pnpm exec prisma db push --schema=prisma/schema.prisma --accept-data-loss

echo "Starting API server..."
exec "$@"
