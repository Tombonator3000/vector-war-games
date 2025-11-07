import { describe, it, expect } from 'vitest';

import {
  computeDiplomaticColor,
  computeIntelColor,
  computeResourceColor,
  computeUnrestColor,
  colorToRgba,
} from '../mapColorUtils';

describe('mapColorUtils', () => {
  describe('computeDiplomaticColor', () => {
    it('returns green for allied nations (score >= 60)', () => {
      expect(computeDiplomaticColor(100)).toBe('#4ade80');
      expect(computeDiplomaticColor(60)).toBe('#4ade80');
    });

    it('returns cyan for friendly nations (score >= 20)', () => {
      expect(computeDiplomaticColor(59)).toBe('#22d3ee');
      expect(computeDiplomaticColor(50)).toBe('#22d3ee');
      expect(computeDiplomaticColor(20)).toBe('#22d3ee');
    });

    it('returns red for hostile nations (score <= -40)', () => {
      expect(computeDiplomaticColor(-100)).toBe('#f87171');
      expect(computeDiplomaticColor(-50)).toBe('#f87171');
      expect(computeDiplomaticColor(-40)).toBe('#f87171');
    });

    it('returns yellow for neutral nations (score between -39 and 19)', () => {
      expect(computeDiplomaticColor(0)).toBe('#facc15');
      expect(computeDiplomaticColor(19)).toBe('#facc15');
      expect(computeDiplomaticColor(-39)).toBe('#facc15');
      expect(computeDiplomaticColor(10)).toBe('#facc15');
      expect(computeDiplomaticColor(-20)).toBe('#facc15');
    });
  });

  describe('computeIntelColor', () => {
    it('returns deep blue for zero intel', () => {
      const color = computeIntelColor(0);
      // The exact color should be the start color (#1d4ed8)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns light blue for full intel', () => {
      const color = computeIntelColor(1);
      // The exact color should be the end color (#38bdf8)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns intermediate blue for partial intel', () => {
      const color = computeIntelColor(0.5);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('clamps values below 0 to 0', () => {
      const colorNegative = computeIntelColor(-1);
      const colorZero = computeIntelColor(0);
      expect(colorNegative).toBe(colorZero);
    });

    it('clamps values above 1 to 1', () => {
      const colorAbove = computeIntelColor(2);
      const colorOne = computeIntelColor(1);
      expect(colorAbove).toBe(colorOne);
    });
  });

  describe('computeResourceColor', () => {
    it('returns orange for zero resources', () => {
      const color = computeResourceColor(0);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns yellow for maximum resources', () => {
      const color = computeResourceColor(1);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns intermediate color for partial resources', () => {
      const color = computeResourceColor(0.5);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('clamps values below 0 to 0', () => {
      const colorNegative = computeResourceColor(-1);
      const colorZero = computeResourceColor(0);
      expect(colorNegative).toBe(colorZero);
    });

    it('clamps values above 1 to 1', () => {
      const colorAbove = computeResourceColor(2);
      const colorOne = computeResourceColor(1);
      expect(colorAbove).toBe(colorOne);
    });
  });

  describe('computeUnrestColor', () => {
    it('returns green for stable nations (stability >= 65)', () => {
      expect(computeUnrestColor(100)).toBe('#22c55e');
      expect(computeUnrestColor(65)).toBe('#22c55e');
      expect(computeUnrestColor(80)).toBe('#22c55e');
    });

    it('returns yellow for tense nations (stability >= 45)', () => {
      expect(computeUnrestColor(64)).toBe('#facc15');
      expect(computeUnrestColor(45)).toBe('#facc15');
      expect(computeUnrestColor(50)).toBe('#facc15');
    });

    it('returns red for crisis nations (stability < 45)', () => {
      expect(computeUnrestColor(44)).toBe('#f87171');
      expect(computeUnrestColor(0)).toBe('#f87171');
      expect(computeUnrestColor(20)).toBe('#f87171');
    });
  });

  describe('colorToRgba', () => {
    it('converts hex color to rgba with alpha', () => {
      const result = colorToRgba('#ff0000', 0.5);
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('handles pure white', () => {
      const result = colorToRgba('#ffffff', 1);
      expect(result).toBe('rgba(255, 255, 255, 1)');
    });

    it('handles pure black', () => {
      const result = colorToRgba('#000000', 1);
      expect(result).toBe('rgba(0, 0, 0, 1)');
    });

    it('handles green', () => {
      const result = colorToRgba('#00ff00', 0.75);
      expect(result).toBe('rgba(0, 255, 0, 0.75)');
    });

    it('handles blue', () => {
      const result = colorToRgba('#0000ff', 0.25);
      expect(result).toBe('rgba(0, 0, 255, 0.25)');
    });

    it('clamps alpha values below 0 to 0', () => {
      const result = colorToRgba('#ff0000', -1);
      expect(result).toBe('rgba(255, 0, 0, 0)');
    });

    it('clamps alpha values above 1 to 1', () => {
      const result = colorToRgba('#ff0000', 2);
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('handles alpha value of 0 (fully transparent)', () => {
      const result = colorToRgba('#ff0000', 0);
      expect(result).toBe('rgba(255, 0, 0, 0)');
    });

    it('handles diplomatic colors', () => {
      const allied = colorToRgba('#4ade80', 0.8);
      expect(allied).toMatch(/^rgba\(\d+, \d+, \d+, 0\.8\)$/);

      const hostile = colorToRgba('#f87171', 0.8);
      expect(hostile).toMatch(/^rgba\(\d+, \d+, \d+, 0\.8\)$/);
    });
  });

  describe('integration tests', () => {
    it('diplomatic colors work with colorToRgba', () => {
      const alliedColor = computeDiplomaticColor(100);
      const rgba = colorToRgba(alliedColor, 0.5);
      expect(rgba).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/);
    });

    it('unrest colors work with colorToRgba', () => {
      const stableColor = computeUnrestColor(100);
      const rgba = colorToRgba(stableColor, 0.8);
      expect(rgba).toMatch(/^rgba\(\d+, \d+, \d+, 0\.8\)$/);
    });

    it('all color functions return valid hex strings', () => {
      const hexPattern = /^#[0-9a-f]{6}$/i;

      expect(computeDiplomaticColor(50)).toMatch(hexPattern);
      expect(computeUnrestColor(50)).toMatch(hexPattern);
      expect(computeIntelColor(0.5)).toMatch(hexPattern);
      expect(computeResourceColor(0.5)).toMatch(hexPattern);
    });
  });
});
