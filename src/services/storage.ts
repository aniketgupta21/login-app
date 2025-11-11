import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setJSON<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  await AsyncStorage.setItem(key, json);
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function getString(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function pushToIndex(key: string, item: string): Promise<void> {
  const existing = (await getJSON<string[]>(key)) ?? [];
  if (!existing.includes(item)) {
    existing.unshift(item);
    await setJSON(key, existing.slice(0, 200));
  }
}
