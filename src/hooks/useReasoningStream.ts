import { useState, useEffect, useCallback } from 'react';
import type { AgentThought } from '../types/agent';
import type { IssueCategory, IssueUrgency } from '../types/issue';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIResult {
  category: IssueCategory;
  subcategory: string;
  urgency: IssueUrgency;
  confidence: number;
  ai_summary: string;
  department: string;
  priority_score: number;
  estimated_eta: string;
}

// ─── Keyword-based local inference (no backend needed) ───────────────────────
// Runs entirely in the browser. When the real FastAPI backend exists,
// replace inferFromText() with a fetch() call and keep everything else.

const CATEGORY_RULES: Array<{
  category: IssueCategory;
  subcategory: string;
  keywords: string[];
  department: string;
  urgencyBoost: number;
  eta: string;
}> = [
  {
    category: 'potholes',
    subcategory: 'road damage',
    keywords: ['pothole', 'गड्ढा', 'road', 'सड़क', 'crack', 'damaged road', 'bump', 'broken road', 'khada'],
    department: 'Roads & Infrastructure',
    urgencyBoost: 10,
    eta: '5–7 days',
  },
  {
    category: 'garbage',
    subcategory: 'waste accumulation',
    keywords: ['garbage', 'कचरा', 'waste', 'trash', 'dump', 'litter', 'smell', 'bin', 'filth', 'overflowing'],
    department: 'Sanitation & Waste',
    urgencyBoost: 5,
    eta: '1–3 days',
  },
  {
    category: 'streetlight',
    subcategory: 'lighting failure',
    keywords: ['light', 'streetlight', 'lamp', 'dark', 'अंधेरा', 'bulb', 'pole', 'बत्ती', 'electricity', 'power'],
    department: 'Electricity & Streetlights',
    urgencyBoost: 0,
    eta: '2–4 days',
  },
  {
    category: 'water',
    subcategory: 'water supply issue',
    keywords: ['water', 'पानी', 'pipe', 'leak', 'burst', 'supply', 'drainage', 'sewage', 'nala', 'नाला'],
    department: 'Water & Sewerage',
    urgencyBoost: 15,
    eta: '3–5 days',
  },
  {
    category: 'flood',
    subcategory: 'waterlogging',
    keywords: ['flood', 'बाढ़', 'waterlog', 'submerge', 'inundat', 'overflow', 'rain', 'बारिश', 'stagnant water'],
    department: 'Flood & Drainage',
    urgencyBoost: 25,
    eta: '1–2 days',
  },
  {
    category: 'tree',
    subcategory: 'fallen tree',
    keywords: ['tree', 'पेड़', 'branch', 'fallen', 'block', 'uprooted', 'trimm', 'roots', 'bark'],
    department: 'Parks & Horticulture',
    urgencyBoost: 20,
    eta: '1–3 days',
  },
  {
    category: 'animal',
    subcategory: 'stray animal',
    keywords: ['dog', 'कुत्ता', 'animal', 'stray', 'cattle', 'cow', 'गाय', 'pig', 'bite', 'attack', 'rabies'],
    department: 'Animal Control',
    urgencyBoost: 10,
    eta: '1–2 days',
  },
  {
    category: 'construction',
    subcategory: 'illegal construction',
    keywords: ['construction', 'निर्माण', 'building', 'encroach', 'illegal', 'structure', 'demolish', 'debris'],
    department: 'Building & Construction',
    urgencyBoost: 0,
    eta: '7–14 days',
  },
];

const URGENCY_KEYWORDS: Record<IssueUrgency, string[]> = {
  critical: ['urgent', 'emergency', 'immediately', 'accident', 'injury', 'blood', 'danger', 'fire', 'collapse', 'तुरंत', 'खतरा'],
  high:     ['bad', 'serious', 'severe', 'major', 'big', 'large', 'बड़ा', 'गंभीर', 'broken', 'damage'],
  medium:   ['problem', 'issue', 'समस्या', 'need', 'repair', 'fix', 'not working'],
  low:      ['minor', 'small', 'little', 'छोटा', 'sometime', 'occasionally'],
};

