import requests
import json
import time
import os
from datetime import datetime

# === CONFIGURATION ===
API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjkzZTc3YTE2LWViYjctNGZiNi05MmEzLTJkOTViOTIzYmMzNiIsImlhdCI6MTc1OTg1MjUwOCwic3ViIjoiZGV2ZWxvcGVyL2QyMzllMDZkLTk0MWMtOTg1Yi0wZjQ0LWY5NWRlYzFlNmU3MSIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjI3LjM0LjY1LjE1MiJdLCJ0eXBlIjoiY2xpZW50In1dfQ.Sx7iaMtc6mf7GOuiAfJNMdMb2OdjzvzYmJbAPZ240kTtcQaxSVrfYLGcOmQzKAY5VPo3VpbDelhc0_wF_vvSqQ"  # replace with your Clash of Clans API key
LEAGUE_ID = "29000022"
LIMIT = 1000

# API base (normal, official API)
BASE_URL = "https://api.clashofclans.com"

# --- Folder path ---
OUTPUT_FOLDER = '/Users/aashutoshthapa/Desktop/coc rank/json_files'
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# --- Build month range ---
start_date = datetime(2022, 12, 1)
end_date = datetime(2025, 9, 1)
current = start_date

while current <= end_date:
    ym = current.strftime("%Y-%m")
    url = f"{BASE_URL}/v1/leagues/{LEAGUE_ID}/seasons/{ym}?limit={LIMIT}"
    headers = {"Authorization": f"Bearer {API_TOKEN}"}

    print(f"Fetching {ym} ...")
    resp = requests.get(url, headers=headers)

    if resp.status_code == 200:
        data = resp.json()
        if data:
            file_path = os.path.join(OUTPUT_FOLDER, f"{ym}.json")
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"✅ Saved {ym}.json")
        else:
            print(f"⚠️ No data for {ym}, skipping file.")
    else:
        print(f"❌ Failed {ym}: {resp.status_code} - {resp.text}")

    # Move to next month
    if current.month == 12:
        current = datetime(current.year + 1, 1, 1)
    else:
        current = datetime(current.year, current.month + 1, 1)

    time.sleep(1)  # polite delay to avoid rate-limiting