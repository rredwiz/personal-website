import os
import requests
import time

APE_KEY = os.environ.get("APE_KEY")

avg_wpm_url = "https://api.monkeytype.com/results"
best_wpm_url = "https://api.monkeytype.com/users/personalBests"
header = {"Authorization": f"ApeKey {APE_KEY}"}
avg_wpm_params = {"limit": "100"}
best_wpm_params = {"mode": "time"}

# cached json to save rate limiting requests
cached_json = None
last_cached = 0

def get_monkeytype_scores_info():
    global cached_json
    global last_cached

    time_since_last_cached = time.time() - last_cached
    if cached_json is not None and time_since_last_cached < 3600:
        print("returning cached json")
        return cached_json

    print("getting new uncached scores")
    avg_wpm = get_recent_100_scores_avg()
    best_wpm = get_best_score()
    cached_json = {"averagewpm": avg_wpm, "bestwpm": best_wpm}

    last_cached = time.time()
    return cached_json


def get_best_score():
    response = requests.get(best_wpm_url, headers=header, params=best_wpm_params)
    if response.status_code == 200:
        data = response.json()
        print("best score was:", filter_best_score(data))
        return filter_best_score(data)
    print(
        "something went wrong fetching best score",
        response.status_code,
        response.content,
    )


def get_recent_100_scores_avg():
    response = requests.get(avg_wpm_url, headers=header, params=avg_wpm_params)
    if response.status_code == 200:
        data = response.json()
        print("average wpm was:", filter_avg_scores(data))
        return filter_avg_scores(data)
    print("failed to fetch", response.status_code, response.content)


def filter_avg_scores(data):
    wpm = 0
    count = 0
    for test in data.get("data"):
        if (
            test.get("language") == "english_1k"
            or test.get("language") == "english"
            and test.get("mode") == "time"
            and test.get("mode2") == 15
        ):
            wpm += test.get("wpm")
            count += 1
    if count == 0:
        print("count was 0 in filter_scores, therefore averagewpm is 0.0")
        return 0.0
    avg_wpm = wpm / count
    avg_wpm = round(avg_wpm, 1)
    return avg_wpm


def filter_best_score(data):
    all_best_scores_15_seconds = data.get("data").get("15")
    for mode in all_best_scores_15_seconds:
        if mode.get("language") == "english":
            best_score_english = mode.get("wpm")
            return best_score_english
    print("something went wrong filtering")
