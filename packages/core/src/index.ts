// this is an example of a core package that provides utilities for analyzing conversation vibes.
// It includes a function to detect the conversation mode based on various signals such as reply delay, 
// message length, question count, and sentiment score.

// It should be changed to fit the actual needs of the application,
// and can be expanded with more sophisticated analysis as needed.

export type ConversationMode =
  | "discovery"   // conversation just started
  | "flow"        // conversation is going well naturally
  | "stalled"     // conversation is slowing down or stuck
  | "tension"     // conversation feels awkward, cold, or negative
  | "inactive";   // conversation is basically dead — no messages for a long time (>24h)

export type VibeSignals = {
  replyDelayMs: number;
  messageLength: number;
  questionCount: number;
  sentimentScore: number;
};

export function detectConversationMode(
  signals: VibeSignals
): ConversationMode {
  if (signals.replyDelayMs > 86_400_000) return "inactive"; // >24 h
  if (signals.sentimentScore < -0.4) return "tension";
  if (signals.messageLength < 8 && signals.replyDelayMs > 43_200_000) return "stalled"; // >12 h
  if (signals.sentimentScore > 0.4 && signals.messageLength > 20) return "flow";
  return "discovery";
}