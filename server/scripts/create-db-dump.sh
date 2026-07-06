#!/usr/bin/env bash

set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-server-db-1}"
DB_USER="${DB_USER:-careerscope}"
DB_NAME="${DB_NAME:-careerscope}"
DUMP_DIR="${DUMP_DIR:-dumps}"
DUMP_FILE="${DUMP_FILE:-careerscope.dump}"
CONTAINER_DUMP_PATH="${CONTAINER_DUMP_PATH:-/tmp/$DUMP_FILE}"

mkdir -p "$DUMP_DIR"

echo "Creating PostgreSQL custom dump..."
echo "Container: $DB_CONTAINER"
echo "Database:  $DB_NAME"
echo "User:      $DB_USER"
echo "Output:    $DUMP_DIR/$DUMP_FILE"

docker exec "$DB_CONTAINER" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$CONTAINER_DUMP_PATH"

docker cp "$DB_CONTAINER:$CONTAINER_DUMP_PATH" "$DUMP_DIR/$DUMP_FILE"

echo "Database dump created: $DUMP_DIR/$DUMP_FILE"
