export type ChatMood = 'neutral' | 'discovery' | 'flow' | 'stalled';
export type ThemeMode = 'light' | 'dark';

export type MoodBanner = {
  icon: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
};

export type MoodMeta = {
  statusLabel: string;
  avatarRingColor: string | null;
  chips: string[];
  /** shown inside FlatList header — only for discovery */
  topBanner: MoodBanner | null;
  /** always-visible banner above chips — only for stalled */
  bottomBanner: MoodBanner | null;
  inputPlaceholder: string;
};

export const ChatMoodMeta: Record<ChatMood, MoodMeta> = {
  neutral: {
    statusLabel: 'ONLINE',
    avatarRingColor: null,
    chips: ["How's your day?", 'Tell me more!'],
    topBanner: null,
    bottomBanner: null,
    inputPlaceholder: 'Type a message...',
  },
  discovery: {
    statusLabel: '✨ NEW MATCH',
    avatarRingColor: '#FF6B35',
    chips: ["What's your favorite spot in the city?", "Tell me something surprising about you 😄"],
    topBanner: {
      icon: '💫',
      title: 'You just matched!',
      subtitle: 'Start with something genuine — reference their interests.',
    },
    bottomBanner: null,
    inputPlaceholder: 'Say something genuine...',
  },
  flow: {
    statusLabel: 'ONLINE',
    avatarRingColor: null,
    chips: ["I'd love to join!", 'Sunday afternoon works!'],
    topBanner: null,
    bottomBanner: null,
    inputPlaceholder: 'Type a message...',
  },
  stalled: {
    statusLabel: 'QUIET',
    avatarRingColor: '#94A3B8',
    chips: ['Still thinking about you 😊', 'Want to pick up where we left off?'],
    topBanner: null,
    bottomBanner: {
      icon: '💤',
      title: 'This chat has gone quiet',
      subtitle: 'A small nudge can go a long way.',
      ctaLabel: 'Get AI suggestions',
    },
    inputPlaceholder: 'Break the silence...',
  },
};

export const ChatMoodColors = {
  light: {
    neutral: {
      background: '#F7F7F8',
      bubbleUser: '#8A8A8A',
      bubbleOther: '#FFFFFF',
      text: '#111',
      subText: '#888',
      border: '#E0E0E0',
      inputBg: '#FFFFFF',
      accent: '#8A8A8A',
    },
    // Warm coral / peach — fresh, hopeful, exciting
    discovery: {
      background: '#FFF8F2',
      bubbleUser: '#FF6B35',
      bubbleOther: '#FFE8D5',
      text: '#2D1505',
      subText: '#A0826D',
      border: '#FFD4AF',
      inputBg: '#FFF0E8',
      accent: '#FF6B35',
    },
    // Deep violet / lavender — intimate, flowing, connected
    flow: {
      background: '#F6F3FF',
      bubbleUser: '#7C3AED',
      bubbleOther: '#EDE9FE',
      text: '#1E1340',
      subText: '#8B7BA8',
      border: '#C4B5FD',
      inputBg: '#EDE9FE',
      accent: '#7C3AED',
    },
    // Cool slate / blue-gray — muted, desaturated, quiet
    stalled: {
      background: '#F1F5F9',
      bubbleUser: '#64748B',
      bubbleOther: '#E2E8F0',
      text: '#1E293B',
      subText: '#94A3B8',
      border: '#CBD5E1',
      inputBg: '#E2E8F0',
      accent: '#64748B',
    },
  },

  dark: {
    neutral: {
      background: '#0F0F10',
      bubbleUser: '#555',
      bubbleOther: '#1E1E1F',
      text: '#FFF',
      subText: '#AAA',
      border: '#2A2A2C',
      inputBg: '#1A1A1C',
      accent: '#888',
    },
    discovery: {
      background: '#1A0D06',
      bubbleUser: '#FF6B35',
      bubbleOther: '#2D1A0A',
      text: '#FFF0E8',
      subText: '#C4956A',
      border: '#4A2510',
      inputBg: '#2D1A0A',
      accent: '#FF6B35',
    },
    flow: {
      background: '#0F0820',
      bubbleUser: '#7C3AED',
      bubbleOther: '#1A1035',
      text: '#EDE9FE',
      subText: '#8B7BA8',
      border: '#3D2A6B',
      inputBg: '#1A1035',
      accent: '#7C3AED',
    },
    stalled: {
      background: '#0F172A',
      bubbleUser: '#475569',
      bubbleOther: '#1E293B',
      text: '#E2E8F0',
      subText: '#64748B',
      border: '#334155',
      inputBg: '#1E293B',
      accent: '#64748B',
    },
  },
};
