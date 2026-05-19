import type { GameSnapshot } from "@/lib/gameTypes";

const DB_NAME = "echoes-of-the-hollow-crown";
const DB_VERSION = 1;
const STORE_NAME = "saves";
const SAVE_ID = "autosave";
const LOCAL_STORAGE_KEY = "echoes-of-the-hollow-crown/save";

type StoredGame = GameSnapshot & {
  savedAt: string;
};

const isBrowser = () => typeof window !== "undefined";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function saveToIndexedDB(save: StoredGame) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ id: SAVE_ID, ...save });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function loadFromIndexedDB(): Promise<StoredGame | null> {
  const database = await openDatabase();

  const result = await new Promise<StoredGame | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(SAVE_ID);
    request.onsuccess = () => {
      const value = request.result as (StoredGame & { id: string }) | undefined;
      if (!value) {
        resolve(null);
        return;
      }

      resolve({
        player: value.player,
        locations: value.locations,
        currentLocationId: value.currentLocationId,
        world: value.world,
        narrativeHistory: value.narrativeHistory,
        suggestedActions: value.suggestedActions,
        savedAt: value.savedAt,
      });
    };
    request.onerror = () => reject(request.error);
  });

  database.close();
  return result;
}

async function clearIndexedDB() {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(SAVE_ID);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function saveGameSnapshot(
  snapshot: GameSnapshot,
): Promise<boolean> {
  if (!isBrowser()) {
    return false;
  }

  const save: StoredGame = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(save));

  if ("indexedDB" in window) {
    try {
      await saveToIndexedDB(save);
    } catch {
      return true;
    }
  }

  return true;
}

export async function loadGameSnapshot(): Promise<GameSnapshot | null> {
  if (!isBrowser()) {
    return null;
  }

  if ("indexedDB" in window) {
    try {
      const indexedSave = await loadFromIndexedDB();
      if (indexedSave) {
        return indexedSave;
      }
    } catch {
      // Fall through to localStorage.
    }
  }

  const localSave = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!localSave) {
    return null;
  }

  const parsed = JSON.parse(localSave) as StoredGame;
  return parsed;
}

export async function clearGameSnapshot(): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(LOCAL_STORAGE_KEY);

  if ("indexedDB" in window) {
    try {
      await clearIndexedDB();
    } catch {
      // localStorage has already been cleared.
    }
  }
}
