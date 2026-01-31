"""
Prompts for quiz question generation from video transcripts.
"""

INSIGHT_EXTRACTION_PROMPT = """You are an expert at extracting key insights from educational podcast transcripts.

Given the following transcript from a Huberman Lab podcast episode, extract the most important and memorable insights that would make good quiz questions.

Video Title: {title}
Guest (if any): {guest}

TRANSCRIPT:
{transcript}

Extract 8-12 key insights that cover:
1. Scientific facts and mechanisms explained
2. Practical protocols or recommendations discussed
3. Surprising or counterintuitive findings mentioned
4. Key definitions or concepts introduced

For each insight, note:
- The core fact or claim
- Any specific numbers, studies, or examples mentioned
- Whether it's more factual or opinion-based

Format your response as a JSON array:
[
  {{
    "insight": "Brief description of the key insight",
    "details": "Supporting details, numbers, or examples",
    "type": "factual" or "opinion",
    "topic": "Brief topic category"
  }},
  ...
]

Focus on insights that are:
- Specific enough to form clear quiz questions
- Interesting and memorable
- Representative of the episode's main value"""


QUESTION_GENERATION_PROMPT = """You are creating quiz questions for an educational RPG game.

Topic: {title}
Expert/Source: {guest}

KEY INSIGHTS:
{insights}

Generate exactly 3 quiz questions based on these insights. Requirements:

1. QUESTION MIX:
   - Include both factual questions (testing knowledge) and opinion-based questions (recommendations)
   - Vary difficulty: 1 easy, 1 medium, 1 hard

2. QUESTION FORMAT:
   - Each question should have exactly 4 options (A, B, C, D)
   - EXACTLY ONE option must be correct - never multiple correct answers
   - Wrong options should be plausible but clearly incorrect
   - Avoid "all of the above" or "none of the above"

3. STYLE - CRITICAL:
   - Questions must be STANDALONE - they should make sense without any context about episodes or discussions
   - DO NOT use phrases like "According to the episode", "In the discussion", "The podcast mentions", "As discussed"
   - Instead, ask direct questions: "What brain region...", "Which protocol is recommended for...", "How does X affect Y?"
   - If referencing expert opinions, use the expert's name: "According to Dr. Matt Walker..." or "Dr. Huberman recommends..."
   - Questions should read like general knowledge questions, not episode summaries

4. ATTRIBUTION:
   - When the insight comes from a specific expert, attribute it: "According to {guest}..."
   - For general scientific facts, no attribution needed

Output as JSON:
{{
  "questions": [
    {{
      "id": 1,
      "type": "factual" or "opinion",
      "difficulty": "easy" or "medium" or "hard",
      "question": "The question text (standalone, no episode references)",
      "options": [
        {{"id": "a", "text": "Option A text", "correct": true/false}},
        {{"id": "b", "text": "Option B text", "correct": true/false}},
        {{"id": "c", "text": "Option C text", "correct": true/false}},
        {{"id": "d", "text": "Option D text", "correct": true/false}}
      ],
      "explanation": "Why the correct answer is right (1-2 sentences)"
    }},
    // ... 2 more questions
  ]
}}

Make the questions interesting and educational - players should feel they learned something valuable!"""
