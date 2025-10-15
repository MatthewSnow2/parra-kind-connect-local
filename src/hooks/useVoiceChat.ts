/**
 * useVoiceChat Hook
 *
 * Manages voice conversations using OpenAI pipeline (Whisper + GPT-4 + TTS)
 * Replaces the problematic Realtime API with a reliable, proven approach.
 *
 * @returns Voice chat state and controls
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
}

export const useVoiceChat = (options: UseVoiceChatOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationHistoryRef = useRef<Message[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Start recording audio from microphone
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting audio recording...');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🔴 Recording stopped, processing audio...');
        await processAudio();

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setError(null);

      console.log('✅ Recording started');
    } catch (err) {
      console.error('❌ Error starting recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err as Error);
      }
    }
  }, [options]);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️  Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  /**
   * Process recorded audio through voice chat pipeline
   */
  const processAudio = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('📦 Audio blob size:', audioBlob.size, 'bytes');

      if (audioBlob.size === 0) {
        throw new Error('No audio recorded');
      }

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Include conversation history for context
      if (conversationHistoryRef.current.length > 0) {
        formData.append('history', JSON.stringify(conversationHistoryRef.current));
      }

      console.log('📤 Sending to voice-chat function...');

      // Call voice-chat edge function
      const { data, error: functionError } = await supabase.functions.invoke('voice-chat', {
        body: formData,
      });

      if (functionError) {
        throw functionError;
      }

      if (!data) {
        throw new Error('No response from voice chat');
      }

      const { transcript, responseText, audio } = data;

      console.log('📝 Transcript:', transcript);
      console.log('💬 Response:', responseText);

      // Update conversation history
      conversationHistoryRef.current.push(
        { role: 'user', content: transcript },
        { role: 'assistant', content: responseText }
      );

      // Notify callbacks
      if (options.onTranscript) {
        options.onTranscript(transcript);
      }

      if (options.onResponse) {
        options.onResponse(responseText);
      }

      // Play response audio
      await playAudio(audio);

    } catch (err) {
      console.error('❌ Error processing audio:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process audio';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err as Error);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  /**
   * Play audio response
   */
  const playAudio = useCallback(async (audioData: number[]) => {
    try {
      console.log('🔊 Playing audio response...');
      setIsSpeaking(true);

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Convert array back to Uint8Array and create blob
      const audioArray = new Uint8Array(audioData);
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log('✅ Audio playback finished');
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (err) => {
          console.error('❌ Audio playback error:', err);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(new Error('Audio playback failed'));
        };

        audio.play().catch((err) => {
          console.error('❌ Failed to play audio:', err);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(err);
        });
      });
    } catch (err) {
      console.error('❌ Error playing audio:', err);
      setIsSpeaking(false);
      throw err;
    }
  }, []);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    conversationHistoryRef.current = [];
    console.log('🗑️  Conversation history cleared');
  }, []);

  /**
   * Stop any ongoing audio playback
   */
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
      console.log('⏹️  Audio playback stopped');
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    isSpeaking,
    error,
    startRecording,
    stopRecording,
    clearHistory,
    stopAudio,
  };
};
