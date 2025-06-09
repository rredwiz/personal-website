import os
import requests
from base64 import b64encode

SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")

auth_string = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
auth_header = b64encode(auth_string.encode("utf-8")).decode("utf-8")

access_token_url = "https://accounts.spotify.com/api/token"
access_token_header = {"Authorization": f"Basic {auth_header}"}
access_token_request_data = {"grant_type": "client_credentials"}
access_token = "BQClDbKY2hmJYWVPcgNUOP75eaV1zhKJUKLxXP6kE-xSPv0-Hi4g3V-dHqYHRuUn2TpiSaTRllXUd5XROGyEjoB8rGuOpfntQf2kR0Mu6CR19Gn-hM2vi2CGrVd1MeGMtNm7alaol64"

recently_played_url = "https://api.spotify.com/v1/me/player/recently-played?limit=1"
recently_played_header = {"Authorization": f"Bearer {access_token}"}


# will change name later to 'get_access_code'
def get_access_code():
    print("getting access code...")
    try:
        response = requests.post(
            access_token_url,
            headers=access_token_header,
            data=access_token_request_data,
        )
        if response.status_code == 200:
            print("access code successfully retrieved")
            access_token = response.json().get("access_token")
            print(access_token)
            return access_token
        print("didn't get access code")
    except:
        print("an error occured somewhere in ur code lol just quit ur horrible (why)")


def main_request():
    print("starting a spotify request...")
    response = requests.get(recently_played_url, headers=recently_played_header)
    return response.json()
    # if response.status_code != 200:
    #     print("getting next access code (the other was expired or didn't exist)...")
    #     access_token = get_access_code()
    #     if not access_token:
    #         print("get_access_code returned None, returning")
    #         return
    #     print("making next main request...")
    #     response = requests.get(recently_played_url, headers=recently_played_header)
    #     if response.status_code == 200:
    #         print("SUCCESS! CODE: 200")
    #         print(response.json())
    #         return response.json()
    #     print("something went wrong with your status code in the final request")
    #     return response.json()
