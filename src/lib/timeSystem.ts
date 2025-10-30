/**
 * Time System Utilities
 * Calculates and formats game time based on scenario configuration
 */

import type { TimeConfig, TimeUnit } from '../types/scenario';

export interface GameTime {
  year: number;
  month: number;
  week: number;
  day: number;
  totalTurns: number;
}

/**
 * Calculate the current game time based on turn number
 */
export function calculateGameTime(
  turn: number,
  config: TimeConfig
): GameTime {
  const totalUnits = turn * config.unitsPerTurn;

  let year = config.startYear;
  let month = config.startMonth || 1;
  let week = 1;
  let day = 1;

  switch (config.unit) {
    case 'year':
      year += totalUnits;
      break;

    case 'month':
      const totalMonths = (month - 1) + totalUnits;
      year += Math.floor(totalMonths / 12);
      month = (totalMonths % 12) + 1;
      break;

    case 'week':
      const totalWeeks = totalUnits;
      const totalDays = totalWeeks * 7;
      year += Math.floor(totalDays / 365);
      const remainingDays = totalDays % 365;
      month = Math.floor(remainingDays / 30) + 1;
      week = Math.floor((remainingDays % 30) / 7) + 1;
      day = (remainingDays % 7) + 1;
      break;

    case 'day':
      const days = totalUnits;
      year += Math.floor(days / 365);
      const remDays = days % 365;
      month = Math.floor(remDays / 30) + 1;
      day = (remDays % 30) + 1;
      break;
  }

  return {
    year,
    month,
    week,
    day,
    totalTurns: turn,
  };
}

/**
 * Format game time for display
 */
export function formatGameTime(
  gameTime: GameTime,
  format: string
): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let result = format;

  // Replace format tokens
  result = result.replace('YYYY', gameTime.year.toString());
  result = result.replace('YY', (gameTime.year % 100).toString().padStart(2, '0'));
  result = result.replace('MMMM', monthFull[gameTime.month - 1] || 'January');
  result = result.replace('MMM', monthNames[gameTime.month - 1] || 'Jan');
  result = result.replace('MM', gameTime.month.toString().padStart(2, '0'));
  result = result.replace('M', gameTime.month.toString());
  result = result.replace('DD', gameTime.day.toString().padStart(2, '0'));
  result = result.replace('D', gameTime.day.toString());
  result = result.replace('WW', gameTime.week.toString().padStart(2, '0'));
  result = result.replace('W', gameTime.week.toString());

  return result;
}

/**
 * Get a complete formatted timestamp string
 */
export function getGameTimestamp(
  turn: number,
  config: TimeConfig
): string {
  const gameTime = calculateGameTime(turn, config);
  return formatGameTime(gameTime, config.displayFormat);
}

/**
 * Calculate turns until next event (e.g., election)
 */
export function turnsUntilEvent(
  currentTurn: number,
  eventInterval: number,
  offset: number = 0
): number {
  if (eventInterval === 0) return -1; // Event disabled

  const nextEvent = Math.ceil((currentTurn + offset) / eventInterval) * eventInterval;
  return nextEvent - currentTurn;
}

/**
 * Check if event occurs this turn
 */
export function isEventTurn(
  currentTurn: number,
  eventInterval: number,
  offset: number = 0
): boolean {
  if (eventInterval === 0) return false;
  return (currentTurn + offset) % eventInterval === 0 && currentTurn > 0;
}
