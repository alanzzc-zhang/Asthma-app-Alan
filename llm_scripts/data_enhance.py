import os
import json
import subprocess
import re
from datetime import datetime
# === Configuration ===
# Set your llama executable and model path
llama_exe_path = r"C:\Users\omgzh\Desktop\Alan\llama_cpu_test\llama-run.exe"
model_path = r"C:\Users\omgzh\Desktop\Alan\llama_cpu_test\openchat-3.5-0106.Q5_K_M.gguf"

# Set the target date for processing (format: YYYY_MM_DD)
target_date = "2025_06_23"
file_name = f"hourlySummary_{target_date}.json"
file_path = os.path.abspath(os.path.join("..", "My-Asthma-App","public", "data", file_name))
Test_path = r"C:\Users\omgzh\Desktop\Alan\Newfolder\TestingOutput.txt"
Test_inner_pathA = r"C:\Users\omgzh\Desktop\Alan\Newfolder\llm_parsing_input_debugA.txt"
Test_inner_pathB = r"C:\Users\omgzh\Desktop\Alan\Newfolder\llm_parsing_input_debugB.txt"
Test_inner_pathC = r"C:\Users\omgzh\Desktop\Alan\Newfolder\llm_parsing_input_debugC.txt"

# === Load hourly summary data ===
with open(file_path, 'r', encoding='utf-8') as f:
    hourly_data = json.load(f)

# === Simplify hourly records for LLM input （get rid of "hour", "last_act_score" and "notes.id", then add "time": 00:00 in it)===
def simplify_record(entry):
    simplified = {
        "time": datetime.fromisoformat(entry["hour"]).strftime("%H:%M"),
        "pollen": entry["pollen"],
        "pm25": entry["pm25"],
        "pm10": entry["pm10"],
        "cough_count": entry["cough_count"],
        "reliever_total": entry["reliever_total"]
    }

    if entry.get("act_scores"):
        simplified["act_scores"] = entry["act_scores"]

    if entry.get("notes"):
        filtered_notes = []
        for note in entry["notes"]:
            filtered_note = {}
            for field in ["label", "text", "health_score", "mood_score", "emotion", "activity"]:
                value = note.get(field)
                if value not in [None, "", []]:
                    filtered_note[field] = value
            if filtered_note:  # only add if at least one field is present
                filtered_notes.append(filtered_note)
        if filtered_notes:
            simplified["notes"] = filtered_notes

    if entry.get("medication_status"):
        simplified["medication_status"] = entry["medication_status"]

    return simplified

def simplify_records(records):
    return [simplify_record(r) for r in records]

# === Split into 3 chunks (to avoid token overflow) ===
chunk1_raw = hourly_data[:8]
chunk2_raw = hourly_data[8:16]
chunk3_raw = hourly_data[16:]

chunk1 = simplify_records(chunk1_raw)
chunk2 = simplify_records(chunk2_raw)
chunk3 = simplify_records(chunk3_raw)

# === some patient info ===
patient_info_CaseTwo = '''
Patient Profile:
- Age: 15
- Gender: Male
- Condition: Diagnosed with mild to moderate asthma one year ago
- Triggers: Coughing or wheezing after exercise and during spring pollen season
- Recent Recommendation: Doctor advised close monitoring of symptoms and identifying common asthma triggers
- Challenges: Lacks experience in tracking symptoms and avoiding triggers; finds paper logs inconvenient and difficult to use
- Motivation: Searching for a digital tool that can help with personalized asthma management and provide intuitive insights
'''
patient_info = '''
    Patient Profile:
    - Age: 25
    - Gender: Female
    - Known Condition: Mild persistent asthma
    - Medications: Flovent (controller, daily use), Ventolin (reliever, as needed)
    - Lifestyle: Active, often walks outside; sometimes feels anxious under pressure
    '''
