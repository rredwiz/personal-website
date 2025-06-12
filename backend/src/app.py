from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
from src.apis import lastfm, github

app = Flask(__name__)
CORS(app)


@app.route("/github")
def get_github_recent_commits():
    return "will make soon"


@app.route("/lastfm")
def get_lastfm_scrobble():
    data = lastfm.get_recent()
    if not data:
        return (
            jsonify({"error": "flask received None from lastfm.get_recent()"}),
            500,
        )
    return jsonify(data), 200


if __name__ == "__main__":
    app.run(debug=True)
