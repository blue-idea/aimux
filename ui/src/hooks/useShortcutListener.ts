import { useEffect } from 'react';
import { SHORTCUT_IDS, comboFromEvent, type ShortcutId, type Shortcuts } from '@/lib/settings';

type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

export function useShortcutListener(
  shortcuts: Shortcuts,
  handlers: ShortcutHandlers,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const combo = comboFromEvent(event);
      if (!combo) return;
      const id = SHORTCUT_IDS.find((item) => shortcuts[item] === combo);
      const handler = id ? handlers[id] : undefined;
      if (!handler) return;
      event.preventDefault();
      handler();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, handlers, enabled]);
}
