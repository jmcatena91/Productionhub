#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
VENV_DIR="stats_website_venv"
PORT="8003"
# Get the absolute path of the directory where the script is located
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Navigate to the script's directory ---
cd "$APP_DIR"

# --- Create virtual environment if it doesn't exist ---
if [ ! -d "$VENV_DIR" ]; then
    echo "--- Creating virtual environment ($VENV_DIR)... ---"
    python3 -m venv $VENV_DIR
fi

# --- Define VENV executables ---
PIP_BIN="$VENV_DIR/bin/pip"
GUNICORN_BIN="$VENV_DIR/bin/gunicorn"

# --- Install/update dependencies from requirements.txt ---
echo "--- Installing/updating dependencies... ---"
"$PIP_BIN" install --upgrade pip > /dev/null
"$PIP_BIN" install -r requirements.txt > /dev/null

# --- Stop any old Gunicorn processes running on the target port ---
echo "--- Stopping any old Gunicorn processes on port $PORT... ---"
# The '|| true' prevents the script from failing if no process is found to kill.
pkill -f "gunicorn.*:$PORT" || true
sleep 1 # Give the port a moment to be released

# --- Starting Gunicorn server in the background... ---
echo "--- Starting Gunicorn on port $PORT in the background... ---"
# --daemon flag runs the process in the background
"$GUNICORN_BIN" --bind "0.0.0.0:$PORT" --workers 3 --daemon app:app

echo ""
echo "--- Server is running. ---"
echo "You can access it at http://<your_server_ip>:$PORT"
echo "To stop this specific server, run: pkill -f \"gunicorn.*:$PORT\""
