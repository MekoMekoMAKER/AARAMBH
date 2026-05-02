import { GoogleGenAI } from "@google/genai";
import { UserStats, TopicPrediction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStudyPlan(stats: UserStats) {
  try {
    const prompt = `
      You are an expert UPSC preparation mentor. Based on the following aspirant's performance metrics, generate a highly personalized daily study plan.
      
      Aspirant Stats:
      - Current Level: ${stats.level}
      - Streak: ${stats.streak} days
      - Accuracy: ${stats.totalQuestionsAttempted > 0 ? (stats.correctAnswers / stats.totalQuestionsAttempted * 100).toFixed(2) : 0}%
      - Recent Test History: ${JSON.stringify(stats.testHistory.slice(0, 5))}
      
      Return the response in JSON format:
      {
        "dailyTargets": ["string"],
        "prioritySubjects": ["string"],
        "weakAreas": ["string"],
        "schedule": {
          "Morning": "string",
          "Afternoon": "string",
          "Evening": "string",
          "Night": "string"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Study Plan Error:", error);
    return null;
  }
}

export async function analyzeAndGenerateQuestions(
  content: string, 
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed' = 'Mixed',
  userPerformance?: string 
) {
  try {
    const prompt = `
      You are a UPSC Content Architect and Historical Exam Researcher. 
      Deeply analyze the provided content and provide exam-relevant practice.

      PRIORITY INSTRUCTION:
      1. Use Search Grounding to find REAL Preliminary Year Questions (PYQs) from UPSC (2013-2024) and State PSCs (UPPSC, BPSC, RAS, MPPSC) related to this content.
      2. MIX RATIO: Prioritize PYQs (aim for 70-80%). Use AI-generated questions ONLY as fallback if sufficient relevant PYQs aren't found.
      3. For PYQs, maintain original phrasing and options. Label source as "UPSC PYQ [Year]" or "[State] PSC PYQ [Year]".
      4. For AI Questions, label as "AI Generated" and ensure they follow the conceptual pattern of UPSC.

      TASK 1: Structural Analysis
      - Identify primary subject (Polity, History, etc.)
      - Identify topics and sub-topics.

      TASK 2: Question Generation (10 Questions Total)
      - Difficulty: ${difficulty}
      - TYPES: MCQ, Statement-Based, Assertion-Reason, Match the Following.
      
      TASK 3: Strategic Explanations
      - Connect correct answers to core concepts.
      - Perform Distractor Analysis (Why others are wrong).
      - Add "Repeated Concept" flag if the theme is frequently asked in UPSC.

      Content to analyze:
      ${content}
      
      Return a JSON object:
      {
        "analysis": {
          "subject": "string",
          "topics": ["string"],
          "concepts": ["string"],
          "relevanceScore": 0-100
        },
        "notes": {
          "summary": ["string"],
          "keyFacts": ["string"],
          "keywords": ["string"],
          "upscHighlights": ["string"],
          "shortNotes": "string (markdown)"
        },
        "questions": [
          {
            "type": "MCQ | AssertionReason | StatementBased | MatchFollowing",
            "question": "string",
            "difficulty": "Easy | Medium | Hard",
            "statements": ["string"], 
            "assertion": "string",
            "reason": "string", 
            "matchLeft": ["string"],
            "matchRight": ["string"],
            "options": ["string"], 
            "correctAnswer": 0-3 index,
            "explanation": "### Detailed Insight\n- **Correct Answer:** [Reasoning]\n- **Distractor Analysis:** [Why A was wrong, Why B was wrong...]\n- **UPSC Key Concept:** [Theme]",
            "category": "string",
            "source": "UPSC PYQ [Year] | [State] PSC PYQ [Year] | AI Generated",
            "isRepeated": boolean,
            "frequency": "High | Medium | Low (UPSC trend)"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
      tools: [{ googleSearchRetrieval: {} }]
    } as any);

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
}

export async function generateCustomQuestions(
  topic: string, 
  count: number, 
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed' = 'Mixed',
  filter: 'PYQ_ONLY' | 'MIXED' | 'AI_ONLY' = 'MIXED'
) {
  try {
    const prompt = `
      Act as a UPSC Historical Paper Analyst. 
      Generate ${count} questions on "${topic}" for a UPSC Prelims aspirant.
      Difficulty: ${difficulty}.
      Mode: ${filter}.

      STRICT SOURCE GUIDELINES:
      - If Mode is PYQ_ONLY: DO NOT generate AI questions. Use Search Grounding to find ${count} real questions from UPSC/State PSCs.
      - If Mode is MIXED: Aim for 75% REAL PYQs and 25% AI-generated concept checks.
      - If Mode is AI_ONLY: Generate high-quality mock questions based on UPSC patterns.

      REQUIRED METADATA:
      - Label real questions with specific source: "UPSC PYQ 2021", "UPPSC PYQ 2018", etc.
      - Label AI questions as "AI Generated".
      - For PYQs, include "isRepeated" true if the concept has appeared >3 times in last decade.

      Return an array of JSON objects matching the Question interface:
      {
        "question": "string",
        "type": "MCQ | AssertionReason | StatementBased | MatchFollowing",
        "statements": ["string"], 
        "options": ["string"],
        "correctAnswer": number,
        "explanation": "### Why it is correct\n...\n### Distractor Analysis\n...",
        "difficulty": "${difficulty === 'Mixed' ? 'Medium' : difficulty}",
        "source": "string",
        "isRepeated": boolean,
        "frequency": "High | Medium | Low"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
      tools: [{ googleSearchRetrieval: {} }]
    } as any);

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Question Generation Error:", error);
    return [];
  }
}

export async function getTopicPredictions(): Promise<TopicPrediction[]> {
  try {
    const prompt = `
      Act as a UPSC expert analyzer. Based on current trends (2024-2025) and previous 10 years papers, identify 10 high-probability topics for the upcoming prelims.
      
      Return JSON:
      {
        "predictions": [
          {
            "id": "uuid-string",
            "topic": "Specific Topic Name (e.g., MSP, Carbon Credit, PESA Act)",
            "subject": "Economy/Polity/Environment/etc",
            "priority": "High/Medium/Low",
            "reason": "Clear 1-sentence exam logic why it's important this year",
            "trend": "rising/stable"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text);
    return data.predictions;
  } catch (error) {
    console.error("Prediction failed:", error);
    return [];
  }
}

export async function getCountryGeopoliticalAnalysis(countryName: string, indiaFocus: boolean = false) {
  try {
    const prompt = `
      Analyze the country "${countryName}" specifically for a UPSC (Civil Services) aspirant.
      ${indiaFocus ? "DYNAMIC FOCUS: This is INDIA-CENTRIC mode. Prioritize border issues, Indian Ocean strategic depth, and bilateral agreements (MOU, Defense, Trade)." : "General global geopolitical relevance."}
      Character limit: Keep points extremely crisp and exam-oriented.

      Required sections in JSON:
      {
        "strategicImportance": "Short 1-2 sentence paragraph",
        "indiaRelations": ["3 precise bullet points: Trade/Defense/Diplomacy"],
        "keyOrganizations": ["G20, BRICS, etc."],
        "recentDevelopments": ["2-3 most important current events from the last 12 months"],
        "politicalHead": "Current Head of State/Government",
        "capital": "Official Capital",
        "currency": "Currency name and symbol",
        "importanceLevel": "High/Medium/Low (based on UPSC trend)",
        "importanceReason": "1-sentence reason why UPSC asks about this country",
        "criticalTerminology": ["Key terms: e.g., 'String of Pearls', 'Nordic Model'"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Geopolitical Analysis Error:", error);
    return null;
  }
}
