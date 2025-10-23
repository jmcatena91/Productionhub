from flask import Flask, render_template, jsonify, send_from_directory
import json
import os
import logging # Import the logging module

# Initialize the Flask application
app = Flask(__name__, static_folder='static')

# Configure logging
logging.basicConfig(level=logging.INFO) # Set logging level to INFO

# Load product data from JSON file
def load_product_data():
    """Loads product data from static/data/products.json."""
    data_file = "" # Initialize to avoid potential error if path construction fails
    try:
        # Construct path relative to the app.py file's directory
        basedir = os.path.abspath(os.path.dirname(__file__))
        data_file = os.path.join(basedir, 'static', 'data', 'products.json')
        app.logger.info(f"Attempting to load data from: {data_file}")

        # --- NEW DEBUGGING STEP ---
        try:
            with open(data_file, 'r', encoding='utf-8-sig') as f: # Try reading with UTF-8-SIG first to handle BOM
                first_char = f.read(1)
                if first_char:
                    app.logger.info(f"First character read (UTF-8-SIG): '{first_char}' (Code: {ord(first_char)})")
                else:
                    app.logger.warning("File appears empty when read with UTF-8-SIG encoding.")
                    return {"items": []} # File is empty
        except Exception as e:
             app.logger.warning(f"Could not read first char with UTF-8-SIG: {e}")
             # Fallback to default encoding if utf-8-sig fails (though BOM is likely)
             with open(data_file, 'r') as f:
                first_char = f.read(1)
                if first_char:
                     app.logger.info(f"First character read (default encoding): '{first_char}' (Code: {ord(first_char)})")
                else:
                     app.logger.warning("File appears empty when read with default encoding.")
                     return {"items": []} # File is empty
        # --- END NEW DEBUGGING STEP ---

        # Now try to load the JSON (this will likely still fail, but we logged the first char)
        # Using utf-8-sig here too is often helpful
        with open(data_file, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            app.logger.info(f"Successfully loaded {len(data.get('items', []))} items from JSON.")
            return data
            
    except FileNotFoundError:
        app.logger.error(f"Error: products.json not found at {data_file}")
        return {"items": []}
    except json.JSONDecodeError as e:
        # This error is expected if the first char wasn't '{'
        app.logger.error(f"Error decoding JSON from {data_file}: {e}")
        return {"items": []}
    except Exception as e:
        # Log other unexpected errors
        app.logger.error(f"An unexpected error occurred loading product data: {e}", exc_info=True)
        return {"items": []}

# Define the main route for your website
@app.route('/')
def home():
    """
    Handles requests to the root URL ('/') and serves the index.html file.
    """
    app.logger.info("Serving index.html")
    return render_template('index.html')

# API endpoint to get product data
@app.route('/api/products')
def get_products():
    """
    Returns the product data as JSON via the /api/products endpoint.
    """
    app.logger.info("Request received for /api/products")
    product_data = load_product_data()
    # Check if data loading failed (indicated by empty items list potentially)
    if not product_data or not product_data.get("items"):
         app.logger.warning("Returning empty product list to client.")
    else:
         app.logger.info(f"Sending product data with {len(product_data['items'])} items.")
    return jsonify(product_data)

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    """Handles 404 errors by returning the index page (or a custom 404 page)."""
    app.logger.warning(f"404 error encountered: {e}")
    # You might want a dedicated 404.html template later
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    """Handles 500 internal server errors."""
    app.logger.error(f"500 Internal Server Error: {e}", exc_info=True) # Log the full error traceback
    return jsonify(error="Internal server error. Please check server logs."), 500

if __name__ == '__main__':
    # Runs the app in debug mode when executed directly (python app.py)
    app.logger.info("Starting Flask development server...")
    # Consider removing debug=True for production deployments
    app.run(host='0.0.0.0', port=8003, debug=True)