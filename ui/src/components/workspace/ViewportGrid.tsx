import type { CSSProperties } from 'react';
import type { AiModel, ModelId, WorkspaceLayout } from '@/lib/workspaceConfig';
import { Viewport } from './Viewport';

interface ViewportGridProps {
  models: AiModel[];
  layout: WorkspaceLayout;
  conversations: Partial<Record<ModelId, string[]>>;
  onClear: (id: ModelId) => void;
}

export function ViewportGrid({ models, layout, conversations, onClear }: ViewportGridProps) {
  const template = layout.template(models.length);
  const gridStyle: CSSProperties = {
    gridTemplateColumns: template.columns,
    gridTemplateRows: template.rows,
  };

  return (
    <div className="grid min-h-0 flex-1 gap-2 p-2 sm:gap-3 sm:p-3" style={gridStyle}>
      {models.map((model, index) => {
        const leadStyle: CSSProperties | undefined =
          layout.stackedLead && index === 0 && models.length > 1
            ? { gridColumn: '1', gridRow: `1 / span ${models.length - 1}` }
            : undefined;
        return (
          <Viewport
            key={model.id}
            model={model}
            messages={conversations[model.id] ?? []}
            onClear={() => onClear(model.id)}
            style={leadStyle}
          />
        );
      })}
    </div>
  );
}
