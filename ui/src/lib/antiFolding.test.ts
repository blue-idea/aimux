import { describe, it, expect } from 'vitest';
import { calculateDynamicZoom, formatZoomPercentage } from './antiFolding';

describe('antiFolding', () => {
  it('should return 1.0 when width is at or above desktop breakpoint (850px)', () => {
    expect(calculateDynamicZoom(850)).toBe(1.0);
    expect(calculateDynamicZoom(1200)).toBe(1.0);
    expect(calculateDynamicZoom(1920)).toBe(1.0);
  });

  it('should dynamically scale down linearly when width is below 850px', () => {
    // 680 / 850 = 0.8
    expect(calculateDynamicZoom(680)).toBeCloseTo(0.8, 3);
    // 765 / 850 = 0.9
    expect(calculateDynamicZoom(765)).toBeCloseTo(0.9, 3);
  });

  it('should clamp zoom factor to minimum threshold 0.75 (75%)', () => {
    // 500 / 850 = ~0.588, should clamp to 0.75
    expect(calculateDynamicZoom(500)).toBe(0.75);
    expect(calculateDynamicZoom(300)).toBe(0.75);
    expect(calculateDynamicZoom(0)).toBe(1.0); // 0 or unmeasured falls back to 1.0
  });

  it('should format zoom factor as rounded percentage integer', () => {
    expect(formatZoomPercentage(1.0)).toBe(100);
    expect(formatZoomPercentage(0.852)).toBe(85);
    expect(formatZoomPercentage(0.75)).toBe(75);
  });
});

