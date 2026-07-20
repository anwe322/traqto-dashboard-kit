import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DashboardLayout, DataContext, LayoutItem, PaletteName } from "./types";
import { ThemeProvider } from "../theme/ThemeProvider";

type DashboardContextValue = {
  layout: DashboardLayout;
  setLayout: (next: DashboardLayout) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  readOnly: boolean;
  ctx: DataContext;
  addWidget: (item: Omit<LayoutItem, "i">) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Record<string, unknown>) => void;
  updateItems: (items: LayoutItem[]) => void;
  setPalette: (p: PaletteName) => void;
  resetLayout: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export type DashboardProviderProps = {
  defaultLayout: DashboardLayout;
  ctx?: DataContext;
  onLayoutChange?: (layout: DashboardLayout) => void;
  storageKey?: string;
  /**
   * Schreibgeschützte Ansicht (z. B. über einen Freigabe-Link geöffnet):
   * Edit-Modus und alle Layout-Mutationen sind deaktiviert, localStorage
   * wird weder gelesen noch beschrieben. Sollte über die Lebensdauer des
   * Providers konstant bleiben.
   */
  readOnly?: boolean;
  children: ReactNode;
};

function loadFromStorage(storageKey: string | undefined, fallback: DashboardLayout): DashboardLayout {
  if (!storageKey || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as DashboardLayout;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) return fallback;
    if (parsed.version !== fallback.version) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function DashboardProvider({ defaultLayout, ctx = {}, onLayoutChange, storageKey, readOnly = false, children }: DashboardProviderProps) {
  const [layout, setLayoutState] = useState<DashboardLayout>(() =>
    readOnly ? defaultLayout : loadFromStorage(storageKey, defaultLayout),
  );
  const [editMode, setEditModeState] = useState(false);

  const setLayout = useCallback(
    (next: DashboardLayout) => {
      setLayoutState(next);
    },
    [],
  );

  useEffect(() => {
    onLayoutChange?.(layout);
    if (!readOnly && storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(layout));
      } catch {
        // localStorage full or disabled — silent fail, in-memory state still works
      }
    }
  }, [layout, onLayoutChange, storageKey, readOnly]);

  const value = useMemo<DashboardContextValue>(() => {
    const guard = <A extends unknown[]>(fn: (...args: A) => void) =>
      readOnly ? () => undefined : fn;
    return {
      layout,
      setLayout: guard(setLayout),
      editMode: readOnly ? false : editMode,
      setEditMode: guard((v: boolean) => setEditModeState(v)),
      readOnly,
      ctx,
      addWidget: guard((item: Omit<LayoutItem, "i">) => {
        const id = `${item.widgetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setLayoutState((prev) => ({ ...prev, items: [...prev.items, { ...item, i: id }] }));
      }),
      removeWidget: guard((id: string) =>
        setLayoutState((prev) => ({ ...prev, items: prev.items.filter((i) => i.i !== id) })),
      ),
      updateWidgetConfig: guard((id: string, config: Record<string, unknown>) =>
        setLayoutState((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.i === id ? { ...i, config: { ...i.config, ...config } } : i)),
        })),
      ),
      updateItems: guard((items: LayoutItem[]) => setLayoutState((prev) => ({ ...prev, items }))),
      setPalette: guard((p: PaletteName) => setLayoutState((prev) => ({ ...prev, palette: p }))),
      resetLayout: guard(() => {
        if (storageKey && typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(storageKey);
          } catch {
            // ignore
          }
        }
        setLayout(defaultLayout);
      }),
    };
  }, [layout, editMode, readOnly, ctx, setLayout, defaultLayout, storageKey]);

  return (
    <DashboardContext.Provider value={value}>
      <ThemeProvider palette={layout.palette}>{children}</ThemeProvider>
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}