import { useEffect, useMemo, useRef, useState } from "react";
import type { LayoutItem, DataContext } from "./types";
import { getWidget } from "./WidgetRegistry";
import { WidgetFrame } from "./WidgetFrame";
import { useTheme } from "../theme/ThemeProvider";
import { exportWidget, type ExportFormat } from "./export";

export type WidgetHostProps = {
  item: LayoutItem;
  ctx: DataContext;
  editMode?: boolean;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
};

export function WidgetHost({ item, ctx, editMode, onRemove, onConfigure }: WidgetHostProps) {
  const def = getWidget(item.widgetId);
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const cfg = useMemo(
    () => ({ ...(def?.defaultConfig ?? {}), ...item.config }),
    [def, item.config],
  );
  const cfgKey = useMemo(() => JSON.stringify(cfg), [cfg]);

  useEffect(() => {
    if (!def) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(() => def.loadData(ctx, cfg))
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [def, ctx.userId, ctx.orgId, cfgKey]);

  if (!def) {
    return (
      <WidgetFrame title="Unbekanntes Widget" editMode={editMode} onRemove={onRemove ? () => onRemove(item.i) : undefined}>
        <div style={{ color: "#c0392b", fontSize: 13 }}>Widget "{item.widgetId}" nicht registriert.</div>
      </WidgetFrame>
    );
  }

  const csvData = toCsvRows(data);
  const safeFilename = (def.title || def.id).replace(/[\\/:*?"<>|]/g, "-");

  const handleExport = (format: ExportFormat) => {
    try {
      const root = (def.category === "kpi" ? wrapperRef.current : bodyRef.current) as HTMLElement | null;
      if (!root) return;
      const r = exportWidget(format, safeFilename, root, csvData);
      if (r instanceof Promise) r.catch((err) => console.error("[traqto/dashboard-kit] Export fehlgeschlagen:", err));
    } catch (err) {
      console.error("[traqto/dashboard-kit] Export fehlgeschlagen:", err);
    }
  };

  const canExportCsv = csvData != null && csvData.length > 0;
  const body = loading ? (
    <LoadingSkeleton />
  ) : error != null ? (
    <ErrorState message={error.message} />
  ) : (
    def.render({ data, cfg, loading, error })
  );

  if (def.category === "kpi") {
    return (
      <div
        ref={wrapperRef}
        className={editMode ? "tdk-kpi-drag-handle" : undefined}
        style={{ position: "relative", height: "100%" }}
      >
        {body}
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
          <ExportButtonInline onExport={handleExport} canExportCsv={canExportCsv} />
          {editMode && onRemove && <RemoveButton onClick={() => onRemove(item.i)} />}
        </div>
      </div>
    );
  }

  return (
    <WidgetFrame
      title={def.title}
      editMode={editMode}
      onRemove={onRemove ? () => onRemove(item.i) : undefined}
      onConfigure={onConfigure ? () => onConfigure(item.i) : undefined}
      onExport={handleExport}
      canExportCsv={canExportCsv}
      bodyRef={bodyRef}
    >
      {body}
    </WidgetFrame>
  );
}

function toCsvRows(data: unknown): Array<Record<string, unknown>> | null {
  if (data == null) return null;
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.rows)) return d.rows as Array<Record<string, unknown>>;
    if (Array.isArray(d.data)) return d.data as Array<Record<string, unknown>>;
    if (Array.isArray(d.items)) return d.items as Array<Record<string, unknown>>;
    return [d];
  }
  return null;
}

function LoadingSkeleton() {
  const { tokens, gradient } = useTheme();
  return (
    <div
      style={{
        height: "100%",
        minHeight: 60,
        borderRadius: tokens.radius.md,
        background: `linear-gradient(90deg, ${gradient[0]}0d 0%, ${gradient[1]}1f 50%, ${gradient[0]}0d 100%)`,
        backgroundSize: "200% 100%",
        animation: "tdk-shimmer 1.4s infinite",
      }}
    />
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ color: "#c0392b", fontSize: 13, padding: 8 }}>
      Fehler beim Laden: {message}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title="Entfernen"
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "none",
        background: "rgba(255, 255, 255, 0.92)",
        color: "#c0392b",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(124, 58, 237, 0.18)",
      }}
    >
      ×
    </button>
  );
}

function ExportButtonInline({
  onExport,
  canExportCsv,
}: {
  onExport: (f: ExportFormat) => void;
  canExportCsv: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { tokens } = useTheme();
  const buttonColor = tokens.text.secondary;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title="Exportieren"
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "none",
          background: "rgba(255, 255, 255, 0.92)",
          color: buttonColor,
          cursor: "pointer",
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(124, 58, 237, 0.18)",
        }}
      >
        ⤓
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: tokens.surface.card,
            border: `1px solid ${tokens.surface.cardBorder}`,
            borderRadius: tokens.radius.md,
            boxShadow: tokens.shadow.md,
            minWidth: 160,
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {(["png", "svg"] as ExportFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onExport(f); }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "transparent", fontSize: 13, cursor: "pointer", color: tokens.text.primary }}
            >
              Als {f.toUpperCase()}
            </button>
          ))}
          {canExportCsv && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onExport("csv"); }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "transparent", fontSize: 13, cursor: "pointer", color: tokens.text.primary }}
            >
              Als CSV (Daten)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
