import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

// Displays the API score; on first mount it counts up from 0, later changes tween.
export function ScoreCountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const reduce = useReducedMotion();
  const current = useRef(reduce ? value : 0);
  const firstRun = useRef(true);
  const [shown, setShown] = useState(current.current);

  useEffect(() => {
    if (reduce) {
      current.current = value;
      setShown(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration: 0.8,
      delay: firstRun.current ? delay : 0,
      ease: 'easeOut',
      onUpdate: (v) => {
        current.current = v;
        setShown(Math.round(v));
      },
    });
    firstRun.current = false;
    return () => controls.stop();
  }, [value, reduce, delay]);

  return <>{shown}</>;
}
