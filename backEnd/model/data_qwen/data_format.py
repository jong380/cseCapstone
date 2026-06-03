import json

INPUT_FILE = "claude_rates.json" 
OUTPUT_FILE = "train_data.jsonl"         

# this tells the ai what prompt it needs to be looking for, identiacal to what we end up passing for real clasiciation
SYSTEM_PROMPT = (
    "You are an on-device notification assistant. Analyze the incoming notification "
    "and the user's profile, then output a binary priority rating: "
    "0 for low priority/ignore, 1 for high priority/urgent. Output only the digit 0 or 1."
)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    for item in data:
        # content = actual info (notificain, etc)
        user_content = (
            f"User Profile: {item['user_profile']}\n"
            f"Notification App: {item['app']}\n"
            f"Notification Title: {item['title']}\n"
            f"Notification Body: {item['body']}"
        )
        
        binary_rating = int(item["rating"])
        
        # output format that qewn expects
        # assistant = output
        chatml_line = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
                {"role": "assistant", "content": str(binary_rating)}
            ]
        }
        
        # Write to file as a single line
        f.write(json.dumps(chatml_line, ensure_ascii=False) + "\n")