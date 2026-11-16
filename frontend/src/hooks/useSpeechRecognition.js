import { useCallback, useEffect, useRef, useState } from 'react';
import { getSpeechRecognition } from '../lib/speech';
import { createDeepgramSession } from '../lib/deepgramSpeech';

/**
 * Wraps Deepgram Nova-2 live WebSocket streaming with graceful browser SpeechRecognition fallback.
 *
 * @param {(transcript: string) => void} onTranscript called with the running transcript
 * @returns {{ isRecording: boolean, toggleRecording: () => Promise<void>, resetTranscript: () => void, stopRecording: () => void, usingDeepgram: boolean }}
 */
export default function useSpeechRecognition(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [usingDeepgram, setUsingDeepgram] = useState(true);
  const deepgramSessionRef = useRef(null);
  const browserRecognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (deepgramSessionRef.current) {
      try {
        deepgramSessionRef.current.reset();
      } catch (_) {}
      deepgramSessionRef.current = null;
    }
    if (browserRecognitionRef.current) {
      try {
        browserRecognitionRef.current.stop();
      } catch (_) {}
      browserRecognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const resetTranscript = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // Clean up active streams on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // 1. Primary: Deepgram Nova-2 Live Streaming over WebSocket
    try {
      const session = createDeepgramSession({
        onTranscript: (liveTranscript) => {
          onTranscriptRef.current?.(liveTranscript);
        },
        onError: (err) => {
          console.warn('Deepgram session error:', err);
        },
        onStart: () => {
          setIsRecording(true);
          setUsingDeepgram(true);
        },
        onStop: () => {
          setIsRecording(false);
        }
      });

      const started = await session.start();
      if (started) {
        deepgramSessionRef.current = session;
        return;
      }
    } catch (dgErr) {
      console.warn('Deepgram connection failed, attempting browser speech fallback:', dgErr);
    }

    // 2. Fallback: Browser native SpeechRecognition
    const SpeechRecognition = getSpeechRecognition();
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let live = '';
          for (let i = 0; i < event.results.length; i++) {
            live += event.results[i][0].transcript;
          }
          onTranscriptRef.current?.(live.trim());
        };

        recognition.onstart = () => {
          setIsRecording(true);
          setUsingDeepgram(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = (e) => {
          console.warn('Browser speech recognition notice:', e.error);
          setIsRecording(false);
        };

        browserRecognitionRef.current = recognition;
        recognition.start();
      } catch (browserErr) {
        console.warn('Browser speech recognition failed:', browserErr);
        setIsRecording(false);
      }
    } else {
      console.warn('Neither Deepgram nor browser SpeechRecognition is available.');
      setIsRecording(false);
    }
  }, [isRecording, stopRecording]);

  return { isRecording, toggleRecording, resetTranscript, stopRecording, usingDeepgram };
}
