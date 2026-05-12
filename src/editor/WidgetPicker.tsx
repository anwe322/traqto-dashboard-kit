import { useMemo, useState } from "react";
import { listWidgets } from "../core/WidgetRegistry";
import { useDashboard } from "../core/DashboardProvider";
import { useTheme } from "../theme/ThemeProvider";
import type { WidgetCategory, WidgetDef } from "../core/types";

export type WidgetPickerProps = {
  open: boolean;
  onClose: () => void;
};

const CATEGORY_LABEL: Record<WidgetCategory, string> = {
  kpi: "Kennzahlen",
  chart: "Diagramme",
  list: "Listen",
  map: "Karten",
  custom: "Sonstige",
};

const CATEGORY_ICON: Record<WidgetCategory, string> = {
  kpi: "▣",
  chart: "📊",
  list: "≡",
  map: "🗺",
  custom: "✦",
};

export function WidgetPicker({ open, onClose }: WidgetPickerProps) {
  const { tokens } = useTheme();
  const { layout, addWidget } = useDashboard();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WidgetCategory | "all">("all");

  const usedIds = useMemo(() => new Set(layout.items.map((i) => i.widgetId)), [layout.items]);
  const all = useMemo(() => listWidgets(), []);
  const grouped = useMemo(() => {
    const filtered = all.filter((w) => {
      if (category !== "all" && w.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!w.title.toLowerCase().includes(q) && !w.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const map: Record<string, WidgetDef[]> = {};
    for (const w of filtered) {
      (map[w.category] ||= []).push(w);
    }
    return map;
  }, [all, category, query]);

  if (!open) return null;

  const nextFreeY =
    layout.items.length === 0
      ? 0
      : Math.max(...layout.items.map((i) => i.y + i.h));

  const handleAdd = (def: WidgetDef) => {
    addWidget({
      widgetId: def.id,
      x: 0,
      y: nextFreeY,
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      config: { ...def.defaultConfig },
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(31, 18, 53, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tokens.surface.card,
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.shadow.lg,
          width: "min(900px, 100%)",
          maxHeight: "min(80vh, 700px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tokens.surface.cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: tokens.text.primary }}>Widget hinzufügen</div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent",
                color: tokens.text.secondary, fontSize: 20, cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Widget suchen …"
            style={{
              width: "100%", padding: "10px 14px", border: `1px solid ${tokens.surface.cardBorder}`,
              borderRadius: tokens.radius.md, fontSize: 14, outline: "none", marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <CategoryChip label="Alle" active={category === "all"} onClick={() => setCategory("all")} />
            {(["kpi", "chart", "list", "map", "custom"] as WidgetCategory[]).map((c) => (
              <CategoryChip
                key={c}
                label={CATEGORY_LABEL[c]}
                active={category === c}
                onClick={() => setCategory(c)}
              />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: tokens.text.muted, fontSize: 14 }}>
              Keine Widgets gefunden.
            </div>
          ) : (
            Object.entries(grouped).map(([cat, defs]) => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.text.secondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
                  {CATEGORY_LABEL[cat as WidgetCategory]}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                  {defs.map((def) => (
                    <WidgetCard key={def.id} def={def} used={usedIds.has(def.id)} onAdd={() => handleAdd(def)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const { tokens } = useTheme();
  const accent = tokens.accent.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? accent : tokens.surface.cardBorder}`,
        background: active ? `${accent}1f` : "transparent",
        color: active ? accent : tokens.text.secondary,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function WidgetCard({ def, used, onAdd }: { def: WidgetDef; used: boolean; onAdd: () => void }) {
  const { tokens } = useTheme();
  const accent = tokens.accent.primary;
  return (
    <button
      type="button"
      onClick={onAdd}
      style={{
        textAlign: "left",
        padding: 14,
        border: `1px solid ${tokens.surface.cardBorder}`,
        borderRadius: tokens.radius.md,
        background: tokens.surface.card,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "border-color 150ms ease, background 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = accent;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = tokens.surface.cardBorder;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{CATEGORY_ICON[def.category]}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: tokens.text.primary, flex: 1 }}>{def.title}</span>
        {used && (
          <span style={{ fontSize: 10, color: tokens.text.muted, background: tokens.surface.cardHover, padding: "2px 6px", borderRadius: 4 }}>
            bereits drin
          </span>
        )}
      </div>
      {def.description && (
        <div style={{ fontSize: 12, color: tokens.text.muted, lineHeight: 1.4 }}>{def.description}</div>
      )}
    </button>
  );
}