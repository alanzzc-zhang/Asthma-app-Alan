import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Create file Path
RAW_DATA_PATH = os.path.join(BASE_DIR, 'rawData_2025-06-12_v2.json')#where the original data from
SUMMARY_PATH  = os.path.join(BASE_DIR, 'summary.json') # where we output

def load_json(path):
    #upload JSON file, if not exist, return empty array
    if not os.path.exists(path):
        return []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, ValueError):
        return []

def save_json(path, data):
    #save data to the JSON file
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def parse_hour(timestamp):
    # truncate ISO8601 to hours, use to mimic automatically creating hourly summary
    # eg: 2025-06-12T08:05:00 -> 2025-06-12T08:00:00
    dt = datetime.fromisoformat(timestamp)
    dt = dt.replace(minute=0, second=0, microsecond=0)
    return dt.isoformat()

def summarize_hour(hour, entries):
    # based on current hour data to generate summary
    cough_total = sum(e.get('cough_count', 0) for e in entries)
    pm25_vals = [e.get('pm2_5', 0) for e in entries]
    #use to get pollen level value
    pollen_vals = [e.get('pollen_level', 0) for e in entries]
    #use to get notes information
    notes = [note for e in entries for note in e.get('notes', [])]
    #use to get reliever usage number
    reliever_total = sum(e.get('reliever_usage', 0) for e in entries)
    # use to get a ACT score, if multiple exist, only get the last one
    act_scores = [e.get('act_score') for e in entries if 'act_score' in e]
    last_act_score = act_scores[-1] if act_scores else None
    # try to match up reminder's id with taken's id
    reminders = {r['id']: r for e in entries for r in e.get('medication_reminders', [])}
    taken_ids = {t['id'] for e in entries for t in e.get('medication_taken', [])}
    med_status = []

    for rid, rem in reminders.items():
        med_status.append({
            'id': rid,
            'medication': rem['medication'],
            'on_time': (rid in taken_ids)
        })
    
    return {
        'hour': hour,
        'cough_total': cough_total,
        'pm25_avg': round(sum(pm25_vals) / len(pm25_vals), 2) if pm25_vals else None,
        'pollen_avg': round(sum(pollen_vals) / len(pollen_vals), 2) if pollen_vals else None,
        'notes': notes,
        'reliever_total': reliever_total,
        'act_scores': act_scores,
        'last_act_score': last_act_score,
        'medication_status': med_status
    }
    
def main():
    # upload data
    raw_data = load_json(RAW_DATA_PATH)
    summary = load_json(SUMMARY_PATH)
    processed_hours = {item['hour'] for item in summary}
    
    print("Processed hours:", sorted(processed_hours))
    #Classify by hour
    buckets = {}
    for entry in raw_data:
        hour = parse_hour(entry['timestamp'])
        buckets.setdefault(hour, []).append(entry)
    
    #generate new hourly summary
    now_hour = datetime.now().replace(minute=0, second=0, microsecond=0).isoformat()
    new_entries = []
    for hour in sorted(buckets):
        # 跳过未来小时
        if hour > now_hour:
            continue
        # 跳过已经处理过的小时
        if hour in processed_hours:
            continue
        new_entries.append(summarize_hour(hour, buckets[hour]))
    

    #store and output the summary
    if new_entries:
        summary.extend(new_entries)
        save_json(SUMMARY_PATH, summary)
        print(f"Append {len(new_entries)} new hourly summary to {SUMMARY_PATH}")
    else:
        print("There isn't new data to generate")
    

if __name__ == '__main__':
    main()