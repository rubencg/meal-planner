#!/usr/bin/env bash
# Levanta backend y frontend juntos en modo desarrollo.
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# El proxy de Vite (frontend/vite.config.ts) apunta fijo a localhost:3000,
# y el CORS del backend solo acepta localhost:5173.
BACKEND_PORT=3000
FRONTEND_PORT=5173
# Vite va probando puertos consecutivos si encuentra el suyo ocupado; se libera un
# rango para barrer procesos huérfanos de corridas previas que no quedaron en 5173.
FRONTEND_PORT_RANGE_END=5180
DB_PORT=5432

# Mata cualquier proceso que esté escuchando en el puerto dado, para no chocar con una
# instancia previa que quedó colgada. Usa lsof en Unix/Mac y netstat+taskkill en Git Bash (Windows).
free_port() {
  local port="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    for pid in $pids; do
      kill -9 "$pid" 2>/dev/null || true
    done
  else
    pids="$(netstat -ano 2>/dev/null | awk -v pat=":${port}$" '/LISTENING/ && $2 ~ pat {print $5}' | sort -u)"
    for pid in $pids; do
      [ -n "$pid" ] && [ "$pid" != "0" ] && taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
    done
  fi
}

# Instala dependencias si es la primera vez que se corre en esta máquina.
ensure_deps() {
  local app="$1"
  if [ ! -d "$DIR/$app/node_modules" ]; then
    echo "Instalando dependencias de $app..."
    (cd "$DIR/$app" && npm install)
  fi
}

# Postgres no lo levanta este script; solo avisa si no responde para que el error
# del backend no tome por sorpresa.
if ! (exec 3<>"/dev/tcp/127.0.0.1/$DB_PORT") 2>/dev/null; then
  echo "Aviso: Postgres no responde en localhost:$DB_PORT. El backend no podrá leer datos hasta que lo levantes."
fi

ensure_deps backend
ensure_deps frontend

echo "Liberando puertos $BACKEND_PORT (backend) y $FRONTEND_PORT-$FRONTEND_PORT_RANGE_END (frontend)..."
free_port "$BACKEND_PORT"
for port in $(seq "$FRONTEND_PORT" "$FRONTEND_PORT_RANGE_END"); do
  free_port "$port"
done

cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "Deteniendo backend y frontend..."
  kill 0 2>/dev/null
}
trap cleanup EXIT INT TERM

(cd "$DIR/backend" && PORT="$BACKEND_PORT" npm run dev) &
(cd "$DIR/frontend" && npm run dev) &

wait
