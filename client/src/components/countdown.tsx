import { useState, useEffect } from 'react';

export function Countdown({ expiryTime, onExpiry }: { expiryTime: number; onExpiry?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));

  useEffect(() => {
    const computeRemaining = () => Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));

    setTimeLeft(computeRemaining());

    const timer = setInterval(() => {
      const remaining = computeRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpiry) onExpiry();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, onExpiry]);

  if (timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="tabular-nums font-mono text-[10px] text-orange-500 dark:text-orange-400">
      {minutes > 0
        ? `${minutes}:${seconds.toString().padStart(2, '0')}`
        : `${seconds}s`}
    </span>
  );
}
