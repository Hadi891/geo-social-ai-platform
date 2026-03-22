/**
 * Lightweight keyword-based retrieval over the app knowledge base.
 *
 * Scores each section by counting how many of its keywords appear in the
 * normalised user query, with a bonus for title word matches.
 * Returns the top-N sections sorted by score descending.
 */

import { KNOWLEDGE_BASE, KnowledgeSection } from "./knowledge";

export type ScoredSection = KnowledgeSection & { score: number };

export function retrieveSections(query: string, topN = 4): KnowledgeSection[] {
  const q = query.toLowerCase();

  const scored: ScoredSection[] = KNOWLEDGE_BASE.map(section => {
    let score = 0;

    // Keyword hits
    for (const kw of section.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += 1;
      }
    }

    // Title word bonus (2 pts each — title words are strong signals)
    for (const word of section.title.toLowerCase().split(/\s+/)) {
      if (word.length > 3 && q.includes(word)) {
        score += 2;
      }
    }

    return { ...section, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Formats retrieved sections into a compact block suitable for inclusion
 * in an OpenAI prompt.
 */
export function formatSections(sections: KnowledgeSection[]): string {
  if (sections.length === 0) return "(no specific feature knowledge retrieved)";
  return sections
    .map(s => `### ${s.title}\n${s.content}`)
    .join("\n\n");
}
