import Dexie from "dexie";
import type { Table } from "dexie";
import type { Inscription } from "./types";

export class AppDB extends Dexie {
  inscriptions!: Table<Inscription, string>;

  constructor() {
    super("LanguageDigitizedDB");
    this.version(1).stores({
      inscriptions: "id, createdAt, updatedAt",
    });
  }
}

export const db = new AppDB();
