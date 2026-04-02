export type ChatMood = 'neutral' | 'discovery' | 'flow' | 'stalled';
export type ThemeMode = 'light' | 'dark';

export const ChatMoodColors = {
  light: {
    discovery: {
      background: '#E8F5E9',
      bubbleUser: ['#00C853', '#69F0AE'],
      bubbleOther: '#FFFFFF',
      text: '#000',
      subText: '#666',
      border: '#C8E6C9',
      inputBg: '#FFFFFF',
    },

    flow: {
      background: '#FCE4EC',
      bubbleUser: ['#D85AAF', '#FF8FB1'],
      bubbleOther: '#FFFFFF',
      text: '#000',
      subText: '#666',
      border: '#F8BBD0',
      inputBg: '#FFFFFF',
    },

    stalled: {
      background: '#FFEBEE',
      bubbleUser: ['#FF3B3B', '#8B0000'],
      bubbleOther: '#FFFFFF',
      text: '#000',
      subText: '#666',
      border: '#FFCDD2',
      inputBg: '#FFFFFF',
    },
neutral: {
  background: '#F7F7F8',
  bubbleUser: ['#B0BEC5', '#CFD8DC'], // soft grey
  bubbleOther: '#FFFFFF',
  text: '#000',
  subText: '#666',
  border: '#E0E0E0',
  inputBg: '#FFFFFF',
},
  },

  dark: {
    discovery: {
      background: '#0B1F0F',
      bubbleUser: ['#00C853', '#69F0AE'],
      bubbleOther: '#1E1E1F',
      text: '#FFFFFF',
      subText: '#AAA',
      border: '#2A2A2C',
      inputBg: '#1A1A1C',
    },

    flow: {
      background: '#1A0F1F',
      bubbleUser: ['#D85AAF', '#FF8FB1'],
      bubbleOther: '#1E1E1F',
      text: '#FFFFFF',
      subText: '#AAA',
      border: '#2A2A2C',
      inputBg: '#1A1A1C',
    },

    stalled: {
      background: '#1F0B0B',
      bubbleUser: ['#FF3B3B', '#8B0000'],
      bubbleOther: '#1E1E1F',
      text: '#FFFFFF',
      subText: '#AAA',
      border: '#3A1A1A',
      inputBg: '#1A1A1C',
    },
neutral: {
    background: '#0F0F10',
    bubbleUser: ['#555', '#777'],
    bubbleOther: '#1E1E1F',
    text: '#FFFFFF',
    subText: '#AAA',
    border: '#2A2A2C',
    inputBg: '#1A1A1C',
  },
  },

};