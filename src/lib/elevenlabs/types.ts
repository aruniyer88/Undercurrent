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

// Transformed types for frontend use
export interface PresetVoice {
  id: string;
  name: string;
  type: "preset";
  description: string;
  provider_voice_id: string;
  preview_url: string | null;
  labels: Record<string, string>;
}

// Language options for voice recording
export type RecordingLanguage = "english" | "french" | "hindi" | "other";

export const RECORDING_PARAGRAPHS: Record<RecordingLanguage, string> = {
  english: `The rainbow comes and goes, and lovely is the rose. The moon doth with delight look round her when the heavens are bare. Waters on a starry night are beautiful and fair. The sunshine is a glorious birth, but yet I know, where'er I go, that there hath passed away a glory from the earth. Now while the birds thus sing a joyful song, and while the young lambs bound as to the tabor's sound, to me alone there came a thought of grief. A timely utterance gave that thought relief, and I again am strong.`,
  french: `Il est des parfums frais comme des chairs d'enfants, doux comme les hautbois, verts comme les prairies, et d'autres, corrompus, riches et triomphants, ayant l'expansion des choses infinies, comme l'ambre, le musc, le benjoin et l'encens, qui chantent les transports de l'esprit et des sens. La Nature est un temple où de vivants piliers laissent parfois sortir de confuses paroles. L'homme y passe à travers des forêts de symboles qui l'observent avec des regards familiers.`,
  hindi: `जीवन में सफलता पाने के लिए कठिन परिश्रम और समर्पण की आवश्यकता होती है। हर व्यक्ति के जीवन में उतार-चढ़ाव आते हैं, लेकिन जो लोग धैर्य और साहस के साथ आगे बढ़ते हैं, वे अंततः अपने लक्ष्य को प्राप्त करते हैं। सपने देखना महत्वपूर्ण है, लेकिन उन सपनों को साकार करने के लिए मेहनत करना और भी महत्वपूर्ण है। जब हम अपने कार्यों में पूर्ण समर्पण दिखाते हैं, तो सफलता स्वयं हमारे पास आती है।`,
  other: `The rainbow comes and goes, and lovely is the rose. The moon doth with delight look round her when the heavens are bare. Waters on a starry night are beautiful and fair. The sunshine is a glorious birth, but yet I know, where'er I go, that there hath passed away a glory from the earth. Now while the birds thus sing a joyful song, and while the young lambs bound as to the tabor's sound, to me alone there came a thought of grief. A timely utterance gave that thought relief, and I again am strong.`,
};

export const LANGUAGE_LABELS: Record<RecordingLanguage, string> = {
  english: "English",
  french: "Français",
  hindi: "हिंदी",
  other: "Other",
};
