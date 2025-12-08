import json
import os
import sys
import subprocess

def ensure_venv():
    """
    Ensures the script is running inside the virtual environment.
    If not, it re-executes itself using the venv python.
    """
    base_dir = os.path.abspath(os.path.dirname(__file__))
    venv_dir = os.path.join(base_dir, 'stats_website_venv')
    venv_python = os.path.join(venv_dir, 'bin', 'python3')

    # If the venv doesn't exist, we can't auto-switch.
    if not os.path.exists(venv_python):
        print(f"Warning: Virtual environment not found at {venv_python}")
        return

    # Check if we are running in the correct venv by checking sys.prefix
    # os.path.realpath handles symlinks (important if venv is a symlink)
    current_prefix = os.path.realpath(sys.prefix)
    expected_prefix = os.path.realpath(venv_dir)

    # If prefixes don't match, we are not in the target venv.
    if current_prefix != expected_prefix:
        print(f"--- Switching to detected virtual environment: {venv_dir} ---")
        # Re-execute the script with the correct python
        try:
            # sys.argv includes the script name
            subprocess.check_call([venv_python] + sys.argv)
            sys.exit(0) # Exit the parent process after child finishes
        except subprocess.CalledProcessError as e:
            sys.exit(e.returncode)
        except Exception as e:
            print(f"Error switching to venv: {e}")
            sys.exit(1)

def migrate_data():
    # 1. Ensure Venv (Must run before imports that might fail)
    ensure_venv()

    # 2. Imports (Moved here so they don't crash the script before venv switch)
    sys.path.append(os.path.abspath(os.path.dirname(__file__)))
    try:
        from app import app, db, Product, User
    except ImportError as e:
        print(f"Critical Error: Could not import Flask Application. {e}")
        print("Ensure requirements are installed in the virtual environment.")
        return

    print("--- Starting System Migration ---")
    
    base_dir = os.path.abspath(os.path.dirname(__file__))
    data_file_path = os.path.join(base_dir, 'static', 'data', 'products.json')

    with app.app_context():
        # 3. Reset Database
        # User requested to run without manually deleting products.db.
        # We will drop all tables to ensure a fresh start.
        print("Resetting database (Dropping all tables)...")
        db.drop_all()
        print("Creating database tables...")
        db.create_all()

        # 4. Create Admin User
        # Since we dropped tables, we MUST recreate the admin.
        print("Creating default Admin user...")
        admin = User(username='Admin')
        admin.set_password('Admin123')
        db.session.add(admin)
        db.session.commit()
        print("Admin user created: Admin / Admin123")

        # 5. Migrate Products
        print("Loading products from JSON...")
        try:
            with open(data_file_path, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
                items = data.get('items', [])
        except FileNotFoundError:
            print("Error: products.json not found.")
            return

        new_products = []
        for item in items:
            try:
                # Handle "nan" or missing quantity gracefully
                qty = item.get('qtyPerPallet', '0')
                
                new_products.append(Product(
                    product_type=item.get('Type', 'Unknown'),
                    lwc=item.get('lwc', 'Unknown'),
                    partner=item.get('partner'),
                    insulation=item.get('insulation', 'Unknown'),
                    length=str(item.get('length', '0')),
                    bladeSize=str(item.get('bladeSize', '0')),
                    layers=str(item.get('layers', '0')),
                    qtyPerPallet=str(qty),
                    boxPallet=item.get('boxPallet', 'Unknown'),
                    partNumber=item.get('partNumber')
                ))
            except Exception as e:
                print(f"Skipping bad item: {e}")

        if new_products:
            db.session.add_all(new_products)
            db.session.commit()
            print(f"Successfully added {len(new_products)} products.")
        else:
            print("No products found in JSON to add.")

if __name__ == '__main__':
    migrate_data()