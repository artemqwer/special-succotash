import { create } from "zustand";

interface CrossFilterState {
  filters: Record<string, string[]>;
  setFilter: (key: string, values: string[]) => void;
  toggleValue: (key: string, value: string) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
}

export const useCrossFilter = create<CrossFilterState>((set, get) => ({
  filters: {},

  setFilter: (key, values) =>
    set((s) => ({ filters: { ...s.filters, [key]: values } })),

  toggleValue: (key, value) => {
    const current = get().filters[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (next.length === 0) {
      set((s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _removed, ...rest } = s.filters;
        return { filters: rest };
      });
    } else {
      set((s) => ({ filters: { ...s.filters, [key]: next } }));
    }
  },

  clearFilter: (key) =>
    set((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _removed, ...rest } = s.filters;
      return { filters: rest };
    }),

  clearAll: () => set({ filters: {} }),
}));
