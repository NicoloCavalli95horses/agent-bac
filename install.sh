#!/bin/bash

set -e

# read from .env
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$DIR/.env" ]; then
  export $(grep -v '^#' "$DIR/.env" | xargs)
fi

echo "Installing system dependencies..."
sudo apt update

echo "Installing Python dependencies..."

pip install -r "$DIR/requirements.txt"

echo "Python dependencies installed."

echo "Installing Node.js dependencies..."

cd "$DIR/src/playwright"
npm install

echo "Node.js dependencies installed."

echo "Installation completed successfully."