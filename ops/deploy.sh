#!/usr/bin/env sh
set -eu

ROOT="${DEPLOY_ROOT:-/opt/ai-ops}"
RELEASE_SHA="${RELEASE_SHA:?RELEASE_SHA is required}"
ARCHIVE="${ARCHIVE:?ARCHIVE is required}"
RELEASE="$ROOT/releases/$RELEASE_SHA"

mkdir -p "$ROOT/releases" "$ROOT/shared"
test -f "$ROOT/shared/.env" || cp /dev/null "$ROOT/shared/.env"

if [ "${ACTION:-deploy}" = "rollback" ]; then
  test -L "$ROOT/previous"
  PREVIOUS="$(readlink -f "$ROOT/previous")"
  if [ -L "$ROOT/current" ]; then
    CURRENT="$(readlink -f "$ROOT/current")"
    (cd "$CURRENT" && docker compose down --remove-orphans) || true
  fi
  cd "$PREVIOUS"
  docker compose -p ai-ops --env-file "$ROOT/shared/.env" up -d --build
  ln -sfn "$PREVIOUS" "$ROOT/current"
  exit 0
fi

mkdir -p "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"
cd "$RELEASE"
cp "$ROOT/shared/.env" .env

docker compose build --pull
if [ -L "$ROOT/current" ]; then
  CURRENT="$(readlink -f "$ROOT/current")"
  (cd "$CURRENT" && docker compose down --remove-orphans) || true
fi
docker compose -p ai-ops up -d

PORT="$(grep '^AI_OPS_PORT=' .env | tail -n 1 | cut -d= -f2- || true)"
PORT="${PORT:-3000}"
attempt=0
until curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 30 ] || { docker compose -p ai-ops logs --tail=120; exit 1; }
  sleep 2
done

if [ -L "$ROOT/current" ]; then ln -sfn "$(readlink -f "$ROOT/current")" "$ROOT/previous"; fi
ln -sfn "$RELEASE" "$ROOT/current"

ls -1dt "$ROOT"/releases/* 2>/dev/null | tail -n +6 | xargs -r rm -rf
echo "AI OPS release $RELEASE_SHA is healthy on port $PORT"
