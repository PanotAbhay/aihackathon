// localStorage throws in private mode and when full, so every access is guarded.
export function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJson(key) {
  try {
    return JSON.parse(readStorage(key) || "null");
  } catch {
    return null;
  }
}
