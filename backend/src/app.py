"""Flask API that feeds the live widgets on andster.dev.

Run locally with ``flask --app src.app run`` (or ``python -m src.app``) from
the ``backend/`` directory; in production gunicorn serves ``src.app:app``.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Callable, Optional

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request

load_dotenv()

from src.apis import github, lastfm, monkeytype  # noqa: E402  (env must be loaded first)

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _allowed_origin(request_origin: Optional[str], allowed: str) -> Optional[str]:
    """Pick the ``Access-Control-Allow-Origin`` value for a request.

    ``allowed`` is the ``CORS_ORIGINS`` setting: ``*`` (default) or a
    comma-separated list of exact origins.
    """
    allowed = (allowed or "*").strip()
    if allowed == "*":
        return "*"
    origins = {origin.strip() for origin in allowed.split(",") if origin.strip()}
    if request_origin and request_origin in origins:
        return request_origin
    return None


def _upstream_response(data: Any, source: str) -> tuple[Response, int]:
    """JSON 200 for data, JSON 502 when the upstream integration gave us nothing."""
    if not data:
        logger.warning("%s returned no data", source)
        return jsonify({"error": f"{source} data is currently unavailable"}), 502
    return jsonify(data), 200


def create_app(cors_origins: Optional[str] = None) -> Flask:
    app = Flask(__name__)
    allowed = cors_origins if cors_origins is not None else os.environ.get("CORS_ORIGINS", "*")

    @app.after_request
    def add_cors_headers(response: Response) -> Response:
        origin = _allowed_origin(request.headers.get("Origin"), allowed)
        if origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            if origin != "*":
                response.headers.add("Vary", "Origin")
        return response

    @app.get("/")
    def health_check() -> str:
        return "HEALTH CHECK 200"

    def register(path: str, source: str, loader: Callable[[], Any]) -> None:
        def view() -> tuple[Response, int]:
            return _upstream_response(loader(), source)

        app.add_url_rule(path, endpoint=source, view_func=view)

    # Loaders are looked up at request time (not bound here) so they stay easy to patch in tests.
    register("/monkeytype", "monkeytype", lambda: monkeytype.get_monkeytype_scores_info())
    register("/github", "github", lambda: github.get_github_events())
    register("/lastfm", "lastfm", lambda: lastfm.get_recent())

    # Spotify is intentionally kept in the tree but not routed, so production
    # behaviour does not change until the integration is ready:
    # register("/spotify", "spotify", lambda: spotify.get_spotify_iframe())

    @app.errorhandler(404)
    def not_found(_error: Exception) -> tuple[Response, int]:
        return jsonify({"error": "not found"}), 404

    @app.errorhandler(500)
    def server_error(error: Exception) -> tuple[Response, int]:
        logger.exception("unhandled error: %s", error)
        return jsonify({"error": "internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG", "0") == "1",
    )
