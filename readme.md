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

2. **Make Script Executable**:
```bash
chmod +x start_server.sh
```

3. **Run the Script**:
```bash
./start_server.sh
```

The script will:
- Create a virtual environment at .venv if one doesn't exist
- Activate the virtual environment
- Install or update all dependencies from requirements.txt
- Stop any old Gunicorn processes running on port 8003
- Start the Gunicorn server in the background on port 8003 with 3 workers

### How to Stop the Production Server
To stop the specific Gunicorn server started by the script, run:
```bash
pkill -f "gunicorn.*:8003"
```

## Purpose
This project was created to help new production workers understand the production process and how to select the correct specifications for the product they are working on.