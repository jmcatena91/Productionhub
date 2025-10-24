from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
import logging

# Initialize the Flask application
app = Flask(__name__, static_folder='static')

# --- NEW CONFIGURATION ---
# Use a SQLite database file named 'products.db'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'products.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Secret key is required for sessions and Flask-Login
# ***IMPORTANT: CHANGE THIS TO A LONG, RANDOM VALUE IN PRODUCTION***
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a_default_secret_key_for_dev') 
# --- END NEW CONFIGURATION ---

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login' # Redirects unauthenticated users to the 'login' route
login_manager.login_message = "Please log in to access this page."


# Configure logging
logging.basicConfig(level=logging.INFO)

# --- Define Database Models (User and Product) ---
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
    lwc = db.Column(db.String(50), nullable=False)
    partner = db.Column(db.String(50), nullable=True)
    insulation = db.Column(db.String(50), nullable=False)
    length = db.Column(db.String(50), nullable=False)
    bladeSize = db.Column(db.String(50), nullable=False)
    layers = db.Column(db.String(50), nullable=False)
    qtyPerPallet = db.Column(db.Integer, nullable=False)
    boxPallet = db.Column(db.String(50), nullable=False)
    
    def to_dict(self):
        return {
            "lwc": self.lwc,
            "partner": self.partner,
            "insulation": self.insulation,
            "length": self.length,
            "bladeSize": self.bladeSize,
            "layers": self.layers,
            "qtyPerPallet": self.qtyPerPallet,
            "boxPallet": self.boxPallet
        }

# --- Flask-Login User Loader ---
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# --- Data Loading (Rewritten to query DB) ---
def get_products_from_db():
    try:
        products = Product.query.all()
        return {"items": [p.to_dict() for p in products]}
    except Exception as e:
        app.logger.error(f"Error fetching products from database: {e}", exc_info=True)
        return {"items": []}


# --- USER FACING ROUTES ---

@app.route('/')
def home():
    app.logger.info("Serving index.html")
    return render_template('index.html')

# API endpoint to get product data (UPDATED to use DB)
@app.route('/api/products')
def get_products():
    app.logger.info("Request received for /api/products (from DB)")
    product_data = get_products_from_db()
    if not product_data.get("items"):
         app.logger.warning("Returning empty product list to client due to DB error or no data.")
    return jsonify(product_data)


# --- NEW AUTHENTICATION ROUTES ---

@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin_products'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            app.logger.info(f"User {username} logged in successfully.")
            next_page = request.args.get('next')
            return redirect(next_page or url_for('admin_products'))
        else:
            flash('Invalid username or password', 'danger')
            app.logger.warning(f"Failed login attempt for username: {username}")
            
    return render_template('login.html')

@app.route('/admin/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('home'))


# --- NEW ADMIN CRUD ROUTES ---

@app.route('/admin')
@login_required
def admin_products():
    products = Product.query.order_by(Product.lwc, Product.partner, Product.insulation, Product.length).all()
    return render_template('admin_products.html', products=products)

@app.route('/admin/add', methods=['GET', 'POST'])
@login_required
def admin_add():
    if request.method == 'POST':
        try:
            qtyPerPallet = int(request.form.get('qtyPerPallet', 0))

            new_product = Product(
                lwc=request.form.get('lwc'),
                partner=request.form.get('partner') if request.form.get('partner') else None,
                insulation=request.form.get('insulation'),
                length=request.form.get('length'),
                bladeSize=request.form.get('bladeSize'),
                layers=request.form.get('layers'),
                qtyPerPallet=qtyPerPallet,
                boxPallet=request.form.get('boxPallet')
            )
            db.session.add(new_product)
            db.session.commit()
            flash('Product added successfully!', 'success')
            return redirect(url_for('admin_products'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding product: {e}', 'danger')

    return render_template('admin_edit.html', product=None)

@app.route('/admin/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
def admin_edit(product_id):
    product = db.session.get(Product, product_id)
    if product is None:
        flash('Product not found.', 'danger')
        return redirect(url_for('admin_products'))
        
    if request.method == 'POST':
        try:
            qtyPerPallet = int(request.form.get('qtyPerPallet', 0))

            product.lwc = request.form.get('lwc')
            product.partner = request.form.get('partner') if request.form.get('partner') else None
            product.insulation = request.form.get('insulation')
            product.length = request.form.get('length')
            product.bladeSize = request.form.get('bladeSize')
            product.layers = request.form.get('layers')
            product.qtyPerPallet = qtyPerPallet
            product.boxPallet = request.form.get('boxPallet')

            db.session.commit()
            flash('Product updated successfully!', 'success')
            return redirect(url_for('admin_products'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating product: {e}', 'danger')

    return render_template('admin_edit.html', product=product)

@app.route('/admin/delete/<int:product_id>', methods=['POST'])
@login_required
def admin_delete(product_id):
    product = db.session.get(Product, product_id)
    if product is None:
        flash('Product not found.', 'danger')
        return redirect(url_for('admin_products'))
        
    try:
        db.session.delete(product)
        db.session.commit()
        flash(f'Product {product.lwc} / {product.length} deleted successfully.', 'warning')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting product: {e}', 'danger')

    return redirect(url_for('admin_products'))


# Error handlers (KEEP EXISTING)
@app.errorhandler(404)
def page_not_found(e):
    app.logger.warning(f"404 error encountered: {e}")
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(e):
    app.logger.error(f"500 Internal Server Error: {e}", exc_info=True)
    return jsonify(error="Internal server error. Please check server logs."), 500

if __name__ == '__main__':
    # Initialise database when running locally
    with app.app_context():
        db.create_all()
        # Check for initial user, create one if not exists (Admin: Admin123)
        if User.query.filter_by(username='Admin').first() is None:
            admin_user = User(username='Admin')
            admin_user.set_password('Admin123') 
            db.session.add(admin_user)
            db.session.commit()
            app.logger.info("Default Admin user created (Username: Admin, Password: Admin123). CHANGE THIS!")

    app.logger.info("Starting Flask development server...")
    app.run(host='0.0.0.0', port=8003, debug=True)