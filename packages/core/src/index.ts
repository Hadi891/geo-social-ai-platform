export type ConversationMode =
  | "discovery"   // conversation just started
  | "flow"        // conversation is going well naturally
  | "stalled"     // conversation is slowing down or stuck

export type VibeSignals = {
  replyDelayMs: number;
  messageLength: number;
  questionCount: number;
  sentimentScore: number;
};

export function detectConversationMode(
  signals: VibeSignals
): ConversationMode {
  if (signals.messageLength < 8 && signals.replyDelayMs > 43_200_000) return "stalled"; // >12 h
  if (signals.sentimentScore > 0.4 && signals.messageLength > 20) return "flow";
  return "discovery";
}