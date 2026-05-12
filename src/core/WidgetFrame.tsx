import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "../theme/ThemeProvider";

export type WidgetFrameProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  editMode?: boolean;
  onRemove?: () => void;
  onConfigure?: () => void;
  onExport?: (format: "csv" | "svg" | "png") => void;
  canExportCsv?: boolean;
  children: ReactNode;
  padding?: boolean;
  bodyRef?: React.RefObject<HTMLDivElement>;
};

export function WidgetFrame({
  title,
  subtitle,
  actions,
  editMode = false,
  onRemove,
  onConfigure,
  onExport,
  canExportCsv = true,
  children,
  padding = true,
  bodyRef,
}: WidgetFrameProps) {
  const { tokens } = useTheme();
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: tokens.surface.card,
        borderRadius: tokens.radius.xl,
        border: "none",
        boxShadow: tokens.shadow.sm,
        overflow: "hidden",
        position: "relative",
        transition: "box-shadow 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = tokens.shadow.md;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = tokens.shadow.sm;
      }}
    >
      {(title || actions || editMode || onExport) && (
        <div
          className="tdk-widget-handle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
            cursor: editMode ? "move" : "default",
            userSelect: "none",
          }}
        >
          <div>
            {title && (
              <div style={{ fontSize: 14, fontWeight: 600, color: tokens.text.primary }}>{title}</div>
            )}
            {subtitle && (
              <div style={{ fontSize: 12, color: tokens.text.muted, marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {actions}
            {onExport && <ExportMenu onExport={onExport} canExportCsv={canExportCsv} />}
            {editMode && onConfigure && (
              <IconButton onClick={onConfigure} title="Konfigurieren">⚙</IconButton>
            )}
            {editMode && onRemove && (
              <IconButton onClick={onRemove} title="Entfernen" danger>×</IconButton>
            )}
          </div>
        </div>
      )}
      <div ref={bodyRef} style={{ flex: 1, minHeight: 0, padding: padding ? tokens.spacing.lg : 0 }}>
        {children}
      </div>
    </div>
  );
}

function ExportMenu({
  onExport,
  canExportCsv,
}: {
  onExport: (format: "csv" | "svg" | "png") => void;
  canExportCsv: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { tokens } = useTheme();

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
      <IconButton onClick={() => setOpen(!open)} title="Exportieren">⤓</IconButton>
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
          <MenuItem onClick={() => { setOpen(false); onExport("png"); }}>Als PNG (Bild)</MenuItem>
          <MenuItem onClick={() => { setOpen(false); onExport("svg"); }}>Als SVG (Vektor)</MenuItem>
          {canExportCsv && (
            <MenuItem onClick={() => { setOpen(false); onExport("csv"); }}>Als CSV (Daten)</MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  const { tokens } = useTheme();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        border: "none",
        background: "transparent",
        color: tokens.text.primary,
        fontSize: 13,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = tokens.surface.cardHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function IconButton({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: danger ? "#c0392b" : "#5b6b7c",
        cursor: "pointer",
        fontSize: 16,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = danger ? "#c0392b22" : "#0f1e2e0d";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}