# === Function to call LLM and return parsed results ===
def call_llm_and_parse(input_records, path):

    data_description = '''
    Each hourly record includes the following fields:
    - time: (e.g., "08:00", "17:00") representing the hour of the day. Use it to understand event timing, but do not include it in the output.
    - pollen: Pollen level in the air (µg/m³), may trigger allergies or asthma.
    - pm25: Fine particulate matter (PM2.5) concentration in µg/m³, related to air pollution.
    - pm10: Coarse particulate matter (PM10) concentration in µg/m³.
    - cough_count: Number of coughs detected during the hour.
    - reliever_total: Number of reliever puffs used (e.g., Ventolin).
    - act_scores: Optional list of Asthma Control Test scores (0-25).
    - notes: User-generated notes with these fields:
        - label: Category or theme of the note (e.g., "exercise", "reaction").
        - text: Free-text description of experience or symptoms.
        - health_score: Subjective health rating (0-100).
        - mood_score: Subjective mood score (0-100).
        - emotion: User's described emotion (e.g., "anxious", "relaxed").
        - activity: User's activity at the time (e.g., "walking", "resting").
    - medication_status: Array of medication reminders and intake status:
        - medication: The name of the medication (e.g., Flovent).
        - on_time: Whether the user took it on time (true/false).
    NOTE: Some fields like "act_scores", "notes", or "medication_status" may be missing if no data is recorded for that hour.'''
    
    prompt = f"""
    You are an AI model assisting in asthma monitoring. Your task is to analyze each hourly asthma record and generate insights for monitoring and tracking purposes.

    {patient_info_CaseTwo}

    {data_description}
    You will receive exactly 8 hourly records in the input.
    Please return exactly 8 JSON objects, one for each input, as an array.
    Each output object must include the following fields:
    - breathlessness: an object with three fields — "level" (a number from 1 to 10), "reason" (a short sentence), and "confidence" (a number between 0 and 1)
    - llm_summary: a one-sentence plain English summary of that hour's situation
    - events_detected: an array of event objects. Each event must include "type" (short label), "trigger" (optional), "severity" (optional), and "confidence" (number between 0 and 1)
    - llm_tags: a list of 1 to 5 relevant keywords (strings), describing key themes (e.g., "pollution", "symptoms", "reliever_used")
    Output must be a single valid JSON array of objects.
        matching the order of input records
        Do not include any nested arrays.  
        Do not add extra commas after the last object.  
        Do not wrap each object in its own array.  
        Do not include comments, explanations, or line breaks.  
    Please output a concise JSON object for each hour. Avoid repeating similar descriptive text. Focus on structure and tags, not redundant narrative.
    Use short, varied sentence structures. Do not use identical phrasing across records. Ensure the output ends with a single closing bracket "]" with no trailing commas or nested arrays. Only return the valid JSON array with no commentary.
    Do not include data from previous prompts. Do not generate more than 8 objects.

    Here is the data:
    {json.dumps(input_records, indent=2)}
    """

    # Clean prompt to remove excess whitespace
    prompt_cleaned = " ".join(prompt.split())

    # === Run LLM subprocess ===
    command = [
        llama_exe_path,
        model_path,
        "--context-size", "5000",
        "--temp", "0.7",
        prompt_cleaned
    ]
    print("🚀 Calling LLM... This may take a while...")
    result = subprocess.run(command, capture_output=True, text=True)

    # Remove ANSI characters
    cleaned_output = re.sub(r'\x1b\[[0-9;]*m', '', result.stdout)
    # Try auto-wrap if not valid JSON
    if not cleaned_output.startswith(" ["):
        print("🛠 Wrapping raw output into JSON array...")
        cleaned_output = "[" + cleaned_output + "]"
    # Fix: remove extra [ at the beginning if it's [[
    if cleaned_output.startswith("[ ["):
        print("🛠 Detected double [[ at start. Fixing...")
        cleaned_output = cleaned_output[1:]
        
    # Remove leading or trailing brackets like [[, 【 【, [[ , etc.
    cleaned_output = re.sub(r'^\s*[\[【]+\s*', '[', cleaned_output)
    cleaned_output = re.sub(r'\s*[\]】]+\s*$', ']', cleaned_output)
    #print("📄 Raw output starts with:\n", cleaned_output[:10])

    with open(path, "w", encoding="utf-8") as debug_f:
        debug_f.write(cleaned_output)
    # Try to parse JSON
    try:
        parsed = json.loads(cleaned_output)
        return parsed
    except json.JSONDecodeError:
        print("❌ Failed to parse model output. Raw output saved to txt.")
        return None

# === Process both halves ===
generated_1 = call_llm_and_parse(chunk1, Test_inner_pathA)
generated_2 = call_llm_and_parse(chunk2, Test_inner_pathB)
generated_3 = call_llm_and_parse(chunk3, Test_inner_pathC)

# === Update original data if successful ===
if generated_1 and generated_2 and generated_3:
    fullGenerated = generated_1 + generated_2 + generated_3
    # Always save raw output for debugging
    with open(Test_path , "w", encoding="utf-8") as f_debug:
        json.dump(fullGenerated, f_debug, indent=2, ensure_ascii=False)
    for i, new_fields in enumerate(fullGenerated):
        hourly_data[i]['breathlessness'] = new_fields.get('breathlessness', {})
        hourly_data[i]['llm_summary'] = new_fields.get('llm_summary', "")
        hourly_data[i]['events_detected'] = new_fields.get('events_detected', [])
        hourly_data[i]['llm_tags'] = new_fields.get('llm_tags', [])

    # Save updated file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(hourly_data, f, indent=2, ensure_ascii=False)

    print("✅ Updated file saved with LLM output.")
else:
    print("⚠️ LLM output was not usable. Original file unchanged.")