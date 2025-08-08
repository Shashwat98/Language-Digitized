import { create } from "zustand";
import { db } from "../db/dexie";
import type { Inscription } from "../db/types";

type State = {
  inscriptions: Inscription[];
  loading: boolean;
  list: (limit?: number, offset?: number) => Promise<void>;
  get: (id: string) => Promise<Inscription | undefined>;
  save: (inscription: Inscription) => Promise<void>;
};

export const useInscriptionStore = create<State>((set) => ({
  inscriptions: [],
  loading: false,

  list: async (limit = 50, offset = 0) => {
    set({ loading: true });
    const items = await db.inscriptions
      .orderBy("createdAt")
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
    set({ inscriptions: items, loading: false });
  },

  get: async (id) => {
    return await db.inscriptions.get(id);
  },

  save: async (inscription) => {
    await db.inscriptions.put(inscription);
  },
}));
