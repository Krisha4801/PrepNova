import { useEffect, useState } from 'react';

/**
 * Counts elapsed seconds since the component mounted.
 * @returns {number} seconds elapsed
 */
export default function useInterviewTimer() {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return secondsElapsed;
}
