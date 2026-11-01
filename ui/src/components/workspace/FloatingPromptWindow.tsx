import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { GripHorizontal } from 'lucide-react';
import { useSettings } from '@/contexts/settingsContext';

interface FloatingPromptWindowProps {
  children: ReactNode;
}

interface Position {
  x: number;
  y: number;
}

interface DragState {
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function FloatingPromptWindow({ children }: FloatingPromptWindowProps) {
  const { t } = useSettings();
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [position, setPosition] = useState<Position | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const element = windowRef.current;
    const container = element?.offsetParent;
    if (!element || !(container instanceof HTMLElement)) return;
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: rect.left - containerRect.left,
      originY: rect.top - containerRect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const element = windowRef.current;
    const container = element?.offsetParent;
    if (!drag || !element || !(container instanceof HTMLElement)) return;
    setPosition({
      x: clamp(
        drag.originX + event.clientX - drag.pointerX,
        0,
        container.clientWidth - element.offsetWidth
      ),
      y: clamp(
        drag.originY + event.clientY - drag.pointerY,
        0,
        container.clientHeight - element.offsetHeight
      ),
    });
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const placement = position
    ? { left: position.x, top: position.y }
    : { left: '50%', bottom: 16, transform: 'translateX(-50%)' };

  return (
    <div
      ref={windowRef}
      style={placement}
      className="glass-surface absolute z-30 flex w-[min(560px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl border border-[rgb(var(--ink-rgb)/0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex h-8 shrink-0 cursor-grab touch-none select-none items-center gap-2 border-b border-[rgb(var(--ink-rgb)/0.08)] px-3 text-[11px] text-[var(--muted)] active:cursor-grabbing"
      >
        <GripHorizontal className="h-3.5 w-3.5" />
        <span>{t('dock.title')}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
