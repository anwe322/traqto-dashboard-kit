import { useMemo } from "react";
import { useDashboard } from "../core/DashboardProvider";
import { useTheme } from "../theme/ThemeProvider";
import { getWidget } from "../core/WidgetRegistry";
import { palettes, defaultPalette } from "../theme/tokens";
import type { ConfigField, PaletteName } from "../core/types";

export type WidgetConfigPanelProps = {
  itemId: string | null;
  onClose: () => void;
};

export function WidgetConfigPanel({ itemId, onClose }: WidgetConfigPanelProps) {
  const { tokens } = useTheme();
  const { layout, updateWidgetConfig } = useDashboard();

  const item = useMemo(() => layout.items.find((i) => i.i === itemId) ?? null, [layout.items, itemId]);
  const def = item ? getWidget(item.widgetId) : null;

  if (!itemId || !item || !def) return null;

  const cfg = { ...def.defaultConfig, ...item.config } as Record<string, unknown>;
  const fields: ConfigField[] = def.configSchema ?? inferSchema(cfg);

  const handleChange = (key: string, value: unknown) => {
    updateWidgetConfig(item.i, { [key]: value });
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
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: tokens.surface.card,
          width: "min(420px, 100%)",
          height: "100vh",
          boxShadow: tokens.shadow.lg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${tokens.surface.cardBorder}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: tokens.text.primary }}>{def.title}</div>
            <div style={{ fontSize: 12, color: tokens.text.muted, marginTop: 2 }}>Einstellungen</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: tokens.text.secondary, fontSize: 20, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {fields.length === 0 ? (
            <div style={{ fontSize: 13, color: tokens.text.muted }}>
              Dieses Widget bietet keine Einstellungen.
            </div>
          ) : (
            fields.map((field) => (
              <FieldRow
                key={field.key}
                field={field}
                value={cfg[field.key]}
                onChange={(v) => handleChange(field.key, v)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { tokens } = useTheme();

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: tokens.text.secondary, marginBottom: 6 }}>
        {field.label}
      </label>
      <FieldInput field={field} value={value} onChange={onChange} />
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { tokens } = useTheme();
  const baseInput = {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${tokens.surface.cardBorder}`,
    borderRadius: tokens.radius.md,
    fontSize: 13,
    outline: "none",
    background: tokens.surface.card,
    color: tokens.text.primary,
  } as const;

  if (field.type === "boolean") {
    return (
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: tokens.text.primary }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {Boolean(value) ? "An" : "Aus"}
      </label>
    );
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        value={(value as number) ?? ""}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        style={baseInput}
      />
    );
  }
  if (field.type === "range") {
    const v = typeof value === "number" ? value : field.default ?? field.min;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 13, color: tokens.text.secondary, minWidth: 36, textAlign: "right" }}>{v}</span>
      </div>
    );
  }
  if (field.type === "select") {
    const current = (value as string) ?? "";
    const known = field.options.some((opt) => opt.value === current);
    return (
      <select value={current} onChange={(e) => onChange(e.target.value)} style={baseInput}>
        {!known && (
          <option value="" disabled>
            Bitte wählen…
          </option>
        )}
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === "palette") {
    const current = (value as PaletteName) ?? field.default ?? defaultPalette;
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {(Object.keys(palettes) as PaletteName[]).map((p) => {
          const pal = palettes[p];
          const active = p === current;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              title={pal.label}
              style={{
                flex: 1,
                height: 36,
                borderRadius: tokens.radius.md,
                border: active ? `2px solid ${tokens.accent.primary}` : "2px solid transparent",
                background: `linear-gradient(135deg, ${pal.gradient[0]}, ${pal.gradient[1]})`,
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
    );
  }
  return (
    <input
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={baseInput}
    />
  );
}

function inferSchema(cfg: Record<string, unknown>): ConfigField[] {
  return Object.entries(cfg).map(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/[A-Z]/g, (m) => ` ${m.toLowerCase()}`);
    if (typeof value === "boolean") return { key, label, type: "boolean", default: value };
    if (typeof value === "number") return { key, label, type: "number", default: value };
    return { key, label, type: "string", default: typeof value === "string" ? value : "" };
  });
}
