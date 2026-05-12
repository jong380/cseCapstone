import json
import math

with open("data/gemini_ratings.json") as g:
    data_g = json.load(g)
    gemini_by_id = {item["id"]: item for item in data_g}

with open("data/claude_ratings.json") as c:
    data_c = json.load(c)
    claude_by_id = {item["id"]: item for item in data_c}

with open("data/gpt_ratings.json") as gpt:
    data_gpt = json.load(gpt)
    gpt_by_id = {item["id"]: item for item in data_gpt}

with open("data/notifications.json") as data:
    notif = json.load(data)
    notif_by_id = {item["id"]: item for item in notif}

results = []

for i in range(1, 1501):
    rate_gem = gemini_by_id[i]["rating"]
    rate_claude = claude_by_id[i]["rating"]
    rate_gpt = gpt_by_id[i]["rating"]
    avg = ( rate_gem + rate_claude + rate_gpt ) / 3
    cur = notif_by_id[i]
    cur["label"] = math.ceil(avg)-1
    results.append(cur)

with open("training_data.json", "w") as f:
    json.dump(results, f, indent=2)

