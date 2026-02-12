// ElevenLabs API Types

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: "generated" | "cloned" | "premade" | "professional" | "famous" | "high_quality";
  description: string | null;
  preview_url: string | null;
  labels: Record<string, string>;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
    use_speaker_boost: boolean;
  } | null;
  available_for_tiers: string[];
  created_at_unix: number | null;
  is_owner: boolean | null;
  is_legacy: boolean;
}

export interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
  has_more: boolean;
  total_count: number;
  next_page_token: string | null;
}

export interface ElevenLabsCloneResponse {
  voice_id: string;
  requires_verification: boolean;
}

export interface ElevenLabsError {
  detail: {
    status: string;
    message: string;
  };
}

// Shared Voice Library types (from /v1/shared-voices)
export interface ElevenLabsSharedVoice {
  public_owner_id: string;
  voice_id: string;
  name: string;
  category: string;
  gender: string;
  age: string;
  accent: string;
  descriptive: string;
  use_case: string;
  language: string;
  locale: string;
  description: string;
  preview_url: string;
  free_users_allowed: boolean;
  usage_character_count_1y: number;
  verified_languages?: Array<{
    language: string;
    model_id: string;
    accent: string;
    locale: string;
    preview_url: string;
  }>;
}

export interface ElevenLabsSharedVoicesResponse {
  voices: ElevenLabsSharedVoice[];
  has_more: boolean;
}

// Transformed types for frontend use
export interface PresetVoice {
  id: string;
  name: string;
  type: "preset";
  description: string;
  provider_voice_id: string;
  preview_url: string | null;
  labels: Record<string, string>;
  language?: string;
  public_owner_id?: string;
}

// Language mapping: study language name → ISO code
export const STUDY_LANGUAGE_TO_ISO: Record<string, string> = {
  "English": "en",
  "Hindi": "hi",
  "Spanish": "es",
  "French": "fr",
};

// ISO code → display info
export const ISO_TO_LANGUAGE_DISPLAY: Record<string, { label: string; flag: string }> = {
  "en": { label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  "hi": { label: "Hindi", flag: "\u{1F1EE}\u{1F1F3}" },
  "es": { label: "Spanish", flag: "\u{1F1EA}\u{1F1F8}" },
  "fr": { label: "French", flag: "\u{1F1EB}\u{1F1F7}" },
};

// Language options for voice recording
export type RecordingLanguage = "english" | "french" | "hindi" | "other";

export const RECORDING_PARAGRAPHS: Record<RecordingLanguage, string> = {
  english: `Welcome! I'm excited to help you today. Let me tell you a quick story. Last summer, I took a trip to the mountains. The views were absolutely breathtaking! Have you ever seen a sunset paint the sky in shades of orange and purple? It's truly magical. Sometimes I think about life's simple pleasures—a warm cup of coffee, a good book, spending time with friends and family. These moments matter most. When challenges arise, we learn and grow stronger. That's what makes us human. Now, let's pause for a moment and reflect. What dreams do you have? What goals are you working toward? Remember, every journey begins with a single step. Stay curious, stay positive, and never stop learning. Thank you for listening.`,
  french: `Il est des parfums frais comme des chairs d'enfants, doux comme les hautbois, verts comme les prairies, et d'autres, corrompus, riches et triomphants, ayant l'expansion des choses infinies, comme l'ambre, le musc, le benjoin et l'encens, qui chantent les transports de l'esprit et des sens. La Nature est un temple où de vivants piliers laissent parfois sortir de confuses paroles. L'homme y passe à travers des forêts de symboles qui l'observent avec des regards familiers.`,
  hindi: `जीवन में सफलता पाने के लिए कठिन परिश्रम और समर्पण की आवश्यकता होती है। हर व्यक्ति के जीवन में उतार-चढ़ाव आते हैं, लेकिन जो लोग धैर्य और साहस के साथ आगे बढ़ते हैं, वे अंततः अपने लक्ष्य को प्राप्त करते हैं। सपने देखना महत्वपूर्ण है, लेकिन उन सपनों को साकार करने के लिए मेहनत करना और भी महत्वपूर्ण है। जब हम अपने कार्यों में पूर्ण समर्पण दिखाते हैं, तो सफलता स्वयं हमारे पास आती है।`,
  other: `Welcome! I'm excited to help you today. Let me tell you a quick story. Last summer, I took a trip to the mountains. The views were absolutely breathtaking! Have you ever seen a sunset paint the sky in shades of orange and purple? It's truly magical. Sometimes I think about life's simple pleasures—a warm cup of coffee, a good book, spending time with friends and family. These moments matter most. When challenges arise, we learn and grow stronger. That's what makes us human. Now, let's pause for a moment and reflect. What dreams do you have? What goals are you working toward? Remember, every journey begins with a single step. Stay curious, stay positive, and never stop learning. Thank you for listening.`,
};

export const LANGUAGE_LABELS: Record<RecordingLanguage, string> = {
  english: "English",
  french: "Français",
  hindi: "हिंदी",
  other: "Other",
};
