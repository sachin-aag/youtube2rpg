"""
Script to add mood classification to generated question JSON files.
Uses OpenAI to classify video titles or summaries into predefined categories.
"""

import os
import sys
import json
import glob
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Categories for classification
CATEGORIES = [
    "Foundational Knowledge",
    "Conceptual Understanding",
    "Procedural Skills",
    "Critical Thinking & Reasoning",
    "Problem Solving",
    "Practical Application",
    "Memory & Recall",
    "Metacognition & Learning Strategies",
    "Creativity & Synthesis",
    "Ethics, Context & Impact"
]

def classify_text(client: OpenAI, text: str, text_type: str = "title") -> str:
    """
    Send text to OpenAI and get a mood classification.
    text_type can be "title" or "summary"
    """
    categories_list = "\n".join(f"- {cat}" for cat in CATEGORIES)
    
    if text_type == "summary":
        prompt = f"""Classify the following chapter summary into exactly ONE of these categories:

{categories_list}

Summary: "{text}"

Respond with ONLY the category name, nothing else."""
        system_msg = "You are a classifier that categorizes educational content summaries. Respond only with the category name."
    else:
        prompt = f"""Classify the following video title into exactly ONE of these categories:

{categories_list}

Video title: "{text}"

Respond with ONLY the category name, nothing else."""
        system_msg = "You are a classifier that categorizes educational video titles. Respond only with the category name."

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        max_tokens=50
    )
    
    return response.choices[0].message.content.strip()


def process_json_files(folder_path: str, classify_by: str = "title"):
    """
    Process all JSON files in the folder and add mood classification.
    classify_by: "title" for video titles, "summary" for chapter summaries
    """
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    # Get all JSON files (exclude _summary.json)
    json_files = [f for f in glob.glob(os.path.join(folder_path, "*.json")) 
                  if not f.endswith("_summary.json")]
    
    print(f"Found {len(json_files)} JSON files to process")
    print(f"Classifying by: {classify_by}")
    
    for json_file in json_files:
        try:
            # Read the JSON file
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Get identifier for logging
            if classify_by == "summary":
                identifier = data.get('chapter_title', os.path.basename(json_file))
                text_to_classify = data.get('summary', '')
            else:
                identifier = data.get('video_id', 'unknown')
                text_to_classify = data.get('title', '')
            
            # Skip if already has mood
            if 'mood' in data:
                print(f"Skipping {identifier} - already has mood: {data['mood']}")
                continue
            
            if not text_to_classify:
                print(f"Skipping {identifier} - no {classify_by} found")
                continue
            
            # Classify the text
            print(f"Classifying: {text_to_classify[:60]}...")
            mood = classify_text(client, text_to_classify, classify_by)
            
            # Add mood to data
            data['mood'] = mood
            
            # Write back to file
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"  -> Mood: {mood}")
            
        except Exception as e:
            print(f"Error processing {json_file}: {e}")
    
    print("\nDone processing all files!")


if __name__ == "__main__":
    # Default to generated_questions folder with title classification
    if len(sys.argv) >= 2:
        folder_name = sys.argv[1]
        classify_by = sys.argv[2] if len(sys.argv) >= 3 else "title"
    else:
        folder_name = "generated_questions"
        classify_by = "title"
    
    folder_path = os.path.join(os.path.dirname(__file__), folder_name)
    process_json_files(folder_path, classify_by)
