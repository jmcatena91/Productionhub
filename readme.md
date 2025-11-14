# ProductionHub - Production Specification Helper

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
  - [Development Mode](#development-mode-quick-testing)
  - [Production Mode](#production-mode-using-gunicorn)

## Overview
This project is a simple web application that allows users to select product specifications and view the corresponding manufacturing and packaging details.

## Features
- **Dynamic Filtering**: Users can select specifications for LWC (Level wound Coil), Insulation, and Length.
- **Conditional Logic**: The app intelligently shows a "Partner LWC" dropdown only for "combo" LWC types.
- **Instant Results**: The corresponding data (Blade Size, Layers, Quantity per Pallet, and Box Pallet) is displayed immediately upon selection.
- **Frontend**: Built with HTML, Tailwind CSS, and vanilla JavaScript.
- **Backend**: A simple Python server using Flask.

## Project Structure
```
ProductionHub/
├── static
│   └── data
│       └── products.json
│   └── js
│       └── app.js 
├── templates/
│   └── index.html      # Main HTML file with all logic
├── app.py              # Flask server to serve the HTML file
├── start_server.sh     # Production deployment script
├── requirements.txt    # Python dependencies
└── readme.md           # This documentation file
```

## How to Run
There are two ways to run this application: for development or in a production-like environment using the provided script.

### Development Mode (Quick Testing)
This method runs the Flask app directly in debug mode.

1. **Install Dependencies**: It's recommended to use a virtual environment.
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install Flask # Or install from requirements.txt if available
```

2. **Run the App**:
```bash
python3 app.py
```

3. **Access**: The application will be running at http://0.0.0.0:8003.

### Production Mode (Using Gunicorn)
The start_server.sh script automates the setup and launch of the application using Gunicorn.

1. **Ensure Requirements**: Make sure you have a requirements.txt file with all dependencies (e.g., flask, gunicorn).

## Rollersite — Production Specification Helper

A small, modern Flask + static frontend app to look up production/packaging specs by product selections.

---

## Quick start

Prerequisites
- Python 3.10+ (the repo includes a `stats_website_venv` for reference)
- git (optional)

Clone (optional):

1. Create and activate a virtual environment (recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Run the app (development)

```bash
python app.py
```

Open http://localhost:8003 in your browser.

4. Production (simple)

Make `start_server.sh` executable and run it. The script will create/ensure a virtualenv, install dependencies and start Gunicorn.

```bash
chmod +x start_server.sh
./start_server.sh
```

By default the app listens on port 8003. You can run Gunicorn directly if you prefer:

```bash
gunicorn -w 3 -b 0.0.0.0:8003 app:app
```

---

## What this repo contains

- `app.py` — Flask server that serves `templates/index.html` and exposes `/api/products`.
- `static/` — frontend assets
  - `static/js/app.js` — main client JS for filtering and results
  - `static/data/products.json` — canonical product data
- `templates/index.html` — the single-page UI
- `requirements.txt` — Python dependencies
- `start_server.sh` — convenience script to run with Gunicorn

---

## Common changes you might make

- Change the listening port
  - Edit `app.py` (the `app.run(...)` call) when running with the dev server.
  - For Gunicorn, change the `-b` argument or set `PORT` in a wrapper script.

- Update product data
  - Edit `static/data/products.json`. Format expected: a JSON object { "items": [ ... ] } where each item has fields used by `app.js` (e.g. `lwc`, `partner`, `insulation`, `length`, `bladeSize`, `layers`, `qtyPerPallet`, `boxPallet`, `partNumber`).
  - After editing, reload the page — the client fetches `/api/products` on load.

- Change UI text/behavior
  - Edit `templates/index.html` or `static/js/app.js`. `app.js` contains the dropdown logic and result rendering.

- Add fields to the API
  - `app.py` serves the static JSON; to include computed fields, change `load_product_data()` and the response in `/api/products`.

---

## Debugging & Troubleshooting

- If the product list is empty in the browser
  - Check server logs: `python app.py` prints load attempts and errors.
  - Ensure `static/data/products.json` exists and contains valid JSON.

- JSON decode errors
  - Files with a UTF-8 BOM can cause issues. `app.py` already attempts to read with `encoding='utf-8-sig'`.

- Fetch errors in the browser console
  - Open the browser dev tools (Console / Network). `app.js` logs fetch status and errors.

- Port already in use
  - Use `ss -ltnp | grep 8003` or change the port.

---

## Quick API check

From a terminal you can verify the server is returning products:

```bash
curl -sS http://localhost:8003/api/products | jq .
```

(If you don't have `jq` just `curl http://localhost:8003/api/products`.)

---

## Minimal contract (for contributors)

- Input: browser requests to `/` and `/api/products`.
- Output: HTML UI and JSON product list { "items": [ ... ] }.
- Error modes: missing `products.json` or invalid JSON — server returns an empty `items` array and logs the error.

---

## Notes & next steps

- Add a small unit test or CI step to validate `static/data/products.json` is valid JSON.
- Consider adding environment variable support for ports and worker counts when running under Gunicorn.

If you'd like I can also:
- add a small `make test` or CI check that validates the JSON file,
- or add simple example entries to `static/data/products.json` and a tiny smoke test.

---

Enjoy — open an issue or ask if you want a CI check or automated deploy instructions.
