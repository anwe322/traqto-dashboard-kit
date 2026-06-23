import { useMemo } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import type { DashboardLayout, DataContext, LayoutItem } from "./types";
import { WidgetHost } from "./WidgetHost";
import { getWidget } from "./WidgetRegistry";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./grid.css";

export type DashboardGridProps = {
  layout: DashboardLayout;
  ctx: DataContext;
  editMode?: boolean;
  onLayoutChange?: (items: LayoutItem[]) => void;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  width?: number;
};

export function DashboardGrid({
  layout,
  ctx,
  editMode = false,
  onLayoutChange,
  onRemove,
  onConfigure,
  columns = 12,
  rowHeight = 80,
  gap = 12,
  width = 1336,
}: DashboardGridProps) {
  const rglLayout: Layout[] = useMemo(
    () =>
      layout.items.map((it) => {
        const def = getWidget(it.widgetId);
        return {
          i: it.i,
          x: it.x,
          y: it.y,
          w: it.w,
          h: it.h,
          minW: def?.minSize?.w ?? 2,
          minH: def?.minSize?.h ?? 2,
        };
      }),
    [layout.items],
  );

  const handleLayoutChange = (next: Layout[]) => {
    if (!onLayoutChange) return;
    const byId = new Map(layout.items.map((it) => [it.i, it]));
    const merged: LayoutItem[] = next
      .map((n) => {
        const prev = byId.get(n.i);
        // Unknown id (grid/state desync) — skip instead of creating an empty
        // placeholder item that would clobber the original widget.
        if (!prev) return null;
        if (prev.x === n.x && prev.y === n.y && prev.w === n.w && prev.h === n.h) return prev;
        return { ...prev, x: n.x, y: n.y, w: n.w, h: n.h };
      })
      .filter((it): it is LayoutItem => it !== null);
    onLayoutChange(merged);
  };

  return (
    <div className="tdk-dashboard-grid" data-edit-mode={editMode ? "1" : "0"}>
      <GridLayout
        className="layout"
        layout={rglLayout}
        cols={columns}
        rowHeight={rowHeight}
        width={width}
        margin={[gap, gap]}
        containerPadding={[0, 0]}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".tdk-drag-handle"
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        useCSSTransforms
      >
        {layout.items.map((it) => (
          <div key={it.i} className={editMode ? "tdk-drag-handle" : undefined}>
            <WidgetHost item={it} ctx={ctx} editMode={editMode} onRemove={onRemove} onConfigure={onConfigure} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}