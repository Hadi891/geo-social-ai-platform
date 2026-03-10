// this is an example of a core package that provides utilities for analyzing conversation vibes.
// It includes a function to detect the conversation mode based on various signals such as reply delay, 
// message length, question count, and sentiment score.

// It should be changed to fit the actual needs of the application,
// and can be expanded with more sophisticated analysis as needed.

export type ConversationMode =
  | "discovery"
  | "flow"
  | "stalled"
  | "tension";

export type VibeSignals = {
  replyDelayMs: number;
  messageLength: number;
  questionCount: number;
  sentimentScore: number;
};

export function detectConversationMode(
  signals: VibeSignals
): ConversationMode {
  if (signals.sentimentScore < -0.4) return "tension";
  if (signals.messageLength < 8 && signals.replyDelayMs > 60000) return "stalled";
  if (signals.sentimentScore > 0.4 && signals.messageLength > 20) return "flow";
  return "discovery";
}