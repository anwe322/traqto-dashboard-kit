import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  /**
   * Optional remote loader (z.B. Supabase). Wird einmal nach Mount aufgerufen.
   * Liefert das remote Layout zurück; wenn dessen updatedAt neuer ist als das
   * lokale, wird hydratisiert. Null = kein Remote-Stand vorhanden.
   */
  loadLayout?: () => Promise<DashboardLayout | null>;
  /**
   * Optional remote writer. Wird debounced (saveDebounceMs) bei jeder Änderung
   * aufgerufen. localStorage wird unabhängig davon sofort beschrieben (Offline-Cache).
   */
  saveLayout?: (layout: DashboardLayout) => Promise<void>;
  saveDebounceMs?: number;
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

function isNewer(a: DashboardLayout, b: DashboardLayout): boolean {
  if (!a.updatedAt) return false;
  if (!b.updatedAt) return true;
  return a.updatedAt > b.updatedAt;
}

export function DashboardProvider({
  defaultLayout,
  ctx = {},
  onLayoutChange,
  storageKey,
  loadLayout,
  saveLayout,
  saveDebounceMs = 1000,
  children,
}: DashboardProviderProps) {
  const [layout, setLayoutState] = useState<DashboardLayout>(() =>
    loadFromStorage(storageKey, defaultLayout),
  );
  const [editMode, setEditMode] = useState(false);

  // Track whether the most recent state update was triggered by remote-hydration —
  // we don't want to push a just-fetched layout right back to the server.
  const skipNextSave = useRef(false);

  const setLayout = useCallback(
    (next: DashboardLayout) => {
      setLayoutState({ ...next, updatedAt: new Date().toISOString() });
    },
    [],
  );

  // ── Remote-Hydrate beim Mount ─────────────────────────────────
  // localStorage liefert den initialen State sofort (kein Flackern). Sobald
  // loadLayout zurückkommt und remote-updatedAt neuer ist, wird hydratisiert.
  useEffect(() => {
    if (!loadLayout) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadLayout();
        if (cancelled || !remote) return;
        if (remote.version !== defaultLayout.version) return;
        // Aktuellen State nochmal lesen, falls der Nutzer in der Zwischenzeit
        // schon was geändert hat — wir schreiben lokales nicht über remote, wenn
        // local frischer ist.
        setLayoutState((current) => {
          if (isNewer(current, remote)) return current;
          skipNextSave.current = true;
          return remote;
        });
      } catch {
        // Remote nicht erreichbar — wir bleiben auf dem localStorage-Stand
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLayout, defaultLayout.version]);

  // ── Sofort-Cache in localStorage (write-through, synchron) ────
  useEffect(() => {
    onLayoutChange?.(layout);
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(layout));
      } catch {
        // localStorage voll oder disabled — silent fail, in-memory bleibt
      }
    }
  }, [layout, onLayoutChange, storageKey]);

  // ── Debounced Remote-Save ────────────────────────────────────
  // Drag/Resize feuert viele Updates pro Sekunde — wir wollen pro 1s genau einen
  // Roundtrip. Außerdem überspringen wir den allerersten Save nach Hydrate.
  useEffect(() => {
    if (!saveLayout) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const handle = setTimeout(() => {
      saveLayout(layout).catch(() => {
        // Save-Fehler ist nicht fatal — localStorage hat den State, nächstes Save
        // wird's nachholen. Wir könnten hier später Retry/Toast einbauen.
      });
    }, saveDebounceMs);
    return () => clearTimeout(handle);
  }, [layout, saveLayout, saveDebounceMs]);

  const value = useMemo<DashboardContextValue>(() => {
    return {
      layout,
      setLayout,
      editMode,
      setEditMode,
      ctx,
      addWidget: (item) => {
        const id = `${item.widgetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setLayoutState((prev) => ({ ...prev, items: [...prev.items, { ...item, i: id }] }));
      },
      removeWidget: (id) =>
        setLayoutState((prev) => ({ ...prev, items: prev.items.filter((i) => i.i !== id) })),
      updateWidgetConfig: (id, config) =>
        setLayoutState((prev) => ({
          ...prev,
          items: prev.items.map((i) => (i.i === id ? { ...i, config: { ...i.config, ...config } } : i)),
        })),
      updateItems: (items) => setLayoutState((prev) => ({ ...prev, items })),
      setPalette: (p) => setLayoutState((prev) => ({ ...prev, palette: p })),
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
