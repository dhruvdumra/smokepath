import { useEffect, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';

interface Props { children: ReactNode; open: boolean; onOpen: (open: boolean) => void; peek: number }

/** Phone: the ticket as a bottom sheet. Peek shows the route block; drag or tap the handle to open it fully. */
export function Sheet({ children, open, onOpen, peek }: Props) {
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => setH(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const height = h * 0.9;
  const closedY = height - h * peek;
  const y = useMotionValue(open ? 0 : closedY);

  useEffect(() => {
    const c = animate(y, open ? 0 : closedY, { type: 'spring', stiffness: 380, damping: 38 });
    return () => c.stop();
  }, [open, closedY, y]);

  return (
    <motion.section className="sheet" style={{ y, height }} drag="y" dragConstraints={{ top: 0, bottom: closedY }}
                    dragElastic={0.06} dragListener={!open}
                    onDragEnd={(_, info) => onOpen(info.velocity.y < -200 || (info.velocity.y < 200 && y.get() < closedY / 2))}
                    aria-label="Smoke ticket">
      <button className="sheet-handle" onClick={() => onOpen(!open)} aria-expanded={open} aria-label={open ? 'Collapse ticket' : 'Expand ticket'}>
        <span />
      </button>
      <div className="sheet-body" style={{ overflowY: open ? 'auto' : 'hidden' }}>{children}</div>
    </motion.section>
  );
}
