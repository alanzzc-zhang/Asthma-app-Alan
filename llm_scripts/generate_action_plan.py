import subprocess
import json
import os
import tiktoken
import sys

# === File Path ===
llama_exe_path = r"C:\Users\omgzh\Desktop\Alan\llama_cpu_test\llama-run.exe"
model_path = r"C:\Users\omgzh\Desktop\Alan\llama_cpu_test\openchat-3.5-0106.Q5_K_M.gguf"
input_json_path = r"C:\Users\omgzh\Desktop\Alan\Newfolder\JavaScript\My-Asthma-App\public\data\hourlySummary_2025_06_23.json"
#
#sys.argv[1]   sys.argv[2]
output_txt_file = r"C:\Users\omgzh\Desktop\Alan\Newfolder\ActionPlan2.txt"
#

# A message that let you know it's already started and the current path 
print("Script started!")
print("input_json_path:", input_json_path)
print("output_txt_file:", output_txt_file)
# === hourly summary ===
with open(input_json_path, "r", encoding="utf-8") as f:
    full_data = json.load(f)
# === modified data input ===
compressed_data = []
for entry in full_data:
    # If data is missing, skip it
    if "hour" not in entry:
        continue
    if not all(k in entry for k in ["llm_summary", "events_detected", "llm_tags"]):
        continue

    hhmm = entry["hour"]
    if "T" in hhmm: #if is 2025-06-23T22:00:00
        hhmm = hhmm.split("T", 1)[1][:5]
    else:           # if is "HH:MM" or "HH:MM:SS" only
        hhmm = hhmm[:5]

    compressed_data.append({
        "hour": hhmm,  #  "HH:MM"
        "llm_summary": entry.get("llm_summary", ""),
        "events_detected": entry.get("events_detected", []),
        "llm_tags": entry.get("llm_tags", [])
    })

# Sample patient information:
#- Age: 27
#- Asthma severity: Moderate persistent
#- Typical triggers: pollen, PM2.5, cold air
#- Activity preference: light outdoor walking and gardening in the morning
#- Medication routine: preventive inhaler in the morning and reliever as needed

# === Prompt info ===
prompt = f"""You are an AI assistant that supports adolescents in asthma self-management. Your tone should be friendly, plain-language, and school-life oriented. You are NOT diagnosing disease; provide practical day-to-day guidance only and include uncertainties when data are limited.

User profile:
- Age: 15, middle-school student
- No formal asthma diagnosis; history of exercise-induced breathing difficulty and morning cough in childhood
- Doctor suspected mild allergy-related respiratory reactions; advised identifying/avoiding common triggers
- Symptoms eased with age but still occur in spring pollen season
- The user is unsure what counts as “health management,” and wants clear, simple steps for school days
- Typically has physical education (PE) classes; wants to prepare for PE safely
- Parents provide guidance; the user is building daily tracking habits (notes, self-checks, ACT when available)

You will receive a 24-hour summary consisting of hourly observations. Each entry contains:
- hour: The time of the record
- llm_summary: A short summary of that hour's symptoms or status
- events_detected: Important health-related events detected that hour (type, trigger, severity, confidence)
- llm_tags: Tags related to symptoms, behaviors, or environment

Task:
generate a concise, friendly and useful **action plan for tomorrow**, that reflects this patient's age, lifestyle, and symptom patterns.
Refer to the last 24h summary: if you detect recurring or notable issues (e.g., evening cough, outdoor triggers, skipped notes), highlight them and briefly mention them at the start of the plan and provide targeted advice for tomorrow.
Make the advice time-specific and scenario-based (morning, school/work, activities, bedtime).

key requirement
- Structure the output into 4 sections below (use === before and after the section headers):
    === Symptom Prediction and Trigger Avoidance ===  
    === Medication and Inhaler Use Suggestions ===  
    === Environment or Activity Advice ===  
    === Motivation and Encouragement ===

- Within each section, give 3-6 concrete micro-steps that fit the person's daily life with your advise.  
  Examples:  
  • “Check pollen level at 7:30 AM before leaving for school.”  
  • “Do a 2-3 minute warm-up before PE class.”  s
  • “Write a short symptom note before bedtime.” 

Avoid overly technical or medical jargon. Limit your answer to no more than 600 words.
Here is the data:
{json.dumps(compressed_data)}
"""
# Remove all line breaks and extra spaces
compact_prompt = ' '.join(prompt.split())
# === LLM command ===
command = [
    llama_exe_path,
    "--context-size", "4096", 
    model_path,
    compact_prompt
]

# === Processing ===
print(" Running LLM...")

result = subprocess.run(command, capture_output=True, text=True)

# ===Create a file and Write the result in it  ===
with open(output_txt_file, "w", encoding="utf-8") as f:
    f.write(result.stdout)

print(" Output Preview:\n", result.stdout[:500])
print(f"Saved output to {output_txt_file}")
print(" STDERR:", result.stderr.strip())

enc = tiktoken.get_encoding("gpt2")  # GPT-2 
token_count = len(enc.encode(compact_prompt))
print(f" GPT-2 token count estimate: {token_count}")









