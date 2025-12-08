from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
import logging
import json

# Initialize the Flask application
app = Flask(__name__, static_folder='static')

# --- CONFIGURATION ---
# Use absolute path for the database to avoid location issues
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'products.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ***IMPORTANT: Change this to a random secret key for production***
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev_secret_key_change_this_in_prod')

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Please log in to access the admin dashboard."

# Configure logging
logging.basicConfig(level=logging.INFO)

# --- DATABASE MODELS ---

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # Maps to "Type" in your JSON. 'type' is a reserved word in Python, so we use product_type.
    product_type = db.Column(db.String(50), nullable=False)
    lwc = db.Column(db.String(50), nullable=False)
    partner = db.Column(db.String(50), nullable=True)
    insulation = db.Column(db.String(50), nullable=False)
    length = db.Column(db.String(50), nullable=False)
    bladeSize = db.Column(db.String(50), nullable=False)
    layers = db.Column(db.String(50), nullable=False)
    # Stored as String to handle "nan" or special formatting if needed, 
    # though Integer is preferred if data is clean.
    qtyPerPallet = db.Column(db.String(50), nullable=False) 
    boxPallet = db.Column(db.String(50), nullable=False)
    partNumber = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        """
        Converts the database object to a dictionary matching the 
        original products.json structure for the frontend API.
        """
        return {
            "Type": self.product_type,
            "lwc": self.lwc,
            # Ensure partner is an empty string if None, as expected by some frontend logic
            "partner": self.partner if self.partner else "",
            "insulation": self.insulation,
            "length": self.length,
            "bladeSize": self.bladeSize,
            "layers": self.layers,
            "qtyPerPallet": self.qtyPerPallet,
            "boxPallet": self.boxPallet,
            "partNumber": self.partNumber
        }

# --- FLASK-LOGIN LOADER ---
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# --- PUBLIC ROUTES ---

@app.route('/')
def home():
    """Serves the main frontend application."""
    return render_template('index.html')

@app.route('/api/products')
def get_products():
    """
    API Endpoint used by app.js. 
    Returns product data from SQLite in the expected JSON format.
    """
    try:
        products = Product.query.all()
        return jsonify({"items": [p.to_dict() for p in products]})
    except Exception as e:
        app.logger.error(f"Error fetching products from database: {e}", exc_info=True)
        return jsonify({"items": []})

def export_products_to_json():
    """
    Exports all products from the database to static/data/products.json.
    This ensures the JSON file stays in sync with the DB.
    """
    try:
        products = Product.query.all()
        data = {"items": [p.to_dict() for p in products]}
        
        json_path = os.path.join(basedir, 'static', 'data', 'products.json')
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        app.logger.info(f"Successfully exported {len(products)} products to {json_path}")
    except Exception as e:
        app.logger.error(f"Error exporting products to JSON: {e}", exc_info=True)

# --- ADMIN ROUTES ---

@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    """Handles admin login."""
    if current_user.is_authenticated:
        return redirect(url_for('admin_products'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('admin_products'))
        else:
            flash('Invalid username or password', 'danger')
            
    return render_template('login.html')

@app.route('/admin/logout')
@login_required
def logout():
    """Handles admin logout."""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))

@app.route('/admin')
@login_required
def admin_products():
    """
    Displays the admin dashboard.
    Products are sorted by Type, then LWC to support the grouped view.
    """
    products = Product.query.order_by(Product.product_type, Product.lwc).all()
    return render_template('admin_products.html', products=products)

@app.route('/admin/add', methods=['GET', 'POST'])
@login_required
def admin_add():
    """Handles adding a new product."""
    if request.method == 'POST':
        try:
            new_product = Product(
                product_type=request.form.get('product_type'),
                lwc=request.form.get('lwc'),
                partner=request.form.get('partner'),
                insulation=request.form.get('insulation'),
                length=request.form.get('length'),
                bladeSize=request.form.get('bladeSize'),
                layers=request.form.get('layers'),
                qtyPerPallet=request.form.get('qtyPerPallet'),
                boxPallet=request.form.get('boxPallet'),
                partNumber=request.form.get('partNumber')
            )
            db.session.add(new_product)
            db.session.commit()
            
            # Sync to JSON
            export_products_to_json()
            
            flash('Product added successfully!', 'success')
            return redirect(url_for('admin_products'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error adding product: {e}")
            flash(f'Error adding product: {e}', 'danger')
            
    return render_template('admin_edit.html', product=None)

@app.route('/admin/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
def admin_edit(product_id):
    """Handles editing an existing product."""
    product = db.session.get(Product, product_id)
    
    if not product:
        flash('Product not found.', 'danger')
        return redirect(url_for('admin_products'))
    
    if request.method == 'POST':
        try:
            product.product_type = request.form.get('product_type')
            product.lwc = request.form.get('lwc')
            product.partner = request.form.get('partner')
            product.insulation = request.form.get('insulation')
            product.length = request.form.get('length')
            product.bladeSize = request.form.get('bladeSize')
            product.layers = request.form.get('layers')
            product.qtyPerPallet = request.form.get('qtyPerPallet')
            product.boxPallet = request.form.get('boxPallet')
            product.partNumber = request.form.get('partNumber')
            
            db.session.commit()
            
            # Sync to JSON
            export_products_to_json()
            
            flash('Product updated successfully!', 'success')
            return redirect(url_for('admin_products'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating product: {e}")
            flash(f'Error updating product: {e}', 'danger')
            
    return render_template('admin_edit.html', product=product)

@app.route('/admin/delete/<int:product_id>', methods=['POST'])
@login_required
def admin_delete(product_id):
    """Handles deleting a product."""
    product = db.session.get(Product, product_id)
    if product:
        try:
            db.session.delete(product)
            db.session.commit()
            
            # Sync to JSON
            export_products_to_json()
            
            flash('Product deleted.', 'warning')
        except Exception as e:
            db.session.rollback()
            flash(f'Error deleting product: {e}', 'danger')
    else:
        flash('Product not found.', 'danger')
        
    return redirect(url_for('admin_products'))

# --- ERROR HANDLERS ---

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    app.logger.error(f"Server Error: {e}", exc_info=True)
    return jsonify(error="Internal server error"), 500

# --- MAIN EXECUTION ---

if __name__ == '__main__':
    # This block runs only when executing 'python app.py' directly.
    # It ensures the DB tables exist and creates the default admin user.
    with app.app_context():
        db.create_all()
        
        # Create default admin user if it doesn't exist
        if not User.query.filter_by(username='Admin').first():
            admin_user = User(username='Admin')
            admin_user.set_password('Admin123') 
            db.session.add(admin_user)
            db.session.commit()
            print("Default Admin user created.")
            
    app.run(host='0.0.0.0', port=8003, debug=True)