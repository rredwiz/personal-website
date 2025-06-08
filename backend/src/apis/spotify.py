import os
import requests
from base64 import b64encode

SPOTIFY_CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET')
SPOTIFY_CLIENT_ID = os.environ.get('SPOTIFY_CLIENT_ID')

auth_string = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
auth_header = b64encode(auth_string.encode('utf-8')).decode('utf-8')

access_token_url = "https://accounts.spotify.com/api/token"
request_header = {
    "Authorization":f"Basic {auth_header}"
}
request_data = {
    "grant_type":"client_credentials"
}

def test():
    response = requests.post(access_token_url, headers=request_header, data=request_data)
    return response.json() 

def main_request():
    # if temp token exists
    # make request ...
    # if temp token doesn't exist
    # request temp token
    # make request
    pass