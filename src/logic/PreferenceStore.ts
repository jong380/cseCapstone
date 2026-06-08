import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = 'nodi_user_preferences';

export async function savePreferences(summary: string): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, summary);
}

export async function getPreferences(): Promise<string | null> {
  return await AsyncStorage.getItem(PREFERENCES_KEY);
}

export async function clearPreferences(): Promise<void> {
  await AsyncStorage.removeItem(PREFERENCES_KEY);
}