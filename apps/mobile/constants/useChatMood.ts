import { ChatMoodColors, ChatMood } from './chatMood';
import { useTheme } from '@/context/ThemeContext';

export function useChatMood(mood: ChatMood) {
  const { mode } = useTheme();
  const resolvedMode = mode === 'dark' ? 'dark' : 'light';
  return ChatMoodColors[resolvedMode][mood];
}
