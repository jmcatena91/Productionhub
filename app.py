from flask import Flask, render_template

# Initialize the Flask application
app = Flask(__name__)

# Define the main route for your website
@app.route('/')
def home():
    """
    This function handles requests to the root URL ('/')
    and serves the index.html file from the 'templates' folder.
    """
    return render_template('index.html')

if __name__ == '__main__':
    # This block allows you to run the app directly with 'python app.py' for testing
    app.run(host='0.0.0.0', port=8003, debug=True)
