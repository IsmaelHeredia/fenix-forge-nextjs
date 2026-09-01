import { useEffect, useState } from "react";

export function useLiveElapsed(startTime: number, active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startTime) {
      setElapsed(0);
      return;
    }

    const update = () => setElapsed((Date.now() - startTime) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [active, startTime]);

  return elapsed;
}