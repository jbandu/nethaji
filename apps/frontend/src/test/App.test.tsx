import { describe, it, expect } from 'vitest';

/**
 * Basic application tests
 * These tests verify the setup is correct
 */

describe('Application Setup', () => {
  it('should have correct test environment', () => {
    expect(import.meta.env.MODE).toBeDefined();
  });

  it('should be able to run tests', () => {
    expect(true).toBe(true);
  });
});
