import json
import os
import sys

# Add the parent directory to the path so we can import app.py content
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import app, db, Product 

def migrate_json_to_db():
    print("--- Starting Data Migration ---")
    
    base_dir = os.path.abspath(os.path.dirname(__file__))
    data_file_path = os.path.join(base_dir, 'static', 'data', 'products.json')

    # Load JSON data
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

    with app.app_context():
        # Check if data exists
        if Product.query.count() > 0:
            print("Database already contains data. Skipping migration.")
            return

        db.create_all()

        new_products = []
        for i, item in enumerate(items):
            try:
                # SAFELY get the quantity, defaulting to 0 if missing or null
                raw_qty = item.get('qtyPerPallet')
                if raw_qty is None:
                    qty_val = 0
                else:
                    try:
                        qty_val = int(raw_qty)
                    except ValueError:
                        qty_val = 0

                # Handle partner field
                partner_val = item.get('partner')

                new_products.append(Product(
                    lwc=item.get('lwc', 'Unknown'),
                    partner=partner_val if partner_val else None,
                    insulation=item.get('insulation', 'Unknown'),
                    length=str(item.get('length', '0')),
                    bladeSize=str(item.get('bladeSize', '0')),
                    layers=str(item.get('layers', '0')),
                    qtyPerPallet=qty_val,
                    boxPallet=item.get('boxPallet', 'Unknown')
                ))
            except Exception as e:
                print(f"Warning: Skipping item at index {i} due to error: {e}")
                continue

        db.session.add_all(new_products)
        db.session.commit()
        print(f"Successfully migrated {len(new_products)} products to the database.")

if __name__ == '__main__':
    migrate_json_to_db()