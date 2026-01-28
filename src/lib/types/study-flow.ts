// ============================================
// STUDY FLOW UI STATE TYPES
// These types represent the UI state for the flow builder
// They transform to/from the database types in database.ts
// ============================================

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const ITEM_TYPES = [
  'open_ended',
  'single_select',
  'multi_select',
  'rating_scale',
  'ranking',
  'instruction',
  'ai_conversation',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const PROBING_MODES = ['disabled', 'auto'] as const;
export type ProbingMode = (typeof PROBING_MODES)[number];

export const RESPONSE_MODES = ['voice', 'text', 'screen'] as const;
export type ResponseMode = (typeof RESPONSE_MODES)[number];

export const AI_CONVERSATION_BASIS = ['prior_answers', 'custom'] as const;
export type AIConversationBasis = (typeof AI_CONVERSATION_BASIS)[number];

export const AI_CONVERSATION_DURATIONS = [30, 60, 120, 180, 240, 300] as const;
export type AIConversationDuration = (typeof AI_CONVERSATION_DURATIONS)[number];

export const STIMULUS_TYPES = ['image', 'website', 'youtube'] as const;
export type StimulusType = (typeof STIMULUS_TYPES)[number];

// ============================================
// ITEM TYPES (Questions, Instructions, AI Conversations)
// ============================================

// Base item interface
interface BaseItem {
  id: string;
  order: number;
}

// Open-ended question
export interface OpenEndedItem extends BaseItem {
  type: 'open_ended';
  questionText: string;
  probingMode: ProbingMode;
  responseMode: 'voice' | 'text';
}

// Single select question
export interface SingleSelectItem extends BaseItem {
  type: 'single_select';
  questionText: string;
  options: string[];
  responseMode: 'screen' | 'voice';
}

// Multi select question
export interface MultiSelectItem extends BaseItem {
  type: 'multi_select';
  questionText: string;
  options: string[];
  responseMode: 'screen' | 'voice';
}

// Rating scale question
export interface RatingScaleItem extends BaseItem {
  type: 'rating_scale';
  questionText: string;
  scaleSize: number; // 5-10
  lowLabel: string;
  highLabel: string;
  responseMode: 'screen' | 'voice';
}

// Ranking question
export interface RankingItem extends BaseItem {
  type: 'ranking';
  questionText: string;
  items: string[]; // 2-7 items
}

// Instruction block
export interface InstructionItem extends BaseItem {
  type: 'instruction';
  content: string;
}

// AI Conversation
export interface AIConversationItem extends BaseItem {
  type: 'ai_conversation';
  durationSeconds: AIConversationDuration;
  basis: AIConversationBasis;
  customInstructions: string;
}

// Union type for all items
export type FlowItem =
  | OpenEndedItem
  | SingleSelectItem
  | MultiSelectItem
  | RatingScaleItem
  | RankingItem
  | InstructionItem
  | AIConversationItem;

// ============================================
// STIMULUS
// ============================================

export interface ImageStimulus {
  type: 'image';
  url: string;
  caption?: string;
}

export interface WebsiteStimulus {
  type: 'website';
  url: string;
  instructions?: string;
}

export interface YouTubeStimulus {
  type: 'youtube';
  url: string;
  instructions?: string;
}

export type Stimulus = ImageStimulus | WebsiteStimulus | YouTubeStimulus;

// ============================================
// SECTION
// ============================================

export interface Section {
  id: string;
  title: string; // Auto-generated: "Section 1", "Section 2", etc.
  stimulus?: Stimulus;
  items: FlowItem[];
  order: number;
}

// ============================================
// WELCOME SCREEN
// ============================================

export interface WelcomeScreen {
  message: string;
  logoUrl?: string;
}

// ============================================
// STUDY FLOW FORM STATE
// ============================================

export interface StudyFlowFormData {
  id?: string; // study_flow.id (undefined for new)
  studyId: string;
  welcomeScreen: WelcomeScreen;
  sections: Section[];
}

// ============================================
// VALIDATION ERRORS
// ============================================

export interface ItemValidationErrors {
  questionText?: string;
  content?: string;
  options?: string;
  items?: string;
  customInstructions?: string;
  customProbes?: string;
  scaleSize?: string;
}

export interface SectionValidationErrors {
  title?: string;
  stimulus?: string;
  items?: Record<string, ItemValidationErrors>;
}

export interface StudyFlowValidationErrors {
  welcomeScreen?: {
    message?: string;
  };
  sections?: Record<string, SectionValidationErrors>;
  general?: string;
}

// ============================================
// AI GENERATION
// ============================================

export interface GenerateStudyFlowInput {
  projectBasics: {
    title: string;
    objective: string;
    audience: string;
    aboutInterviewer: string;
    language: string;
  };
  additionalDetails?: string;
}

export interface GenerateStudyFlowOutput {
  welcomeScreen: WelcomeScreen;
  sections: Section[];
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createSection(order: number): Section {
  return {
    id: crypto.randomUUID(),
    title: `Section ${order + 1}`,
    items: [],
    order,
  };
}

export function createOpenEndedItem(order: number): OpenEndedItem {
  return {
    id: crypto.randomUUID(),
    type: 'open_ended',
    questionText: '',
    probingMode: 'auto',
    responseMode: 'voice',
    order,
  };
}

export function createSingleSelectItem(order: number): SingleSelectItem {
  return {
    id: crypto.randomUUID(),
    type: 'single_select',
    questionText: '',
    options: ['', ''],
    responseMode: 'screen',
    order,
  };
}

export function createMultiSelectItem(order: number): MultiSelectItem {
  return {
    id: crypto.randomUUID(),
    type: 'multi_select',
    questionText: '',
    options: ['', ''],
    responseMode: 'screen',
    order,
  };
}

export function createRatingScaleItem(order: number): RatingScaleItem {
  return {
    id: crypto.randomUUID(),
    type: 'rating_scale',
    questionText: '',
    scaleSize: 5,
    lowLabel: 'Lowest rating',
    highLabel: 'Highest rating',
    responseMode: 'screen',
    order,
  };
}

export function createRankingItem(order: number): RankingItem {
  return {
    id: crypto.randomUUID(),
    type: 'ranking',
    questionText: '',
    items: ['', ''],
    order,
  };
}

export function createInstructionItem(order: number): InstructionItem {
  return {
    id: crypto.randomUUID(),
    type: 'instruction',
    content: '',
    order,
  };
}

export function createAIConversationItem(order: number): AIConversationItem {
  return {
    id: crypto.randomUUID(),
    type: 'ai_conversation',
    durationSeconds: 120,
    basis: 'prior_answers',
    customInstructions: '',
    order,
  };
}

export function createItem(type: ItemType, order: number): FlowItem {
  switch (type) {
    case 'open_ended':
      return createOpenEndedItem(order);
    case 'single_select':
      return createSingleSelectItem(order);
    case 'multi_select':
      return createMultiSelectItem(order);
    case 'rating_scale':
      return createRatingScaleItem(order);
    case 'ranking':
      return createRankingItem(order);
    case 'instruction':
      return createInstructionItem(order);
    case 'ai_conversation':
      return createAIConversationItem(order);
  }
}

// ============================================
// ITEM TYPE LABELS
// ============================================

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  open_ended: 'Open-Ended Question',
  single_select: 'Single Select',
  multi_select: 'Multi Select',
  rating_scale: 'Rating Scale',
  ranking: 'Ranking',
  instruction: 'Instruction',
  ai_conversation: 'AI Conversation',
};

export const ITEM_TYPE_DESCRIPTIONS: Record<ItemType, string> = {
  open_ended: 'Ask an exploratory question that invites detailed responses',
  single_select: 'Participants choose one option from a list',
  multi_select: 'Participants can select multiple options',
  rating_scale: 'Rate on a numeric scale (e.g., 1-10)',
  ranking: 'Drag and drop items to rank by preference',
  instruction: 'Display information or instructions to participants',
  ai_conversation: 'AI-led freeform conversation based on context',
};
