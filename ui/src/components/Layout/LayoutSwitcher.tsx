import { LAYOUT_OPTIONS } from '../../config/layoutOptions';
import type { LayoutMode } from '../../config/viewport';

export interface LayoutSwitcherProps {
  current: LayoutMode;
  onSelect: (mode: LayoutMode) => void;
  className?: string;
}

export function LayoutSwitcher({
  current,
  onSelect,
  className = '',
}: LayoutSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Layout Options"
      className={`inline-flex items-center gap-1 rounded-lg bg-muted/50 p-1 backdrop-blur border border-border/40 ${className}`}
    >
      {LAYOUT_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = current === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-label={opt.label}
            title={`${opt.label} (${opt.shortcut})`}
            data-active={isActive ? 'true' : 'false'}
            onClick={() => onSelect(opt.id)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
