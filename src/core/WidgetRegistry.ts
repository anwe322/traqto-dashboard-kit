import type { WidgetDef } from "./types";

const registry = new Map<string, WidgetDef<any, any>>();

export function registerWidget<TConfig, TData>(def: WidgetDef<TConfig, TData>): void {
  if (registry.has(def.id)) {
    console.warn(`[traqto/dashboard-kit] Widget "${def.id}" is being re-registered.`);
  }
  registry.set(def.id, def as WidgetDef<any, any>);
}

export function unregisterWidget(id: string): void {
  registry.delete(id);
}

export function getWidget(id: string): WidgetDef<any, any> | undefined {
  return registry.get(id);
}

export function listWidgets(): WidgetDef<any, any>[] {
  return Array.from(registry.values());
}

export function listWidgetsByCategory(): Record<string, WidgetDef<any, any>[]> {
  const out: Record<string, WidgetDef<any, any>[]> = {};
  for (const def of registry.values()) {
    (out[def.category] ||= []).push(def);
  }
  return out;
}

export function clearRegistry(): void {
  registry.clear();
}