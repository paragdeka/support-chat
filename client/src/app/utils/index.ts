import { adjectives, names, uniqueNamesGenerator } from 'unique-names-generator';

export function createName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, names],
    separator: ' ',
    length: 2,
  });
}
