import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DashboardLayout, DataContext, LayoutItem, PaletteName } from "./types";
import { ThemeProvider } from "../theme/ThemeProvider";

type DashboardContextValue = {
  layout: DashboardLayout;
  setLayout: (next: DashboardLayout) => void;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
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

export function DashboardProvider({ defaultLayout, ctx = {}, onLayoutChange, storageKey, children }: DashboardProviderProps) {
  const [layout, setLayoutState] = useState<DashboardLayout>(() =>
    loadFromStorage(storageKey, defaultLayout),
  );
  const [editMode, setEditMode] = useState(false);

  const setLayout = useCallback(
    (next: DashboardLayout) => {
      setLayoutState(next);
    },
    [],
  );

  useEffect(() => {
    onLayoutChange?.(layout);
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(layout));
      } catch {
        // localStorage full or disabled — silent fail, in-memory state still works
      }
    }
  }, [layout, onLayoutChange, storageKey]);

  const value = useMemo<DashboardContextValue>(() => {
    return {
      layout,
      setLayout,
      editMode,
      setEditMode,
      ctx,
      addWidget: (item) => {
        const id = `${item.widgetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setLayout({ ...layout, items: [...layout.items, { ...item, i: id }] });
      },
      removeWidget: (id) =>
        setLayout({ ...layout, items: layout.items.filter((i) => i.i !== id) }),
      updateWidgetConfig: (id, config) =>
        setLayout({
          ...layout,
          items: layout.items.map((i) => (i.i === id ? { ...i, config: { ...i.config, ...config } } : i)),
        }),
      updateItems: (items) => setLayout({ ...layout, items }),
      setPalette: (p) => setLayout({ ...layout, palette: p }),
      resetLayout: () => {
        if (storageKey && typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(storageKey);
          } catch {
            // ignore
          }
        }
        setLayout(defaultLayout);
      },
    };
  }, [layout, editMode, ctx, setLayout, defaultLayout, storageKey]);

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