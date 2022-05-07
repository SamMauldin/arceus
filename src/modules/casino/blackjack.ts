import assert from 'assert';
import { Card, shuffledMultiDeck } from './deck';

export type BlackjackState = {
  deck: Card[];
  dealer: Card[];
  players: Array<{ cards: Card[] }>;
  currentlyPlaying: number;
};

export const newGameState = (players: number): BlackjackState => {
  assert(players > 0);
  assert(players <= 7);
  const deck = shuffledMultiDeck(4);

  return {
    deck,
    dealer: [deck.pop()!, deck.pop()!],
    players: new Array(players).fill(undefined).map((_) => {
      const cards = [deck.pop()!, deck.pop()!];

      return {
        cards,
      };
    }),
    currentlyPlaying: 0,
  };
};

const baseValueMap: { [key in Card['rank']]: number } = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 10,
  Q: 10,
  K: 10,
};

const baseValue = (card: Card) => baseValueMap[card.rank];

export const handValue = (cards: Card[]) => {
  let baseTotal = cards.reduce((acc, card) => acc + baseValue(card), 0);
  const aceCount = cards.filter((card) => card.rank === 'A').length;

  for (let i = 0; i < aceCount; i++) {
    if (baseTotal + 10 > 21) return baseTotal;

    baseTotal += 10;
  }

  return baseTotal;
};

export type Input =
  | { type: 'first-input' }
  | {
      type: 'dealer-draw';
    }
  | {
      type: 'player-choice';
      choice: 'stand' | 'hit';
    };

export type NextActionPrompt =
  | {
      type: 'player-choice';
      player: number;
    }
  | {
      type: 'ended';
      reason: 'normal' | 'dealer-natural-blackjack';
      returnMultipliers: number[];
    }
  | { type: 'dealer-draw' };

export const gameTick = (
  state: BlackjackState,
  input: Input
): NextActionPrompt => {
  if (input.type === 'first-input') {
    // Check for dealer natural blackjack
    if (handValue(state.dealer) === 21) {
      return {
        type: 'ended',
        reason: 'dealer-natural-blackjack',
        returnMultipliers: state.players.map((player) =>
          handValue(player.cards) === 21 ? 1 : 0
        ),
      };
    }
  } else if (input.type === 'player-choice') {
    assert(state.currentlyPlaying !== null);

    if (input.choice === 'stand') {
      state.currentlyPlaying++;
    } else if (input.choice === 'hit') {
      state.players[state.currentlyPlaying].cards.push(state.deck.pop()!);
    }
  } else if (input.type === 'dealer-draw') {
    state.dealer.push(state.deck.pop()!);
  }

  while (state.currentlyPlaying < state.players.length) {
    if (handValue(state.players[state.currentlyPlaying].cards) < 21) {
      return { type: 'player-choice', player: state.currentlyPlaying };
    } else {
      state.currentlyPlaying++;
    }
  }

  if (handValue(state.dealer) < 17) {
    return { type: 'dealer-draw' };
  }

  const dealerValue = handValue(state.dealer);

  return {
    type: 'ended',
    reason: 'normal',
    returnMultipliers: state.players.map((player) => {
      const playerValue = handValue(player.cards);

      // Player Bust
      if (playerValue > 21) return 0;

      // Player Natural Blackjack
      if (player.cards.length === 2 && playerValue === 21) return 2.5;

      // Dealer Bust
      if (dealerValue > 21) return 2;

      // Player Win
      if (playerValue > dealerValue) return 2;

      // Player Tie
      if (playerValue === dealerValue) return 1;

      // Player Loss
      return 0;
    }),
  };
};
