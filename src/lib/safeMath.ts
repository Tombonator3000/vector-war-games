/**
 * Safe Math Utilities
 *
 * Provides division and calculation functions that safely handle edge cases:
 * - Division by zero
 * - NaN values
 * - Infinity values
 * - Invalid inputs
 *
 * These utilities prevent crashes and unexpected behavior in calculations
 * throughout the game, particularly for:
 * - Victory progress calculations
 * - Combat power ratios
 * - Economic percentages
 * - Population statistics
 */

/**
 * Safely divide two numbers with fallback for edge cases
 *
 * @param numerator - The number to divide
 * @param denominator - The number to divide by
 * @param fallback - Value to return if division is invalid (default: 0)
 * @returns The division result or fallback if invalid
 *
 * @example
 * safeDivide(10, 2) // 5
 * safeDivide(10, 0) // 0 (fallback)
 * safeDivide(10, 0, 1) // 1 (custom fallback)
 * safeDivide(Infinity, 2) // 0 (fallback for invalid input)
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  fallback: number = 0
): number {
  // Check for invalid inputs
  if (!isFinite(numerator) || !isFinite(denominator)) {
    return fallback;
  }

  // Check for zero denominator
  if (denominator === 0) {
    return fallback;
  }

  const result = numerator / denominator;

  // Check if result is valid
  if (!isFinite(result)) {
    return fallback;
  }

  return result;
}

/**
 * Calculate a percentage safely
 *
 * @param value - The current value
 * @param total - The total/maximum value
 * @param fallback - Value to return if calculation is invalid (default: 0)
 * @returns Percentage (0-100) or fallback if invalid
 *
 * @example
 * safePercentage(50, 100) // 50
 * safePercentage(75, 0) // 0 (fallback)
 * safePercentage(3, 4) // 75
 */
export function safePercentage(
  value: number,
  total: number,
  fallback: number = 0
): number {
  if (!isFinite(value) || !isFinite(total) || total === 0) {
    return fallback;
  }

  const percentage = (value / total) * 100;

  if (!isFinite(percentage)) {
    return fallback;
  }

  return percentage;
}

/**
 * Calculate a ratio safely
 *
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param fallback - Value to return if calculation is invalid (default: 1)
 * @returns The ratio or fallback if invalid
 *
 * @example
 * safeRatio(10, 5) // 2
 * safeRatio(10, 0) // 1 (fallback)
 * safeRatio(100, 50) // 2
 */
export function safeRatio(
  numerator: number,
  denominator: number,
  fallback: number = 1
): number {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
    return fallback;
  }

  const ratio = numerator / denominator;

  if (!isFinite(ratio)) {
    return fallback;
  }

  return ratio;
}

/**
 * Calculate average safely, handling empty arrays
 *
 * @param values - Array of numbers to average
 * @param fallback - Value to return if array is empty or invalid (default: 0)
 * @returns The average or fallback if invalid
 *
 * @example
 * safeAverage([1, 2, 3, 4, 5]) // 3
 * safeAverage([]) // 0 (fallback)
 * safeAverage([10, 20, 30]) // 20
 */
export function safeAverage(values: number[], fallback: number = 0): number {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }

  const validValues = values.filter((v) => isFinite(v));

  if (validValues.length === 0) {
    return fallback;
  }

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return safeDivide(sum, validValues.length, fallback);
}

/**
 * Clamp a value between min and max, handling NaN/Infinity
 *
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value or min if invalid
 *
 * @example
 * safeClamp(50, 0, 100) // 50
 * safeClamp(150, 0, 100) // 100
 * safeClamp(-10, 0, 100) // 0
 * safeClamp(NaN, 0, 100) // 0
 */
export function safeClamp(value: number, min: number, max: number): number {
  if (!isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculate percentage change between two values
 *
 * @param oldValue - The original value
 * @param newValue - The new value
 * @param fallback - Value to return if calculation is invalid (default: 0)
 * @returns Percentage change or fallback if invalid
 *
 * @example
 * safePercentageChange(100, 150) // 50 (50% increase)
 * safePercentageChange(100, 50) // -50 (50% decrease)
 * safePercentageChange(0, 100) // 0 (fallback, can't calculate from zero)
 */
export function safePercentageChange(
  oldValue: number,
  newValue: number,
  fallback: number = 0
): number {
  if (!isFinite(oldValue) || !isFinite(newValue) || oldValue === 0) {
    return fallback;
  }

  const change = ((newValue - oldValue) / oldValue) * 100;

  if (!isFinite(change)) {
    return fallback;
  }

  return change;
}

/**
 * Calculate weighted average safely
 *
 * @param values - Array of values
 * @param weights - Array of weights (must match values length)
 * @param fallback - Value to return if calculation is invalid (default: 0)
 * @returns Weighted average or fallback if invalid
 *
 * @example
 * safeWeightedAverage([10, 20, 30], [1, 2, 3]) // 23.33...
 * safeWeightedAverage([10], [0]) // 0 (fallback, zero weight)
 * safeWeightedAverage([], []) // 0 (fallback, empty arrays)
 */
export function safeWeightedAverage(
  values: number[],
  weights: number[],
  fallback: number = 0
): number {
  if (
    !Array.isArray(values) ||
    !Array.isArray(weights) ||
    values.length === 0 ||
    values.length !== weights.length
  ) {
    return fallback;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    if (isFinite(values[i]) && isFinite(weights[i])) {
      weightedSum += values[i] * weights[i];
      totalWeight += weights[i];
    }
  }

  if (totalWeight === 0) {
    return fallback;
  }

  return safeDivide(weightedSum, totalWeight, fallback);
}

/**
 * Normalize a value to 0-1 range safely
 *
 * @param value - The value to normalize
 * @param min - Minimum of the range
 * @param max - Maximum of the range
 * @param fallback - Value to return if calculation is invalid (default: 0)
 * @returns Normalized value (0-1) or fallback if invalid
 *
 * @example
 * safeNormalize(50, 0, 100) // 0.5
 * safeNormalize(75, 0, 100) // 0.75
 * safeNormalize(50, 50, 50) // 0 (fallback, no range)
 */
export function safeNormalize(
  value: number,
  min: number,
  max: number,
  fallback: number = 0
): number {
  if (!isFinite(value) || !isFinite(min) || !isFinite(max) || max === min) {
    return fallback;
  }

  const normalized = (value - min) / (max - min);

  if (!isFinite(normalized)) {
    return fallback;
  }

  return safeClamp(normalized, 0, 1);
}

/**
 * Check if a number is safe for calculations (not NaN, not Infinity)
 *
 * @param value - The value to check
 * @returns true if the value is safe to use in calculations
 */
export function isSafeNumber(value: number): boolean {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Ensure a number is safe, replacing invalid values with fallback
 *
 * @param value - The value to ensure
 * @param fallback - Fallback value if invalid (default: 0)
 * @returns The value if safe, otherwise the fallback
 */
export function ensureSafeNumber(value: number, fallback: number = 0): number {
  return isSafeNumber(value) ? value : fallback;
}
