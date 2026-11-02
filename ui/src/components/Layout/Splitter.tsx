import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';

export interface SplitterProps {
  orientation: 'vertical' | 'horizontal';
  onDrag?: (deltaPercent: number, clientX: number, clientY: number) => void;
  currentSizeTooltip?: string;
  className?: string;
}

export function Splitter({
  orientation,
  onDrag,
  currentSizeTooltip,
  className = '',
}: SplitterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  function handleMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
      if (onDrag) {
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;
        const delta = orientation === 'vertical' ? deltaX : deltaY;
        onDrag(delta, e.clientX, e.clientY);
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
      setTooltipPos(null);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrag, orientation]);

  const isVertical = orientation === 'vertical';

  return (
    <>
      <div
        role="separator"
        tabIndex={0}
        aria-orientation={orientation}
        onMouseDown={handleMouseDown}
        className={`group relative flex items-center justify-center transition-colors select-none ${
          isVertical
            ? 'w-2 cursor-col-resize hover:bg-primary/20 active:bg-primary/40'
            : 'h-2 cursor-row-resize hover:bg-primary/20 active:bg-primary/40'
        } ${className}`}
      >
        <div
          className={`rounded-full bg-border transition-colors group-hover:bg-primary/70 ${
            isVertical ? 'h-8 w-1' : 'h-1 w-8'
          }`}
        />
      </div>

      {isDragging && currentSizeTooltip && tooltipPos && (
        <div
          data-testid="splitter-tooltip"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-8 rounded-md bg-popover/90 px-2 py-1 text-xs font-medium text-popover-foreground shadow-lg backdrop-blur border border-border"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          {currentSizeTooltip}
        </div>
      )}
    </>
  );
}
