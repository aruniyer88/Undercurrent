'use client';

import type { StimulusConfig } from '@/lib/types/database';

interface StimulusDisplayProps {
  type: 'image' | 'website' | 'youtube';
  config: StimulusConfig | null;
  className?: string;
}

export function StimulusDisplay({ type, config, className }: StimulusDisplayProps) {
  if (!config?.url) return null;

  return (
    <div className={`p-4 ${className || ''}`}>
      {/* Caption / Instructions */}
      {config.instructions && (
        <p className="text-sm text-neutral-600 mb-3">{config.instructions}</p>
      )}

      {/* Image */}
      {type === 'image' && (
        <div className="flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.url}
            alt={config.caption || 'Study stimulus'}
            className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      )}

      {/* Website */}
      {type === 'website' && (
        <iframe
          src={config.url}
          title={config.caption || 'Study stimulus'}
          className="w-full h-[40vh] md:h-[70vh] rounded-lg border border-neutral-200"
          sandbox="allow-scripts allow-same-origin"
        />
      )}

      {/* YouTube */}
      {type === 'youtube' && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={getYouTubeEmbedUrl(config.url)}
            title={config.caption || 'Study stimulus'}
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Caption */}
      {config.caption && (
        <p className="text-xs text-neutral-500 mt-2 text-center">{config.caption}</p>
      )}
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  // Fallback: assume it's already an embed URL or return as-is
  return url;
}
