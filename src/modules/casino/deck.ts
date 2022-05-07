const suits = ['C', 'D', 'H', 'S'] as const;
const ranks = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;

export type Card = {
  suit: typeof suits[number];
  rank: typeof ranks[number];
};

const unshuffledDeck = () =>
  suits.flatMap((suit) => ranks.flatMap((rank) => ({ suit, rank })));

const shuffleInplace = (cards: Card[]) => {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
};

export const shuffledMultiDeck = (decks: number) => {
  const cards = new Array(decks).fill(undefined).flatMap((_) => unshuffledDeck());

  shuffleInplace(cards);

  return cards;
};

export const shorthandDisplay = (card: Card) => `${card.rank}${card.suit}`;
