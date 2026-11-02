import { useRef, useEffect } from 'react';
import type { AiModel, ModelId } from '@/lib/workspaceConfig';
import { Viewport } from '../workspace/Viewport';
import { Splitter } from './Splitter';
import { useViewportStore } from '../../stores/viewportStore';

interface WorkspaceGridProps {
  models: AiModel[];
  conversations: Partial<Record<ModelId, string[]>>;
  onClear: (id: ModelId) => void;
}

export function WorkspaceGrid({
  models,
  conversations,
  onClear,
}: WorkspaceGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    layoutMode,
    splitRatio,
    setSplitRatio,
    setContainerSize,
    containerSize,
  } = useViewportStore();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [setContainerSize]);

  // 分割条拖拽处理器
  function handleSplitterDrag(deltaPx: number) {
    if (containerSize.width <= 0) return;
    const deltaRatio = deltaPx / containerSize.width;
    setSplitRatio(splitRatio + deltaRatio);
  }

  const tooltipText = `${Math.round(splitRatio * 100)}% | ${Math.round(
    containerSize.width * splitRatio
  )}px`;

  // 单视口模式
  if (layoutMode === 'single' || models.length <= 1) {
    const m = models[0];
    return (
      <div ref={containerRef} className="flex min-h-0 flex-1 p-2 sm:p-3">
        {m && (
          <Viewport
            key={m.id}
            model={m}
            messages={conversations[m.id] ?? []}
            onClear={() => onClear(m.id)}
          />
        )}
      </div>
    );
  }

  // 双视口分栏模式 (dual)
  if (layoutMode === 'dual') {
    const m1 = models[0];
    const m2 = models[1];
    return (
      <div ref={containerRef} className="flex min-h-0 flex-1 p-2 sm:p-3 gap-1">
        <div style={{ flex: splitRatio }} className="min-w-0 h-full flex flex-col">
          {m1 && (
            <Viewport
              key={m1.id}
              model={m1}
              messages={conversations[m1.id] ?? []}
              onClear={() => onClear(m1.id)}
            />
          )}
        </div>
        <Splitter
          orientation="vertical"
          onDrag={handleSplitterDrag}
          currentSizeTooltip={tooltipText}
        />
        <div style={{ flex: 1 - splitRatio }} className="min-w-0 h-full flex flex-col">
          {m2 && (
            <Viewport
              key={m2.id}
              model={m2}
              messages={conversations[m2.id] ?? []}
              onClear={() => onClear(m2.id)}
            />
          )}
        </div>
      </div>
    );
  }

  // 主辅模式 (main-sub)
  if (layoutMode === 'main-sub') {
    const mainModel = models[0];
    const subModels = models.slice(1, 4);
    return (
      <div ref={containerRef} className="flex min-h-0 flex-1 p-2 sm:p-3 gap-1">
        <div style={{ flex: splitRatio }} className="min-w-0 h-full flex flex-col">
          {mainModel && (
            <Viewport
              key={mainModel.id}
              model={mainModel}
              messages={conversations[mainModel.id] ?? []}
              onClear={() => onClear(mainModel.id)}
            />
          )}
        </div>
        <Splitter
          orientation="vertical"
          onDrag={handleSplitterDrag}
          currentSizeTooltip={tooltipText}
        />
        <div style={{ flex: 1 - splitRatio }} className="flex min-w-0 h-full flex-col gap-2">
          {subModels.map((m) => (
            <div key={m.id} className="min-h-0 flex-1 flex flex-col">
              <Viewport
                model={m}
                messages={conversations[m.id] ?? []}
                onClear={() => onClear(m.id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 带鱼屏模式 (ultrawide)
  if (layoutMode === 'ultrawide') {
    return (
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 p-2 sm:p-3 gap-2 overflow-x-auto"
      >
        {models.map((m) => (
          <div key={m.id} className="min-w-[280px] flex-1 h-full flex flex-col">
            <Viewport
              model={m}
              messages={conversations[m.id] ?? []}
              onClear={() => onClear(m.id)}
            />
          </div>
        ))}
      </div>
    );
  }

  // 四宫格模式 (grid) 默认
  return (
    <div
      ref={containerRef}
      className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 p-2 sm:gap-3 sm:p-3"
    >
      {models.slice(0, 4).map((m) => (
        <Viewport
          key={m.id}
          model={m}
          messages={conversations[m.id] ?? []}
          onClear={() => onClear(m.id)}
        />
      ))}
    </div>
  );
}
