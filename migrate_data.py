import json
import os
import sys

# Add the parent directory to the path so we can import app.py content
# Assuming app.py is in the same directory as this script
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Now import the app, db, and Product model from the new app.py
from app import app, db, Product 

def migrate_json_to_db():
    print("--- Starting Data Migration ---")
    
    # 1. Define file paths
    base_dir = os.path.abspath(os.path.dirname(__file__))
    data_file_path = os.path.join(base_dir, 'static', 'data', 'products.json')

    # 2. Load JSON data
    try:
        with open(data_file_path, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
            items = data.get('items', [])
            print(f"Loaded {len(items)} items from products.json.")
    except FileNotFoundError:
        print(f"Error: products.json not found at {data_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return

    # 3. Use Flask application context to interact with SQLAlchemy
    with app.app_context():
        # Check if the table is empty before populating
        if Product.query.count() > 0:
            print("Database already contains data. Skipping migration.")
            return

        # 4. Create database table if it doesn't exist
        db.create_all()

        # 5. Insert data
        new_products = []
        for item in items:
            # Ensure proper handling for missing 'partner' key in single LWCs
            partner_val = item.get('partner')

            new_products.append(Product(
                lwc=item['lwc'],
                partner=partner_val if partner_val else None,
                insulation=item['insulation'],
                length=str(item['length']), # Convert length to string for consistency
                bladeSize=str(item['bladeSize']),
                layers=str(item['layers']),
                qtyPerPallet=int(item['qtyPerPallet']),
                boxPallet=item['boxPallet']
            ))

        db.session.add_all(new_products)
        db.session.commit()
        print(f"Successfully migrated {len(new_products)} products to the database.")

if __name__ == '__main__':
    migrate_json_to_db()