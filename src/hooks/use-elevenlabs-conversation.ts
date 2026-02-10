'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Conversation } from '@11labs/client';
import type { Mode, Status } from '@11labs/client';
import type { OrbState, ConversationEntry } from '@/lib/types/interview';

interface UseElevenLabsConversationOptions {
  /** Study ID — the server fetches all context and builds overrides */
  studyId: string;
}

interface UseElevenLabsConversationReturn {
  /** Start the conversation */
  start: () => Promise<void>;
  /** End the conversation */
  stop: () => Promise<void>;
  /** Current orb state derived from agent mode */
  orbState: OrbState;
  /** Connection status */
  status: Status;
  /** Conversation transcript entries */
  entries: ConversationEntry[];
  /** ElevenLabs conversation ID */
  conversationId: string | null;
  /** Error message */
  error: string | null;
  /** The conversation instance — for frequency data access */
  conversation: Conversation | null;
}

export function useElevenLabsConversation(
  options: UseElevenLabsConversationOptions
): UseElevenLabsConversationReturn {
  const { studyId } = options;

  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [status, setStatus] = useState<Status>('disconnected');
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conv, setConv] = useState<Conversation | null>(null);
  const conversationRef = useRef<Conversation | null>(null);

  const addEntry = useCallback((speaker: 'ai' | 'participant', text: string) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        speaker,
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    console.log('[ElevenLabs] Starting conversation...', { studyId });

    try {
      // Get signed URL + server-built overrides from our API
      const res = await fetch('/api/interview/get-conversation-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_id: studyId }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to get conversation URL: ${res.status} ${errText}`);
      }
      const { signed_url } = await res.json();
      console.log('[ElevenLabs] Got signed URL, starting session...');

      const conversation = await Conversation.startSession({
        signedUrl: signed_url,
        onConnect: ({ conversationId: id }) => {
          console.log('[ElevenLabs] Connected, conversationId:', id);
          setConversationId(id);
          setStatus('connected');
        },
        onDisconnect: () => {
          console.log('[ElevenLabs] Disconnected');
          setStatus('disconnected');
          setOrbState('idle');
        },
        onError: (message, context) => {
          console.error('[ElevenLabs] Error:', message, context);
          setError(message);
        },
        onModeChange: ({ mode }: { mode: Mode }) => {
          if (mode === 'speaking') {
            setOrbState('speaking');
          } else {
            setOrbState('listening');
          }
        },
        onMessage: ({ message, source }) => {
          addEntry(source === 'ai' ? 'ai' : 'participant', message);
        },
        onStatusChange: ({ status: s }) => {
          setStatus(s);
        },
      });

      console.log('[ElevenLabs] Session started successfully');
      conversationRef.current = conversation;
      setConv(conversation);
    } catch (err) {
      console.error('[ElevenLabs] Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      setStatus('disconnected');
    }
  }, [studyId, addEntry]);

  const stop = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
      setConv(null);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    orbState,
    status,
    entries,
    conversationId,
    error,
    conversation: conv,
  };
}
