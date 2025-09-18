import natural from "natural";

export type UrgencyLevel = "high" | "medium" | "low";

const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");
const tokenizer = new natural.WordTokenizer();

// Words that strongly indicate urgency
const highUrgencyKeywords = [
  "furious",
  "angry",
  "terrible",
  "disaster",
  "immediately",
  "urgent",
  "critical",
  "asap",
  "horrible",
  "unacceptable",
  "down",
  "failure",
];

// Rate ticket urgency based on sentiment + keywords
export function rateTicketUrgency(text: string): UrgencyLevel {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  let score = analyzer.getSentiment(tokens);

  // Boost score for strong urgency keywords
  for (const word of tokens) {
    if (highUrgencyKeywords.includes(word)) {
      score -= 2; // push it more negative (urgent)
    }
  }

  // Adjust thresholds for urgency
  if (score <= -3) {
    return "high";
  } else if (score < 1) {
    return "medium";
  } else {
    return "low";
  }
}
