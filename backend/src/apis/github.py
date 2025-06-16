import os
import requests

GITHUB_API_KEY = os.environ.get('GITHUB_API_KEY')
GITHUB_USERNAME = "rredwiz"

url = f"https://api.github.com/users/{GITHUB_USERNAME}/events"
header = {
    "Authorization": f"Bearer {GITHUB_API_KEY}"
}

def get_github_events():
    response = requests.get(url, headers=header)
    if response.status_code == 200:
        return create_github_json(response.json())
    print(f"something went wrong: status code was {response.status_code}")


def create_github_json(response_json):
    # creating logic
    return response_json