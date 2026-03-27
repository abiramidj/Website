import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Build a prompt for generating MCQs.
 * @param {{ domain: string, subtopic: string, difficulty: string, level: string, count: number }} params
 * @returns {string}
 */
export function buildGenerationPrompt({ domain, subtopic, difficulty, level, count }) {
  return `You are an expert medical educator specializing in surgical oncology. Generate exactly ${count} high-quality multiple-choice questions (MCQs) for the following specifications:

Domain: ${domain}
Subtopic: ${subtopic || 'General'}
Difficulty: ${difficulty}
Target Level: ${level}

IMPORTANT REQUIREMENTS:
1. Return ONLY a valid JSON array — no preamble, no markdown, no code fences.
2. Each question must have exactly these fields:
   - "question": string — the question stem (clear, clinical, concise)
   - "options": array of exactly 4 strings — plausible answer choices
   - "correct": integer 0–3 — index of the correct option in the options array
   - "explanation": string — detailed explanation of why the correct answer is right and why the others are wrong
3. Questions must be clinically accurate, evidence-based, and appropriate for the ${level} level.
4. Do NOT include patient names, identifying information, or real case data.
5. Vary question styles: recall, clinical vignette, mechanism-based, management-based.
6. Distractors must be plausible and educational.

Output format example (produce ${count} items like this):
[
  {
    "question": "A 52-year-old woman presents with...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2,
    "explanation": "The correct answer is Option C because..."
  }
]

Generate exactly ${count} questions now:`;
}
