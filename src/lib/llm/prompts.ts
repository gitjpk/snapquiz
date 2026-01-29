/**
 * Quiz Generation Prompts
 * Reference: specs/004-ai-quiz-generation/research.md
 */

import type { DifficultyLevel, LLMMessage, QuizLanguage } from "./types";

// ============================================
// Difficulty Guidelines (Bloom's Taxonomy)
// ============================================

// ============================================
// Language Instructions
// ============================================

const LANGUAGE_INSTRUCTIONS: Record<QuizLanguage, string> = {
  en: "Write all questions, options, and explanations in English.",
  fr: "Écris toutes les questions, options et explications en français.",
};

const DIFFICULTY_GUIDELINES: Record<DifficultyLevel, string> = {
  easy: `EASY difficulty (Remember/Understand):
- Questions test recall of facts, definitions, and basic concepts
- Correct answer should be clearly distinguishable
- Distractors are obviously wrong to someone who read the material
- Use simple, direct language
- Focus on terminology, dates, names, and basic relationships`,

  medium: `MEDIUM difficulty (Apply/Analyze):
- Questions require understanding and connecting concepts
- All options should be plausible to someone unfamiliar with the topic
- Correct answer requires applying knowledge, not just recall
- Include questions about cause/effect, comparisons, and processes
- Test comprehension of main ideas and their implications`,

  hard: `HARD difficulty (Evaluate/Create):
- Questions require inference, evaluation, or synthesis
- Distractors are subtle and could be correct in different contexts
- May require combining multiple concepts or recognizing exceptions
- Test nuanced understanding and expert-level distinctions
- Include questions about edge cases, critiques, and deeper implications`,
};

// ============================================
// Output Schema Definition
// ============================================

const OUTPUT_SCHEMA = `{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}`;

// ============================================
// Few-Shot Examples
// ============================================

const FEW_SHOT_EXAMPLES = `
Example 1 (Easy - History):
{
  "question": "In what year did World War II end?",
  "options": ["1943", "1944", "1945", "1946"],
  "correctAnswer": 2,
  "explanation": "World War II ended in 1945 with the surrender of Japan in September."
}

Example 2 (Medium - Science):
{
  "question": "What happens to the boiling point of water at higher altitudes?",
  "options": [
    "It increases due to lower air pressure",
    "It decreases due to lower air pressure",
    "It stays the same regardless of altitude",
    "It increases due to higher air pressure"
  ],
  "correctAnswer": 1,
  "explanation": "At higher altitudes, air pressure is lower, which means water molecules can escape as vapor at lower temperatures, reducing the boiling point."
}

Example 3 (Hard - Economics):
{
  "question": "Which scenario would most likely cause stagflation?",
  "options": [
    "Increased consumer spending with stable wages",
    "Supply shock combined with accommodative monetary policy",
    "Decreased government spending with rising exports",
    "Lower interest rates with declining commodity prices"
  ],
  "correctAnswer": 1,
  "explanation": "Stagflation (stagnation + inflation) typically occurs when a supply shock (like oil crisis) reduces output while accommodative monetary policy maintains or increases prices."
}`;

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `You are an expert quiz creator specializing in educational multiple-choice questions. Your task is to generate high-quality quiz questions that accurately test knowledge of the provided material.

## Quality Rules
1. Each question must have EXACTLY 4 options
2. There must be exactly ONE correct answer
3. Avoid trick questions, double negatives, and "all of the above"/"none of the above" options
4. Questions should be clear and unambiguous
5. Options should be similar in length and structure
6. Do not include information that reveals the answer in the question
7. All options must be plausible to someone unfamiliar with the topic
8. Questions should cover diverse aspects of the material when possible
9. IMPORTANT: Vary the position of the correct answer (correctAnswer should be 0, 1, 2, or 3 - distribute them randomly across questions, NOT always 0)

## Self-Verification Checklist (apply to each question)
- [ ] Is there exactly one correct answer?
- [ ] Are all distractors plausible?
- [ ] Is the question clear and unambiguous?
- [ ] Does the explanation verify the correct answer?
- [ ] Is the correct answer NOT always in the first position?

## Output Format
Respond ONLY with valid JSON matching this schema:
${OUTPUT_SCHEMA}

## Example Questions
${FEW_SHOT_EXAMPLES}`;

// ============================================
// Prompt Builders
// ============================================

/**
 * Build messages for topic-based quiz generation
 */
