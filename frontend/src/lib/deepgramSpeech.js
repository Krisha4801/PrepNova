/**
 * Deepgram Live Streaming Speech-to-Text Client
 * Connects directly to Deepgram Nova-2 streaming WebSocket via browser MediaRecorder.
 */

import { getDeepgramVoiceTokenApi } from './api';

let cachedDeepgramToken = null;
let tokenFetchPromise = null;

export async function fetchDeepgramToken() {
  if (cachedDeepgramToken) return cachedDeepgramToken;
  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      const res = await getDeepgramVoiceTokenApi();
      if (res && res.key) {
        cachedDeepgramToken = res.key;
        return res.key;
      }
    } catch (err) {
      console.warn("Could not retrieve Deepgram voice token from server:", err);
    } finally {
      tokenFetchPromise = null;
    }
    return null;
  })();

  return tokenFetchPromise;
}

/**
 * Creates a managed Deepgram live streaming audio session.
 *
 * @param {Object} options
 * @param {(transcript: string, isFinal: boolean) => void} options.onTranscript
 * @param {(err: Error) => void} [options.onError]
 * @param {() => void} [options.onStart]
 * @param {() => void} [options.onStop]
 * @returns {{ start: () => Promise<boolean>, stop: () => void, reset: () => void, isRecording: () => boolean }}
 */
export function createDeepgramSession({
  onTranscript,
  onError,
  onStart,
  onStop
}) {
  let socket = null;
  let mediaRecorder = null;
  let mediaStream = null;
  let isRecording = false;
  let confirmedText = '';

  const stop = () => {
    isRecording = false;

    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch (_) {}

    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    } catch (_) {}

    try {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.send(JSON.stringify({ type: 'CloseStream' }));
        socket.close();
      }
    } catch (_) {}

    socket = null;
    mediaRecorder = null;
    mediaStream = null;
    confirmedText = '';

    if (onStop) onStop();
  };

  const start = async () => {
    if (isRecording) return true;

    // Fresh transcript state every time recording starts
    confirmedText = '';

    try {
      // 1. Fetch token
      const token = await fetchDeepgramToken();
      if (!token) {
        throw new Error('Deepgram voice token is unavailable.');
      }

      // 2. Request clean microphone stream with echo cancellation & noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      mediaStream = stream;

      // 3. Connect WebSocket to Deepgram Nova-2
      // Using smart_format, punctuate, and vad_events for accurate, natural speech recognition
      const url = new URL('wss://api.deepgram.com/v1/listen');
      url.searchParams.set('model', 'nova-2');
      url.searchParams.set('smart_format', 'true');
      url.searchParams.set('punctuate', 'true');
      url.searchParams.set('interim_results', 'true');
      url.searchParams.set('vad_events', 'true');

      const ws = new WebSocket(url.toString(), ['token', token]);
      socket = ws;

      ws.onopen = () => {
        isRecording = true;
        if (onStart) onStart();

        // 4. Start MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorder = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // Send audio slice every 250ms for live low-latency transcription
        recorder.start(250);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
            const alt = data.channel.alternatives[0];
            const speechText = (alt.transcript || '').trim();

            if (speechText.length > 0) {
              if (data.is_final) {
                confirmedText = confirmedText ? `${confirmedText} ${speechText}` : speechText;
                onTranscript(confirmedText, true);
              } else {
                const combined = confirmedText ? `${confirmedText} ${speechText}` : speechText;
                onTranscript(combined, false);
              }
            }
          }
        } catch (parseErr) {
          console.warn('Error parsing Deepgram message:', parseErr);
        }
      };

      ws.onerror = (err) => {
        console.warn('Deepgram WebSocket error:', err);
        if (onError) onError(err);
        stop();
      };

      ws.onclose = () => {
        if (isRecording) {
          stop();
        }
      };

      return true;
    } catch (err) {
      console.warn('Failed to start Deepgram live session:', err);
      stop();
      if (onError) onError(err);
      return false;
    }
  };

  return {
    start,
    stop,
    reset: () => {
      confirmedText = '';
      stop();
    },
    isRecording: () => isRecording
  };
}
