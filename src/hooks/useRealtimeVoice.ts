/**
 * useRealtimeVoice Hook
 *
 * Manages OpenAI Realtime API WebSocket connection for voice conversations.
 * Handles audio recording, streaming, and playback.
 *
 * @returns Voice chat state and controls
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeVoiceOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
}

export const useRealtimeVoice = (options: UseRealtimeVoiceOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const isConnectingRef = useRef(false); // Guard against multiple connections

  // Initialize audio context
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // OpenAI Realtime uses 24kHz
      });
    }
    return audioContextRef.current;
  }, []);

  // Convert Float32Array to PCM16 Int16Array
  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Convert Int16Array to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play audio chunk
  const playAudioChunk = async (pcmData: Int16Array) => {
    const audioContext = await initAudioContext();

    // Convert PCM16 to Float32
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF);
    }

    // Create audio buffer
    const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    // Create source and play
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  };

  // Process playback queue
  const processPlaybackQueue = async () => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    while (playbackQueueRef.current.length > 0) {
      const chunk = playbackQueueRef.current.shift();
      if (chunk) {
        await playAudioChunk(chunk);
      }
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  // Connect to Realtime API via proxy server
  const connect = useCallback(async () => {
    // Guard against multiple simultaneous connection attempts
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('Already connecting or connected, skipping...');
      return;
    }

    isConnectingRef.current = true;

    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('Connecting to voice proxy server...');

      // Connect to proxy server with Supabase token
      // IMPORTANT: Update this URL after deploying to Render
      const PROXY_URL = import.meta.env.VITE_REALTIME_PROXY_URL || 'ws://localhost:8080';
      const wsUrl = `${PROXY_URL}?token=${session.access_token}`;

      // Create WebSocket connection to proxy
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Connected to voice proxy server');
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
      };

      wsRef.current.onmessage = async (event) => {
        try {
          // Check if message is text (JSON) or binary (Blob)
          if (typeof event.data !== 'string') {
            // If it's a Blob, convert to text first
            if (event.data instanceof Blob) {
              const text = await event.data.text();
              event.data = text;
            } else {
              // Skip non-text, non-Blob messages
              return;
            }
          }

          const data = JSON.parse(event.data);

          // Handle different event types
          switch (data.type) {
            case 'conversation.item.input_audio_transcription.completed':
              // User speech transcription
              if (options.onTranscript) {
                options.onTranscript(data.transcript, true);
              }
              break;

            case 'response.audio.delta':
              // Incoming audio from Parra
              if (data.delta) {
                // Decode base64 to Int16Array
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const pcmData = new Int16Array(bytes.buffer);
                playbackQueueRef.current.push(pcmData);
                processPlaybackQueue();
              }
              break;

            case 'response.audio_transcript.delta':
              // Parra's response transcript
              if (options.onResponse && data.delta) {
                options.onResponse(data.delta);
              }
              break;

            case 'error':
              console.error('Realtime API error:', data);
              setError(data.error?.message || 'Unknown error');
              if (options.onError) {
                options.onError(new Error(data.error?.message || 'Unknown error'));
              }
              break;
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('Connection error');
        setIsConnected(false);
        isConnectingRef.current = false;
        if (options.onError) {
          options.onError(new Error('WebSocket connection error'));
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsListening(false);
        isConnectingRef.current = false;
        stopRecording();

        // Log close details for debugging
        if (event.code !== 1000) {
          console.error('Abnormal close. Code:', event.code, 'Reason:', event.reason);
        }
      };
    } catch (err) {
      console.error('❌ Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      isConnectingRef.current = false;
      if (options.onError) {
        options.onError(err as Error);
      }
    }
  }, [options]);

  // Start recording and streaming audio
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to voice service');
      return;
    }

    try {
      const audioContext = await initAudioContext();

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      const source = audioContext.createMediaStreamSource(stream);

      // Create processor for audio chunks
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcm16.buffer);

        // Send audio to OpenAI
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      if (options.onError) {
        options.onError(err as Error);
      }
    }
  }, [initAudioContext, options]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Stop listening (but keep connection)
  const stopListening = useCallback(() => {
    stopRecording();

    // Commit audio buffer to OpenAI
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));

      // Request response generation
      wsRef.current.send(JSON.stringify({
        type: 'response.create',
      }));
    }
  }, [stopRecording]);

  // Disconnect
  const disconnect = useCallback(() => {
    stopRecording();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, [stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
  };
};
