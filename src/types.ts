/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'MCQ' | 'AssertionReason' | 'StatementBased' | 'MatchFollowing' | 'TrueFalse';

export interface Question {
  id?: string;
  type?: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: number; 
  explanation: string;
  category: QuestionCategory;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  statements?: string[]; // For statement-based
  assertion?: string; // For A-R
  reason?: string; // For A-R
  matchLeft?: string[]; // For Match Following
  matchRight?: string[]; // For Match Following
  source?: string;
  isRepeated?: boolean;
  frequency?: string;
}

export type QuestionCategory = 
  | 'Polity' 
  | 'History' 
  | 'Geography' 
  | 'Economy' 
  | 'Environment' 
  | 'Science'
  | 'Current Affairs'
  | 'Custom'
  | 'AI Lab';

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category: 'Current Affairs' | 'Strategy' | 'Subject Doubts' | 'General';
  upvotes: string[]; // UIDs
  commentCount: number;
  createdAt: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface SavedQuestion {
  id: string;
  userId: string;
  subject: string;
  questionData: Question;
  createdAt: string;
}

export interface StudyPlan {
  id?: string;
  userId: string;
  planData: {
    dailyTargets: string[];
    prioritySubjects: string[];
    weakAreas: string[];
    schedule: Record<string, string>;
  };
  generatedAt: string;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  testHistory: TestResult[];
  performanceBySubject: Record<string, { total: number; correct: number }>;
  eliminationStats?: { correct: number; total: number };
}

export interface TestResult {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timeTaken: number; // seconds
  subjectBreakdown: Record<string, { correct: number; total: number }>;
  eliminationStats?: { correct: number; total: number };
}

export const XP_PER_LEVEL = 500;
export const XP_PER_CORRECT = 10;
export const XP_COMPLETION_BONUS = 50;

export interface RevisionNotes {
  summary: string[];
  keyFacts: string[];
  keywords: string[];
  upscHighlights: string[];
  shortNotes: string;
}

export type AppTheme = 'dark' | 'sepia' | 'dim-gray' | 'night-blue' | 'forest' | 'deep-purple' | 'white-classic';

export interface BookmarkedQuestion {
  questionId: string;
  question: string;
  topic: string;
  subject: string;
  savedAt: string;
}

export interface MistakeRecord {
  questionId: string;
  question: string;
  topic: string;
  subject: string;
  incorrectCount: number;
  lastAttempt: string;
}

export interface AppData {
  stats: UserStats;
  bookmarks: BookmarkedQuestion[];
  mistakes: MistakeRecord[];
  syllabus?: SyllabusState;
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface TopicPrediction {
  id: string;
  topic: string;
  subject: string;
  priority: PriorityLevel;
  reason: string;
  trend: 'rising' | 'stable' | 'declining';
}

export interface SyllabusItem {
  id: string;
  topic: string;
  isCompleted: boolean;
  priority?: PriorityLevel;
}

export interface SyllabusSubject {
  name: string;
  topics: SyllabusItem[];
}

export interface StudyLog {
  date: string; // ISO
  topic: string;
  subject: string;
}

export interface SyllabusState {
  subjects: SyllabusSubject[];
  logs: StudyLog[];
  streak: number;
  lastLoggedDate: string | null;
}