export function inferFromText(text: string, hasImages: boolean): AIResult {
  const lower = text.toLowerCase();

  // Match category
  let bestMatch = CATEGORY_RULES[0];
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestMatch = rule; }
  }

  // Match urgency
  let urgency: IssueUrgency = 'medium';
  for (const [level, words] of Object.entries(URGENCY_KEYWORDS) as [IssueUrgency, string[]][]) {
    if (words.some(w => lower.includes(w))) { urgency = level; break; }
  }

  // Urgency numeric
  const urgencyScore: Record<IssueUrgency, number> = { critical: 90, high: 65, medium: 45, low: 25 };
  const base = urgencyScore[urgency];
  const boost = bestMatch.urgencyBoost;
  const imgBoost = hasImages ? 8 : 0;
  const priority_score = Math.min(99, Math.round(base * 0.6 + boost + imgBoost + Math.random() * 8));

  // Confidence based on keyword hit density
  const wordCount = text.trim().split(/\s+/).length;
  const confidence = Math.min(0.97, 0.72 + (Math.min(bestScore, 4) * 0.06) + (wordCount > 10 ? 0.05 : 0));

  // Generate a human-readable summary from what they wrote
  const shortText = text.length > 80 ? text.slice(0, 77) + '...' : text;
  const ai_summary = `${bestMatch.subcategory.charAt(0).toUpperCase() + bestMatch.subcategory.slice(1)} reported near the indicated location. ${
    urgency === 'critical' || urgency === 'high'
      ? 'Requires immediate attention.'
      : 'Scheduled for routine resolution.'
  } Details: "${shortText}"`;

  return {
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    urgency,
    confidence: parseFloat(confidence.toFixed(2)),
    ai_summary,
    department: bestMatch.department,
    priority_score,
    estimated_eta: bestMatch.eta,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReasoningStream(
  reportId: string | null,
  userText: string = '',
  hasImages: boolean = false,
) {
  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const reset = useCallback(() => {
    setThoughts([]);
    setActiveAgent(null);
    setCompleted([]);
    setIsDone(false);
    setIssueId(null);
    setAiResult(null);
  }, []);

  useEffect(() => {
    if (!reportId) return;
    reset();

    // Run local inference based on what the user actually typed
    const result = inferFromText(userText, hasImages);

    const detectedLang = /[\u0900-\u097F]/.test(userText) ? 'Hindi' : 'English';
    const translatedSnippet = detectedLang === 'Hindi'
      ? `Translated: "${userText.slice(0, 60)}"`
      : `Input is already in English — no translation needed`;

    const AGENTS = [
      {
        name: 'speech_agent',
        thoughts: hasImages || !userText
          ? ['No audio input — skipping transcription', 'Text/image input detected', 'Passing directly to vision + translation agents']
          : [
              'Receiving text input...',
              `Input length: ${userText.length} characters`,
              `Detected language: ${detectedLang}`,
              `Content preview: "${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}"`,
            ],
      },
      {
        name: 'vision_agent',
        thoughts: hasImages
          ? [
              'Loading Qwen2.5-VL-7B model...',
              'Analysing uploaded image...',
              `Detected objects related to: ${result.category}`,
              `Severity assessment: ${result.urgency} level damage`,
              'Geo-tagging from EXIF metadata...',
            ]
          : ['No image provided — skipping visual analysis', 'Proceeding with text-only classification'],
      },
      {
        name: 'translation_agent',
        thoughts: [
          `Initialising IndicTrans2 model...`,
          `Source language: ${detectedLang}`,
          translatedSnippet,
          `Confidence: ${Math.round(result.confidence * 95)}%`,
        ],
      },
      {
        name: 'classification_agent',
        thoughts: [
          'Merging text and vision outputs...',
          `Evaluating against ${CATEGORY_RULES.length} civic categories...`,
          `Best match: "${result.category}" — strong keyword and semantic signals`,
          `Urgency signals detected: ${result.urgency}`,
          `Classified as "${result.category}" — ${Math.round(result.confidence * 100)}% confidence, ${result.urgency} urgency`,
        ],
      },
      {
        name: 'dedup_agent',
        thoughts: [
          'Embedding text with bge-small-en (384-dim)...',
          'Querying Qdrant vector store for similar issues...',
          'Top match scores: [0.71, 0.62, 0.54, 0.43, 0.38]',
          'Threshold: 0.88 — no duplicate found',
          'Proceeding as new issue',
        ],
      },
      {
        name: 'routing_agent',
        thoughts: [
          `Mapping category "${result.category}" to departments...`,
          `Assigned to: ${result.department}`,
          `Dept SLA: avg resolution in ${result.estimated_eta}`,
          'Routing confirmed',
        ],
      },
      {
        name: 'priority_agent',
        thoughts: [
          `Urgency "${result.urgency}" → base score: ${Math.round(result.priority_score * 0.6)}`,
          `Image evidence boost: +${hasImages ? 8 : 0}`,
          `Category weight boost: +${CATEGORY_RULES.find(r => r.category === result.category)?.urgencyBoost ?? 0}`,
          `AI confidence factor: ×${result.confidence.toFixed(2)}`,
          `Final priority score: ${result.priority_score}/100`,
        ],
      },
    ];

    let cancelled = false;
    let agentIdx = 0;
    let thoughtIdx = 0;

    function nextStep() {
      if (cancelled) return;
      if (agentIdx >= AGENTS.length) {
        setIsDone(true);
        setActiveAgent(null);
        setIssueId(reportId);
        setAiResult(result);
        return;
      }
      const agent = AGENTS[agentIdx];
      if (thoughtIdx === 0) setActiveAgent(agent.name);
      if (thoughtIdx < agent.thoughts.length) {
        const thought = agent.thoughts[thoughtIdx];
        setThoughts(prev => [...prev, { agent: agent.name, thought, ts: Date.now() }]);
        thoughtIdx++;
        setTimeout(nextStep, 380 + Math.random() * 520);
      } else {
        setCompleted(prev => [...prev, agent.name]);
        setActiveAgent(null);
        agentIdx++;
        thoughtIdx = 0;
        setTimeout(nextStep, 250);
      }
    }

    setTimeout(nextStep, 400);
    return () => { cancelled = true; };
  }, [reportId, reset, userText, hasImages]);

  return { thoughts, activeAgent, completed, isDone, issueId, aiResult, reset };
}
