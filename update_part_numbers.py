import json
import os

def process_products_clean_display():
    source_path = 'static/data/products.json'
    output_path = 'static/data/products_updated.json'
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found.")
        return

    print(f"Reading from: {source_path}")
    
    with open(source_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)

    items = data.get('items', [])
    new_items = []

    # Helper to clean strings for Part Number generation
    def clean_for_part_number(val):
        if not val: return ""
        return str(val).replace('/', '').replace('-', '').replace(' ', '')

    for item in items:
        raw_length = str(item.get('length', ''))

        # --- LOGIC 1: Handle Split ---
        if raw_length == "80/82":
            lengths_to_create = ["80", "82"] # Intentionally no zero padding here for the display logic
            
            for len_val in lengths_to_create:
                new_item = item.copy()
                
                # 1. Calculate Part Number (Needs 3 digits, e.g., '080')
                padded_len = len_val.zfill(3)
                
                p_type = new_item.get('Type', '')
                p_lwc = clean_for_part_number(new_item.get('lwc'))
                p_partner = clean_for_part_number(new_item.get('partner'))
                p_ins = clean_for_part_number(new_item.get('insulation'))
                # Part number uses padded length
                new_item['partNumber'] = f"{p_type}{p_lwc}{p_partner}{p_ins}{padded_len}"
                
                # 2. Set Display Length (No zero padding, e.g., '80')
                new_item['length'] = len_val
                
                new_items.append(new_item)

        # --- LOGIC 2: Handle Standard Items ---
        else:
            # 1. Calculate Part Number (Needs 3 digits)
            if raw_length.isdigit():
                # If it's a number like "30", pad it to "030" for the Part Number
                padded_len = raw_length.zfill(3)
            else:
                # If it's complex like "15-35", leave it alone
                padded_len = raw_length

            p_type = item.get('Type', '')
            p_lwc = clean_for_part_number(item.get('lwc'))
            p_partner = clean_for_part_number(item.get('partner'))
            p_ins = clean_for_part_number(item.get('insulation'))
            # Clean the padded length for the part number string
            p_len_clean = clean_for_part_number(padded_len)

            item['partNumber'] = f"{p_type}{p_lwc}{p_partner}{p_ins}{p_len_clean}"

            # 2. Set Display Length (Strip zeros if it looks like a padded number)
            # e.g., "030" -> "30", but keep "100" as "100"
            if raw_length.isdigit():
                # lstrip('0') removes leading zeros. "030" -> "30".
                # "005" -> "5".
                # "0" -> "" (empty string), so 'or "0"' handles the edge case of actual zero.
                item['length'] = raw_length.lstrip('0') or "0"
            
            new_items.append(item)

    # --- SAVING: Compact Format ---
    print(f"Processed {len(items)} original items.")
    print(f"Total items now: {len(new_items)}")
    print(f"Saving to {output_path}...")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('{\n  "items": [\n')
        
        for i, item in enumerate(new_items):
            line = json.dumps(item)
            if i < len(new_items) - 1:
                f.write(f'    {line},\n')
            else:
                f.write(f'    {line}\n')
        
        f.write('  ]\n}\n')

    print("Done! Part numbers are 3-digit padded, display lengths are standard.")

if __name__ == "__main__":
    process_products_clean_display()