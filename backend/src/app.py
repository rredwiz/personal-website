from flask import Flask, jsonify, request
from config import Config
import requests

app = Flask(__name__)
app.config.from_object(Config)

@app.route('/')
def home():
    return 'get response'

@app.route('/posts')
def posts():
    api_response = requests.get('https://jsonplaceholder.typicode.com/posts')
    user_id = request.args.get('userId')
    print(user_id)
    if api_response.status_code == 200:
        data = api_response.json()
        return jsonify(data), 200
    else:
        return jsonify({"error" : "failed to fetch posts"}), 500

if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG'))