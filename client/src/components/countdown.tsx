import { useState, useEffect } from 'react';

export function Countdown({ expiryTime, onExpiry }: { expiryTime: number, onExpiry?: () => void }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpiry) onExpiry();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, timeLeft, onExpiry]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="tabular-nums font-mono text-orange-600">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}
