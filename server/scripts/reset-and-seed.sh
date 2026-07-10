#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SERVER_DIR/local.compose.yaml"

usage() {
  cat <<'EOF'
Usage: npm run db:reset [-- --yes]

Drops all local PostgreSQL data, reapplies Drizzle migrations, clears Redis
sessions, and runs both the auth-user and domain-data seeds.

Options:
  --yes  Skip the interactive RESET confirmation.
  -h, --help  Show this help text.
EOF
}

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
  --yes|'')
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

for command_name in docker npm curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is not available: $command_name" >&2
    exit 1
  fi
done

if [ ! -f "$SERVER_DIR/.env" ]; then
  echo "Missing $SERVER_DIR/.env. Create it from .env.example first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. "$SERVER_DIR/.env"
set +a

POSTGRES_USER="${POSTGRES_USER:-careerscope}"
POSTGRES_DB="${POSTGRES_DB:-careerscope}"
POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-5433}"
SERVER_PORT="${SERVER_PORT:-3030}"
BASE_URL="${BASE_URL:-http://localhost:$SERVER_PORT}"
CLIENT_ORIGIN="${CLIENT_ORIGIN:-${CLIENT_URL:-http://localhost:5173}}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

if [ "${1:-}" != "--yes" ]; then
  if [ ! -t 0 ]; then
    echo "Refusing a non-interactive database reset without --yes." >&2
    exit 1
  fi

  echo "WARNING: This permanently deletes all local CareerScope PostgreSQL data"
  echo "and clears all local Redis sessions."
  printf "Type RESET to continue: "
  read -r confirmation

  if [ "$confirmation" != "RESET" ]; then
    echo "Reset cancelled."
    exit 1
  fi
fi

cd "$SERVER_DIR"

server_stopped=false
restore_server_on_failure() {
  status=$?
  trap - EXIT INT TERM

  if [ "$status" -ne 0 ] && [ "$server_stopped" = true ]; then
    echo "Reset failed; restarting the API container before exiting." >&2
    compose up -d server || true
  fi

  exit "$status"
}
trap 'exit 130' INT
trap 'exit 143' TERM
trap restore_server_on_failure EXIT

echo "Starting PostgreSQL and Redis..."
compose up -d db redis

echo "Stopping the API during the database reset..."
compose stop server
server_stopped=true

echo "Dropping application and migration schemas..."
compose exec -T db psql \
  -v ON_ERROR_STOP=1 \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public AUTHORIZATION $POSTGRES_USER; GRANT ALL ON SCHEMA public TO public;"

echo "Applying Drizzle migrations..."
npm run db:migrate

echo "Clearing stale Redis sessions..."
compose exec -T redis redis-cli FLUSHDB

echo "Starting the API..."
compose up -d server
server_stopped=false

echo "Waiting for the API at $BASE_URL..."
attempt=0
until curl -fsS \
  -H "Origin: $CLIENT_ORIGIN" \
  "$BASE_URL/api/job-postings/active?page=1&limit=1" \
  >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "API did not become ready within 30 seconds." >&2
    compose logs --tail 100 server >&2 || true
    exit 1
  fi
  sleep 1
done

echo "Seeding Better Auth users..."
BASE_URL="$BASE_URL" CLIENT_ORIGIN="$CLIENT_ORIGIN" npm run db:seed:auth

echo "Seeding application data..."
POSTGRES_HOST=localhost POSTGRES_PORT="$POSTGRES_HOST_PORT" npm run db:seed

echo "Verifying reset results..."
compose exec -T db psql \
  -v ON_ERROR_STOP=1 \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c 'SELECT (SELECT count(*) FROM drizzle.__drizzle_migrations) AS migrations, (SELECT count(*) FROM "user") AS users, (SELECT count(*) FROM company) AS companies, (SELECT count(*) FROM job_posting) AS postings, (SELECT count(*) FROM job_application) AS applications, (SELECT count(*) FROM skill) AS skills;' \
  -c 'SELECT role, count(*) FROM "user" GROUP BY role ORDER BY role;'

echo "CareerScope local database reset and seed completed successfully."
