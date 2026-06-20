/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: string[];
}

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string; // or "Presente"
  description: string;
}

export interface Education {
  id: string;
  degree: string;
  fieldOfStudy: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface OptimizationResult {
  scoreBefore: number;
  scoreAfter: number;
  missingKeywords: string[];
  suggestedSummary: string;
  suggestedExperiences: {
    experienceId: string;
    suggestedBulletPoints: string[];
    justification: string;
  }[];
  strengthPoints: string[];
  recommendedSkillsToAdd: string[];
  gupyCompatibilityScore?: number;
  gupyAdvice?: string[];
  internetVagaSearchInfo?: string;
}

export interface CoverLetterResult {
  letterText: string;
  sectionsAdvice: {
    greeting: string;
    hook: string;
    body: string;
    closure: string;
  };
}

export interface NetworkingTemplate {
  subject: string;
  messageText: string;
  channel: "LinkedIn" | "Email";
  coachingTip: string;
}

export interface NetworkingResult {
  templates: NetworkingTemplate[];
}

export interface InterviewQuestion {
  id: string;
  questionText: string;
  category: "comportamental" | "tecnica" | "situacional" | "geral";
  intent: string; // What the interviewer is actually asking
  tips: string;   // Helpful hints before answering
}

export interface InterviewSession {
  jobTitle: string;
  jobDescription?: string;
  questions: InterviewQuestion[];
}

export interface AnswerEvaluation {
  rating: "Excelente" | "Bom" | "Pode Melhorar";
  positives: string[];
  improvements: string[];
  alternativeAnswer: string;
  score: number;
}

export interface CompanyDossierResult {
  companyName: string;
  industry: string;
  cultureDescription: string;
  majorProductsServices: string[];
  recentNewsOrTrends: string[];
  likelyQuestionsAsked: string[];
  interviewStrategy: string;
}
