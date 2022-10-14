import { enabledConfigName, getConfigItem } from '../../global/configuration';
import { client } from '../../discord';
import { prisma } from '../../prisma';
import { isBefore, addSeconds } from 'date-fns';
import { formatAmount } from '../../commands/currency';

import { shorthandDisplay, Card } from './deck';
import {
  BlackjackState,
  gameTick,
  newGameState,
  NextActionPrompt,
  handValue,
} from './blackjack';
import assert from 'assert';
import { getOrCreateUser } from '../../global/permissions';
import { ChannelType } from 'discord.js';

const moduleSlug = 'casino';

type PlayerState = Array<{
  discordUserId: string;
  wager: number;
}>;

type CasinoState =
  | {
      status: 'lobby';
      game: 'blackjack';
      players: PlayerState;
      entered_lobby_at: Date;
    }
  | {
      status: 'in-game';
      game: 'blackjack';
      players: PlayerState;
      gameState: BlackjackState;
      lastAction: Date;
      nextActionPrompt: NextActionPrompt | null;
      playerChoice: 'hit' | 'stand' | null;
    };

const parseAmount = (amount: string, nonZero: boolean): number | null => {
  try {
    const parsed = parseInt(amount);
    if (parsed < 0 || isNaN(parsed)) return null;
    if (nonZero && parsed == 0) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

const formatMention = (discordUserId: string) => `<@${discordUserId}>`;

const displayPlayerHands = (playerState: PlayerState, playerHands: Card[][]) =>
  playerHands
    .flatMap((hand, idx) => [
      formatMention(playerState[idx].discordUserId),
      ...hand.map(shorthandDisplay),
      `= ${handValue(hand)}`,
    ])
    .join(' ');

const renderHands = (
  gameState: BlackjackState,
  playerState: PlayerState,
  fullReveal: boolean
) => {
  const playerHands = displayPlayerHands(
    playerState,
    gameState.players.map((player) => player.cards)
  );

  if (fullReveal)
    return `Table: Dealer ${gameState.dealer
      .map(shorthandDisplay)
      .join(' ')} = ${handValue(gameState.dealer)} ${playerHands}`;

  return `Table: Dealer ${shorthandDisplay(
    gameState.dealer[0]
  )} __ ${displayPlayerHands(
    playerState,
    gameState.players.map((player) => player.cards)
  )}`;
};

const channelStates = new Map<string, CasinoState>();

// Locking primitive to prevent game from advancing while user is modifying bet
let globalLock = false;

const withGlobalLock = async (inner: () => Promise<void>): Promise<boolean> => {
  if (globalLock) return false;

  globalLock = true;

  try {
    await inner();
  } finally {
    globalLock = false;
  }

  return true;
};

export const setup = () => {
  setInterval(() => {
    withGlobalLock(async () => {
      const channels = [...channelStates.keys()];
      for (const channelId of channels) {
        const state = channelStates.get(channelId);
        if (!state) continue;

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || channel.type !== ChannelType.GuildText) {
          channelStates.delete(channelId);
          continue;
        }

        if (state.status === 'lobby') {
          if (isBefore(addSeconds(state.entered_lobby_at, 15), new Date())) {
            if (state.players.length === 0) {
              channel.send('No players joined, the game has been cancelled.');
              channelStates.delete(channelId);
              continue;
            }

            channel.send('The game has begun!');
            const gameState = newGameState(state.players.length);

            channelStates.set(channelId, {
              status: 'in-game',
              game: 'blackjack',
              gameState,
              players: state.players,
              lastAction: new Date(),
              nextActionPrompt: null,
              playerChoice: null,
            });

            channel.send(renderHands(gameState, state.players, false));
          }
        } else if (state.status === 'in-game') {
          let actionMade = false;
          if (state.nextActionPrompt === null) {
            actionMade = true;
            state.nextActionPrompt = gameTick(state.gameState, {
              type: 'first-input',
            });
          } else if (state.nextActionPrompt.type === 'dealer-draw') {
            actionMade = true;
            state.nextActionPrompt = gameTick(state.gameState, {
              type: 'dealer-draw',
            });

            channel.send(
              `The dealer has drawn.\n${renderHands(
                state.gameState,
                state.players,
                true
              )}`
            );
          } else if (state.nextActionPrompt.type === 'player-choice') {
            if (isBefore(addSeconds(state.lastAction, 15), new Date())) {
              channel.send(
                `${formatMention(
                  state.players[state.nextActionPrompt.player].discordUserId
                )} didn't respond and stood automatically.`
              );
              state.playerChoice = 'stand';
            }

            if (state.playerChoice) {
              actionMade = true;
              state.nextActionPrompt = gameTick(state.gameState, {
                type: 'player-choice',
                choice: state.playerChoice,
              });

              state.playerChoice = null;
            }
          } else {
            assert(state.nextActionPrompt.type === 'ended');

            if (state.nextActionPrompt.reason === 'dealer-natural-blackjack') {
              channel.send('Dealer Natural Blackjack!');
            } else {
              channel.send(
                `${renderHands(
                  state.gameState,
                  state.players,
                  true
                )}\nThe game has ended.`
              );
            }

            const playerResultTexts = [];

            try {
              for (const [
                playerIdx,
                returnMult,
              ] of state.nextActionPrompt.returnMultipliers.entries()) {
                const player = state.players[playerIdx];
                const winnings = Math.floor(returnMult * player.wager);
                const discordUser = await prisma.discordUser.update({
                  where: { discordUserId: player.discordUserId },
                  data: {
                    balance: {
                      increment: winnings,
                    },
                  },
                });

                await prisma.casinoRecord.create({
                  data: {
                    userId: discordUser.id,
                    wager: player.wager,
                    winnings,
                    game: 'blackjack',
                  },
                });

                const goldTotal = discordUser.balance;

                const mentionText = formatMention(player.discordUserId);

                if (returnMult === 0)
                  playerResultTexts.push(
                    `${mentionText} has lost their wager. They now have ${formatAmount(
                      goldTotal
                    )}.`
                  );
                if (returnMult === 1)
                  playerResultTexts.push(
                    `${mentionText} has tied. They now have ${formatAmount(
                      goldTotal
                    )}.`
                  );
                if (returnMult === 2)
                  playerResultTexts.push(
                    `${mentionText} has beat the dealer. They now have ${formatAmount(
                      goldTotal
                    )}.`
                  );
                if (returnMult === 2.5)
                  playerResultTexts.push(
                    `${mentionText} wins with blackjack. They now have ${formatAmount(
                      goldTotal
                    )}.`
                  );
              }

              channel.send(playerResultTexts.join(`\n`));
            } finally {
              channelStates.delete(channelId);
            }

            continue;
          }

          if (actionMade) {
            state.lastAction = new Date();
            if (state.nextActionPrompt.type === 'player-choice') {
              const mentionText = formatMention(
                state.players[state.nextActionPrompt.player].discordUserId
              );
              channel.send(
                `${renderHands(
                  state.gameState,
                  state.players,
                  false
                )}\n${mentionText}, hit or stand?`
              );
            }
          }
        }
      }
    });
  }, 1000);

  client.on('messageCreate', (msg) => {
    if (
      getConfigItem(
        enabledConfigName({ moduleSlug, channelId: msg.channelId }),
        'false'
      ) !== 'true'
    )
      return;

    withGlobalLock(async () => {
      const channelState = channelStates.get(msg.channelId);

      const [command, ...args] = msg.content.toLowerCase().split(' ');

      if (!channelState) {
        if (command === 'start') {
          const [game] = args;
          if (game === 'blackjack') {
            channelStates.set(msg.channelId, {
              status: 'lobby',
              game: 'blackjack',
              entered_lobby_at: new Date(),
              players: [],
            });

            msg.channel.send(
              'Starting blackjack! Type `join [wager]` or `join all` to join with a given wager (can be zero)'
            );
          }
        }
      } else if (channelState.status == 'lobby') {
        if (command === 'join') {
          if (
            channelState.players.find(
              (player) => player.discordUserId === msg.author.id
            )
          ) {
            msg.reply('You have already joined the game!');
            return;
          }

          if (channelState.players.length >= 7) {
            msg.reply('Sorry, the maximum number of players has been reached');
            return;
          }

          // Ensure user exists
          await getOrCreateUser(msg.author.id);

          const player = await prisma.discordUser.findUnique({
            where: { discordUserId: msg.author.id },
          });

          if (!player) {
            msg.reply('Could not find your user.');
            return;
          }

          const [rawAmount] = args;
          const amount =
            rawAmount === 'all'
              ? player.balance
              : parseAmount(rawAmount, false) ?? 0;

          // Check for friendly message, real check is in transaction
          if (player.balance < amount) {
            msg.reply('You do not have enough to place that wager');
            return;
          }

          const placeSuccess = await prisma
            .$transaction(async (prisma) => {
              const player = await prisma.discordUser.update({
                where: { discordUserId: msg.author.id },
                data: {
                  balance: { decrement: amount },
                },
              });

              if (player.balance < 0)
                throw new Error('Cannot bet more than your balance');

              return true;
            })
            .catch(() => false);

          if (placeSuccess) {
            channelState.players.push({
              discordUserId: msg.author.id,
              wager: amount,
            });

            msg.reply(
              `You have joined with a wager of ${formatAmount(amount)}`
            );
          } else {
            msg.reply('Failed to subtract balance, please try again');
          }
        }
      } else if (channelState.status === 'in-game') {
        if (
          channelState.nextActionPrompt?.type === 'player-choice' &&
          channelState.players[channelState.nextActionPrompt.player]
            .discordUserId === msg.author.id
        ) {
          const word = command.split(' ')[0];

          if (['h', 'hit'].includes(word)) {
            channelState.playerChoice = 'hit';
          }

          if (['s', 'stand'].includes(word)) {
            channelState.playerChoice = 'stand';
          }
        }
      }
    });
  });
};
