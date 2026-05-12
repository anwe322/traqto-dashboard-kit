import { useTheme } from "../theme/ThemeProvider";
import { palettes, defaultPalette } from "../theme/tokens";
import { useDashboard } from "./DashboardProvider";
import type { PaletteName } from "./types";

export type DashboardToolbarProps = {
  onAddWidget?: () => void;
  title?: string;
};

export function DashboardToolbar({ onAddWidget, title }: DashboardToolbarProps) {
  const { editMode, setEditMode, layout, setPalette, resetLayout } = useDashboard();
  const { tokens, gradient } = useTheme();
  const current = layout.palette ?? defaultPalette;
  const accentGradient = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;

  const handleReset = () => {
    if (typeof window !== "undefined" && !window.confirm("Layout, Palette und alle Anpassungen auf die Default-Ansicht zurücksetzen?")) return;
    resetLayout();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${tokens.spacing.md} 0`,
          marginBottom: tokens.spacing.md,
          gap: tokens.spacing.md,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: tokens.text.primary }}>{title ?? "Dashboard"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PalettePicker value={current} onChange={setPalette} />
          {editMode && (
            <button
              type="button"
              onClick={handleReset}
              title="Layout zurücksetzen"
              style={{
                padding: "8px 14px",
                borderRadius: tokens.radius.md,
                border: `1px solid ${tokens.surface.cardBorder}`,
                background: tokens.surface.card,
                color: tokens.text.secondary,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ↺ Zurücksetzen
            </button>
          )}
          {editMode && onAddWidget && (
            <button
              type="button"
              onClick={onAddWidget}
              style={{
                padding: "8px 14px",
                borderRadius: tokens.radius.md,
                border: "none",
                background: accentGradient,
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: tokens.shadow.sm,
              }}
            >
              + Widget hinzufügen
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            style={{
              padding: "8px 14px",
              borderRadius: tokens.radius.md,
              border: editMode ? "none" : `1px solid ${tokens.surface.cardBorder}`,
              background: editMode ? accentGradient : tokens.surface.card,
              color: editMode ? "#fff" : tokens.text.secondary,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: editMode ? tokens.shadow.sm : "none",
            }}
          >
            {editMode ? "✓ Fertig" : "🖉 Layout bearbeiten"}
          </button>
        </div>
      </div>
      {editMode && (
        <div
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}1a, ${gradient[1]}1a)`,
            border: `1px solid ${gradient[0]}44`,
            color: tokens.text.primary,
            padding: "10px 16px",
            borderRadius: tokens.radius.md,
            marginBottom: tokens.spacing.md,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>✋</span>
          <span>
            <strong>Layout-Modus aktiv:</strong> Widgets per Drag-and-Drop verschieben, an den Ecken die Größe ändern,
            <strong> ⋮⋮ </strong>
            oben links als Anfasser. Über <strong>×</strong> entfernen, <strong>⚙</strong> öffnet Einstellungen.
          </span>
        </div>
      )}
    </>
  );
}

function PalettePicker({ value, onChange }: { value: PaletteName; onChange: (p: PaletteName) => void }) {
  const { tokens } = useTheme();
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginRight: 4 }}>
      {(Object.keys(palettes) as PaletteName[]).map((p) => {
        const pal = palettes[p];
        const active = p === value;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            title={pal.label}
            aria-label={`Palette ${pal.label}`}
            aria-pressed={active}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: `linear-gradient(135deg, ${pal.gradient[0]}, ${pal.gradient[1]})`,
              boxShadow: active
                ? `0 0 0 2px ${tokens.surface.card}, 0 0 0 4px ${pal.gradient[0]}, 0 4px 10px ${pal.gradient[0]}33`
                : "0 1px 3px rgba(15, 30, 46, 0.12)",
              transform: active ? "scale(1.05)" : "scale(1)",
              transition: "transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 180ms ease",
            }}
            onMouseEnter={(e) => {
              if (active) return;
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "scale(1.12)";
              el.style.boxShadow = `0 2px 8px ${pal.gradient[0]}40`;
            }}
            onMouseLeave={(e) => {
              if (active) return;
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "scale(1)";
              el.style.boxShadow = "0 1px 3px rgba(15, 30, 46, 0.12)";
            }}
          />
        );
      })}
    </div>
  );
}