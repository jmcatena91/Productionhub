# 🏭 Rollersite - Production Specification Helper

![Python Version](https://img.shields.io/badge/python-3.10%2B-blue)
![Flask](https://img.shields.io/badge/flask-2.0%2B-green)
![Status](https://img.shields.io/badge/status-active-success)

**Rollersite** is a modern web application designed to help users quickly select product specifications (like LWC, Insulation, Length) and view corresponding manufacturing details (Blade Size, Layers, Pallet Qty, etc.). It features a robust Admin Dashboard for managing product data and ensures data consistency between the database and static files.

---

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ How to Run](#-how-to-run)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [📦 Managing Products](#-managing-products)
  - [Option 1: Admin Dashboard (Recommended)](#option-1-admin-dashboard-recommended)
  - [Option 2: Bulk Import (Initial Setup)](#option-2-bulk-import-initial-setup)
- [📂 Project Structure](#-project-structure)

---

## ✨ Key Features
*   **Dynamic Filtering**: Real-time filtering logic for LWC, Insulation, and Length.
*   **Instant Results**: immediate display of manufacturing specs (Blade Size, Layers, Box Pallet, etc.).
*   **Admin Dashboard**: Secure interface to Add, Edit, and Delete products.
*   **Auto-Sync**: Changes made in the Admin Dashboard roughly automatically sync to `products.json`.
*   **Authentication**: Secure login system for administrative tasks.

---

## 🚀 Quick Start
### Prerequisites
*   Python 3.10 or higher.
*   `pip` (Python package installer).

### Installation
1.  **Clone or Download** this repository.
2.  **Set up a Virtual Environment**:
    ```bash
    python3 -m venv stats_website_venv
    source stats_website_venv/bin/activate
    ```
3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

---

## 🛠️ How to Run

### Development Mode
Best for testing changes or local development.
1.  Activate your virtual environment (if not already active).
    ```bash
    source stats_website_venv/bin/activate
    ```
2.  Run the application:
    ```bash
    python3 app.py
    ```
3.  Open **http://localhost:8003** in your browser.

### Production Mode
Use the included helper script to run the application with **Gunicorn** (a production-grade WSGI server).
1.  Make the script executable:
    ```bash
    chmod +x start_server.sh
    ```
2.  Run the script:
    ```bash
    ./start_server.sh
    ```
    *   This script automatically sets up the environment, installs dependencies, and restarts the server in the background.

---

## 📦 Managing Products

There are two ways to manage product data in the system.

### Option 1: Admin Dashboard (Recommended)
This is the primary way to manage products. Information is stored in a database and automatically synced to `products.json`.

1.  Navigate to **`/admin/login`** (e.g., `http://localhost:8003/admin/login`).
2.  Log in with the default credentials:
    *   **Username**: `Admin`
    *   **Password**: `Admin123`
3.  Use the interface to **Add**, **Edit**, or **Delete** products.
4.  **Note**: Any changes made here are immediately live and saved to both the database and `static/data/products.json`.

### Option 2: Bulk Import (Initial Setup)
If you need to load a large dataset for the first time:

1.  Edit **`static/data/products.json`** with your product list.
2.  Run the migration script:
    ```bash
    # Ensure you are using the virtual environment python!
    ./stats_website_venv/bin/python3 migrate_data.py
    ```
3.  **Important**: The migration script will **SKIP** loading data if the database already contains products. To re-import from JSON, you must first clear the database.

### Utility Scripts
*   **`update_part_numbers.py`**: A helper script used to generate standardized Part Numbers from raw product data. It reads `products.json` and outputs `products_updated.json`. It does **not** update the live database directly.

---

## 📂 Project Structure

```text
rollersite/
├── app.py                  # Main Flask application & Admin routes
├── migrate_data.py         # Script to seed DB from JSON
├── start_server.sh         # Production startup script
├── update_part_numbers.py  # Utility for part number generation
├── requirements.txt        # Python dependencies
├── stats_website_venv/     # Virtual environment (do not commit)
├── static/
│   ├── data/
│   │   └── products.json   # JSON backup of product data
│   └── js/
│       └── app.js          # Frontend logic
└── templates/
    ├── index.html          # Main user interface
    ├── login.html          # Admin login page
    ├── admin_products.html # Admin dashboard
    └── admin_edit.html     # Add/Edit product form
```
