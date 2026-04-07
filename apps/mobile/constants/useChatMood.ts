import { ChatMoodColors, ChatMood, ThemeMode } from './chatMood';
import { useTheme } from '@/context/ThemeContext';

export function useChatMood(mood: ChatMood) {
  const { mode } = useTheme(); // light or dark

  return ChatMoodColors[mode][mood];
}