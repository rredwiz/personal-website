from flask import Flask, jsonify, request
import requests
from dotenv import load_dotenv

load_dotenv()
from apis import spotify, github

app = Flask(__name__)


@app.route("/github")
def get_github_recent_commits():
    return "will make soon"


@app.route("/spotify")
def get_spotify_info():
    data = spotify.main_request()
    if not data:
        return jsonify({"error": "the request was unsuccessful"}), 500
    return jsonify(data), 200


if __name__ == "__main__":
    app.run(debug=True)
