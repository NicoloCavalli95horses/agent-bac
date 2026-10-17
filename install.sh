#!/bin/bash
set -Eeuo pipefail

# Prevent running the entire script as root
if [ "$EUID" -eq 0 ]; then
  echo "ERROR: Run this script as your normal user, not with sudo."
  exit 1
fi

# Resolve project directory independently of the current directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env as a shell configuration file
if [ -f "$DIR/.env" ]; then
  set -a
  source "$DIR/.env"
  set +a
fi

# Load NVM for non-interactive shells, if installed
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
fi

echo "Installing system dependencies..."

# Install system dependencies
sudo apt update
sudo apt install -y python3-venv libnss3-tools

# Verify Python
if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required."
  exit 1
fi

# Ceate venv using an absolute path
echo "Installing Python dependencies..."

if [ ! -x "$DIR/.venv/bin/python" ]; then
  python3 -m venv "$DIR/.venv"
fi

"$DIR/.venv/bin/python" -m pip install \
  -r "$DIR/requirements.txt"

echo "Python dependencies installed."

# Verify Node.js and npm versions
if ! command -v node >/dev/null 2>&1 ||
   ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node.js v24 and npm 11.x are required."
  echo "If using NVM, install and select Node.js 24 first."
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
NPM_MAJOR="$(npm -v | cut -d. -f1)"

if [ "$NODE_MAJOR" != "24" ] || [ "$NPM_MAJOR" != "11" ]; then
  echo "ERROR: Expected Node.js v24.x and npm 11.x."
  echo "Found Node.js $(node -v), npm $(npm -v)"
  exit 1
fi

# Configure mitmproxy CA for Chrome
echo "Configuring mitmproxy CA for Chrome..."

CA="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"
NSSDB="$HOME/.pki/nssdb"

# Generate the CA if missing and wait for it to appear
if [ ! -f "$CA" ]; then
  "$DIR/.venv/bin/mitmdump" --listen-port 0 \
    > /tmp/mitmproxy-ca-init.log 2>&1 &
  MITM_PID=$!

  for _ in $(seq 1 50); do
    [ -f "$CA" ] && break
    kill -0 "$MITM_PID" 2>/dev/null || break
    sleep 0.1
  done

  kill "$MITM_PID" 2>/dev/null || true
  wait "$MITM_PID" 2>/dev/null || true
fi

if [ ! -f "$CA" ]; then
  echo "ERROR: Could not generate mitmproxy CA."
  cat /tmp/mitmproxy-ca-init.log
  exit 1
fi

# Create NSS database only if missing or uninitialized
mkdir -p "$NSSDB"

if ! certutil -L -d "sql:$NSSDB" >/dev/null 2>&1; then
  certutil -N -d "sql:$NSSDB" --empty-password
fi

# Replace the CA entry to avoid stale certificates
certutil -D -d "sql:$NSSDB" -n "mitmproxy" \
  >/dev/null 2>&1 || true

certutil -A \
  -d "sql:$NSSDB" \
  -n "mitmproxy" \
  -t "C,," \
  -i "$CA"

# Verify the imported certificate
certutil -L -d "sql:$NSSDB" -n "mitmproxy"

echo "mitmproxy CA configured successfully."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."

cd "$DIR/src/playwright"

# Prefer reproducible installation when lockfile exists
if [ -f package-lock.json ]; then
  npm ci
else
  echo "WARNING: package-lock.json missing; using npm install."
  npm install
fi

echo "Node.js dependencies installed."
echo "Installation completed successfully."