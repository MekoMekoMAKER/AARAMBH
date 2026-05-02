import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuestions(category: QuestionCategory, count: number = 5): Promise<Question[]> {
  try {
    const prompt = `Generate ${count} high-quality UPSC Prelims level multiple choice questions for the category: ${category}. 
    Ensure the questions follow the UPSC pattern (deep conceptual understanding or factual accuracy).
    Return the response as a JSON array where each object has:
    - question: string
    - options: string[] (exactly 4 options)
    - correctAnswer: number (0-3 index)
    - explanation: string (detailed explanation for UPSC aspirants)
    - category: string (the category requested)
    - source: string (e.g., 'AI Generated', 'UPSC PYQ 2019', 'UPPSC 2023')`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              category: { type: Type.STRING },
              source: { type: Type.STRING },
            },
            required: ["question", "options", "correctAnswer", "explanation", "category", "source"],
          },
        },
      },
    });

    const questions = JSON.parse(response.text) as Question[];
    return questions.map((q, idx) => ({
      ...q,
      id: `${category}-${Date.now()}-${idx}`
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    // Fallback or rethrow
    throw error;
  }
}