export function buildTopicPrompt(
  topic: string,
  questionCount: number,
  difficulty: DifficultyLevel,
  language: QuizLanguage = "en"
): LLMMessage[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Generate ${questionCount} multiple-choice questions about the following topic.

<topic>${topic}</topic>

<difficulty>
${DIFFICULTY_GUIDELINES[difficulty]}
</difficulty>

<language>
${LANGUAGE_INSTRUCTIONS[language]}
</language>

<requirements>
- Generate exactly ${questionCount} questions
- All questions must be about the given topic
- Apply the specified difficulty level consistently
- Include an explanation for each answer
</requirements>

Respond with valid JSON only.`,
    },
  ];
}

/**
 * Build messages for document-based quiz generation
 */
export function buildDocumentPrompt(
  content: string,
  filename: string,
  questionCount: number,
  difficulty: DifficultyLevel,
  language: QuizLanguage = "en"
): LLMMessage[] {
  // Truncate content if too long (keep approximately 50000 chars)
  const maxContentLength = 50000;
  const truncatedContent =
    content.length > maxContentLength
      ? content.substring(0, maxContentLength) + "\n\n[Content truncated...]"
      : content;

  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Generate ${questionCount} multiple-choice questions based on the following document content.

<document_name>${filename}</document_name>

<document_content>
${truncatedContent}
</document_content>

<difficulty>
${DIFFICULTY_GUIDELINES[difficulty]}
</difficulty>

<language>
${LANGUAGE_INSTRUCTIONS[language]}
</language>

<requirements>
- Generate exactly ${questionCount} questions
- Questions must be answerable from the document content only
- Do not include questions about information not in the document
- Apply the specified difficulty level consistently
- Include an explanation for each answer
</requirements>

Respond with valid JSON only.`,
    },
  ];
}

/**
 * Build messages for URL-based quiz generation
 */
export function buildUrlPrompt(
  content: string,
  url: string,
  title: string | undefined,
  questionCount: number,
  difficulty: DifficultyLevel,
  language: QuizLanguage = "en"
): LLMMessage[] {
  // Truncate content if too long
  const maxContentLength = 50000;
  const truncatedContent =
    content.length > maxContentLength
      ? content.substring(0, maxContentLength) + "\n\n[Content truncated...]"
      : content;

  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: `Generate ${questionCount} multiple-choice questions based on the following web page content.

<source_url>${url}</source_url>
${title ? `<page_title>${title}</page_title>` : ""}

<page_content>
${truncatedContent}
</page_content>

<difficulty>
${DIFFICULTY_GUIDELINES[difficulty]}
</difficulty>

<language>
${LANGUAGE_INSTRUCTIONS[language]}
</language>

<requirements>
- Generate exactly ${questionCount} questions
- Questions must be answerable from the page content only
- Do not include questions about navigation, ads, or unrelated content
- Apply the specified difficulty level consistently
- Include an explanation for each answer
</requirements>

Respond with valid JSON only.`,
    },
  ];
}

// ============================================
// Response Parser
// ============================================

export interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ParsedGenerationResponse {
  questions: ParsedQuestion[];
}

/**
 * Parse and validate LLM response
 */
export function parseGenerationResponse(
  content: string
): ParsedGenerationResponse {
  // Try to extract JSON from the response
  let jsonStr = content.trim();

  // Handle markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("Response must contain a 'questions' array");
  }

  // Validate each question
  const validatedQuestions: ParsedQuestion[] = parsed.questions.map(
    (q: Record<string, unknown>, index: number) => {
      if (typeof q.question !== "string" || !q.question.trim()) {
        throw new Error(`Question ${index + 1}: missing or empty question text`);
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1}: must have exactly 4 options`);
      }

      const options = q.options.map((opt: unknown, i: number) => {
        if (typeof opt !== "string" || !opt.trim()) {
          throw new Error(
            `Question ${index + 1}, Option ${i + 1}: must be a non-empty string`
          );
        }
        return opt.trim();
      });

      const correctAnswer = Number(q.correctAnswer);
      if (
        !Number.isInteger(correctAnswer) ||
        correctAnswer < 0 ||
        correctAnswer > 3
      ) {
        throw new Error(
          `Question ${index + 1}: correctAnswer must be 0, 1, 2, or 3`
        );
      }

      return {
        question: (q.question as string).trim(),
        options,
        correctAnswer,
        explanation:
          typeof q.explanation === "string" ? q.explanation.trim() : undefined,
      };
    }
  );

  return { questions: validatedQuestions };
}
