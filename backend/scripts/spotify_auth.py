"""Get a Spotify refresh token for /nowplaying. One-time setup, then every ~6 months.

1. Create an app at https://developer.spotify.com/dashboard (Development Mode
   apps need Spotify Premium on the owner's account). Under "Redirect URIs"
   add exactly ``http://127.0.0.1:8888/callback`` (Spotify rejects
   ``localhost``) and select "Web API".
2. Put ``SPOTIFY_CLIENT_ID`` and ``SPOTIFY_CLIENT_SECRET`` in ``backend/.env``.
3. From ``backend/`` run ``python scripts/spotify_auth.py``, approve in the
   browser, and copy the printed refresh token.
4. Set ``SPOTIFY_CLIENT_ID``, ``SPOTIFY_CLIENT_SECRET`` and
   ``SPOTIFY_REFRESH_TOKEN`` on Render (and in ``backend/.env`` for local runs).

Spotify refresh tokens expire six months after this authorization (refreshing
doesn't extend them). When that happens the site quietly falls back to Last.fm
and the backend logs ``invalid_grant``; run this script again.
"""

from __future__ import annotations

import base64
import http.server
import os
import secrets
import sys
import urllib.parse
import webbrowser
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
HOST, PORT = "127.0.0.1", 8888
REDIRECT_URI = f"http://{HOST}:{PORT}/callback"
SCOPES = "user-read-currently-playing user-read-recently-played"
REFRESH_TOKEN_LIFETIME = timedelta(days=182)


def wait_for_callback(expected_state: str) -> dict:
    """Serve one redirect from Spotify and return its query parameters."""
    result: dict = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802 (http.server's naming)
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path != "/callback":
                self.send_response(404)
                self.end_headers()
                return
            result.update({key: values[0] for key, values in urllib.parse.parse_qs(parsed.query).items()})
            ok = "code" in result and result.get("state") == expected_state
            self.send_response(200 if ok else 400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            message = "Done. You can close this tab." if ok else "Authorization failed; see the terminal."
            self.wfile.write(message.encode())

        def log_message(self, *_args) -> None:
            pass

    with http.server.HTTPServer((HOST, PORT), Handler) as server:
        while "code" not in result and "error" not in result:
            server.handle_request()
    return result


def main() -> int:
    load_dotenv()
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not (client_id and client_secret):
        print("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (e.g. in backend/.env) first.")
        return 1

    state = secrets.token_urlsafe(16)
    query = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": REDIRECT_URI,
            "scope": SCOPES,
            "state": state,
        }
    )
    authorize_url = f"{AUTHORIZE_URL}?{query}"
    print("Opening Spotify to approve access. If no browser opens, visit:\n")
    print(f"  {authorize_url}\n")
    webbrowser.open(authorize_url)

    callback = wait_for_callback(state)
    if callback.get("error"):
        print(f"Spotify returned an error: {callback['error']}")
        return 1
    if callback.get("state") != state:
        print("The response's state didn't match this request; try again.")
        return 1

    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    response = requests.post(
        TOKEN_URL,
        headers={"Authorization": f"Basic {credentials}"},
        data={"grant_type": "authorization_code", "code": callback["code"], "redirect_uri": REDIRECT_URI},
        timeout=(5, 15),
    )
    data = response.json() if response.content else {}
    refresh_token = data.get("refresh_token") if isinstance(data, dict) else None
    if not response.ok or not refresh_token:
        print(f"Token exchange failed (HTTP {response.status_code}): {data}")
        return 1

    expires = (datetime.now(timezone.utc) + REFRESH_TOKEN_LIFETIME).date()
    print("Success. Set this as SPOTIFY_REFRESH_TOKEN on Render and in backend/.env (never commit it):\n")
    print(f"  {refresh_token}\n")
    print(f"It expires around {expires.isoformat()}; run this script again before then.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
