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
    github_json = {
        "events": []
    }
    limit = 5
    for event in response_json:
        if event['type'] == 'PushEvent' and len(github_json['events']) < limit:
            github_json['events'].append({
                "message": event['payload']['commits'][0]['message'],
                "repo_name": event['repo']['name'],
                "repo_url": event['repo']['url'],
                "commit_url": event['payload']['commits'][0]['url'],
                "type": event['type'],
                "created_at": event['created_at'],
            })
        else:
            break
    return github_json
