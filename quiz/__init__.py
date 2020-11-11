from flask import Flask

app = Flask(__name__)
app.secret_key = b"thisisarubbishsecretkey"

# Register route handlers.
from . import views
