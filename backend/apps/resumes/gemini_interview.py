import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Use gemini-1.5-flash as the default model
def get_model():
    return genai.GenerativeModel('gemini-1.5-flash-latest')

def start_dynamic_interview(job_title, job_description="", resume_text=""):
    """
    Generates the first interview question using Gemini based on JD and Resume.
    """
    if not GEMINI_API_KEY:
        return fallback_start_interview()

    prompt = f"""
    You are an expert technical hiring manager interviewing a candidate for a '{job_title}' role.
    
    Job Description:
    {job_description}
    
    Candidate Resume:
    {resume_text}
    
    Task: Ask the very first technical interview question. 
    Make it relevant to the intersection of the candidate's experience and the job requirements.
    Make it a moderately difficult, open-ended question to assess their fundamental understanding of the core technology.
    
    Output strictly as valid JSON without markdown blocks, in this format:
    {{
        "question": "The actual question text here",
        "category": "Core Technical Foundation",
        "difficulty": "Medium"
    }}
    """
    try:
        model = get_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7
            )
        )
        text = response.text
        # Clean markdown if present
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        data = json.loads(text.strip())
        return data
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return fallback_start_interview()

def next_dynamic_question(job_description, resume_text, history):
    """
    Evaluates the previous answer and generates the next dynamic question based on conversation history.
    """
    if not GEMINI_API_KEY:
        return fallback_next_question(history)

    history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in history])
    
    prompt = f"""
    You are an expert technical hiring manager conducting a mock interview.
    
    Job Description context:
    {job_description[:500]}
    
    Conversation History:
    {history_text}
    
    Task:
    1. First, classify the candidate's last answer (the final 'User:' message) into one of these categories:
       - Substantive Answer: Relevant concepts or architectural details.
       - Evasive or Insufficient Answer: Vague statements, "I don't know", or off-topic.
       - Non-Response / Blank: Empty, timeout, or repetitive filler.
    2. Evaluate the answer using this STRICT scoring rubric:
       - 0% - 20% (Zero to Low Range): For "I don't know", evasive, off-topic, or empty answers.
       - 30% - 50% (Partial / Developing): Touches on buzzwords but lacks depth, correctness, or structure.
       - 60% - 85% (Proficient Range): Correctly explains concepts, references relevant trade-offs.
       - 90% - 100% (Mastery Range): Deep architectural insights, handles edge cases, structured reasoning (STAR method).
    3. Based on the evaluation, formulate the NEXT question.
       - If they answered well (score > 60), dig deeper into edge cases (increase difficulty).
       - If they struggled (score < 50), ask for a simpler clarification or pivot.

    Output strictly as valid JSON without markdown blocks, in this format:
    {{
        "evaluation": {{
            "overall_score": 85,
            "technical_depth": 85,
            "communication_clarity": 90,
            "problem_solving": 80,
            "hiring_manager_recommendation": "Hire",
            "is_poor_answer": false, // Set to true ONLY if overall_score is under 40
            "strengths": ["Mentioned specific tradeoff.", "Clear explanation."],
            "weaknesses": ["Could discuss scale more."],
            "actionable_tips": ["Mention big-O notation next time."]
        }},
        "next_question": {{
            "question": "Great explanation. Now, how would you handle that at scale...",
            "category": "System Design & Scaling",
            "difficulty": "Hard"
        }}
    }}
    """
    try:
        model = get_model()
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        text = response.text
        # Clean markdown if present
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
            
        data = json.loads(text.strip())
        return data
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return fallback_next_question(history)

def fallback_start_interview():
    return {
        "question": "Can you walk me through your experience building scalable backend architectures?",
        "category": "Architecture",
        "difficulty": "Medium"
    }

def fallback_next_question(history):
    return {
        "evaluation": {
            "overall_score": 0,
            "technical_depth": 0,
            "communication_clarity": 0,
            "problem_solving": 0,
            "hiring_manager_recommendation": "No Hire",
            "is_poor_answer": True,
            "strengths": ["None identified due to system fallback."],
            "weaknesses": ["Candidate response could not be evaluated.", "Fallback triggered."],
            "actionable_tips": ["Please ensure a stable connection and try answering again."]
        },
        "next_question": {
            "question": "I missed that. Could you repeat your answer or elaborate further?",
            "category": "Clarification",
            "difficulty": "Easy"
        }
    }
