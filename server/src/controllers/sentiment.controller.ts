import { WordTokenizer, SentimentAnalyzer, PorterStemmer } from "natural";
import { removeStopwords } from "stopword";
import expandContractions from "@stdlib/nlp-expand-contractions";

const tokenizer = new WordTokenizer();
const analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");

export function priorityBasedOnSentiment(
  text: string
): "high" | "medium" | "low" {
  const lexed = expandContractions(text)
    .toLowerCase()
    .replace(/[^a-zA-Z\s]+/g, "");
  const tokenized = tokenizer.tokenize(lexed);
  const stopWordsRemoved = removeStopwords(tokenized);

  const rate = analyzer.getSentiment(stopWordsRemoved);

  if (rate >= 1) return "low";
  if (rate > -1 && rate < 1) return "medium";
  return "high";
}
