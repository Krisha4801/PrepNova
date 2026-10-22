import { useCallback, useEffect, useRef, useState } from 'react';
import { getSpeechRecognition } from '../lib/speech';

/**
 * Wraps the browser SpeechRecognition API for voice dictation.
 *
 * @param {(transcript: string) => void} onTranscript called with the full
 *   running transcript each time the recogniser produces a result.
 * @returns {{ isRecording: boolean, toggleRecording: () => void }}
 */
export default function useSpeechRecognition(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);

  // Always call the latest callback without re-creating the recogniser.
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          onTranscriptRef.current?.(transcript);
        };

        recognition.onerror = (err) => {
          console.warn('Speech recognition notice:', err.error);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition initialization skipped:', e);
      }
    }

    return () => {
      try { recognitionRef.current?.stop(); } catch (_) { /* already stopped */ }
    };
  }, []);

  const toggleRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      try { recognition.stop(); } catch (_) { /* already stopped */ }
      setIsRecording(false);
    } else {
      try { recognition.start(); } catch (_) { /* already started */ }
      setIsRecording(true);
    }
  }, [isRecording]);

  return { isRecording, toggleRecording };
}
