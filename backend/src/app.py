from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
from src.apis import lastfm, github, monkeytype

app = Flask(__name__)
CORS(app)


@app.route("/")
def render_health_check():
    return "HEALTH CHECK 200"


@app.route("/monkeytype")
def get_typing_stats():
    data = monkeytype.get_monkeytype_scores_info()
    if not data:
        return jsonify(
            {"error": "fask receieved None from monkeytype.get_recent_typing_scores"}
        )
    return jsonify(data), 200


@app.route("/github")
def get_github_recent_commits():
    data = github.get_github_events()
    if not data:
        return jsonify({"error": "flask received None from github.get_github_events"}), 500
    return jsonify(data), 200


@app.route("/lastfm")
def get_lastfm_scrobble():
    data = lastfm.get_recent()
    if not data:
        return (
            jsonify({"error": "flask received None from lastfm.get_recent"}),
            500,
        )
    return jsonify(data), 200


if __name__ == "__main__":
    app.run(debug=True)
