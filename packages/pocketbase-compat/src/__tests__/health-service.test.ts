/**
 * Phase 5 — HealthServiceCompat tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HealthServiceCompat } from '../health-service.js';

describe('HealthServiceCompat', () => {
  let service: HealthServiceCompat;

  beforeEach(() => {
    service = new HealthServiceCompat();
  });

  it('resolves without throwing', async () => {
    await expect(service.check()).resolves.not.toThrow();
  });

  it('returns an object with code: 200', async () => {
    const result = await service.check();
    expect(result.code).toBe(200);
  });

  it('returns a non-empty message string', async () => {
    const result = await service.check();
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('returns a data object', async () => {
    const result = await service.check();
    expect(typeof result.data).toBe('object');
    expect(result.data).not.toBeNull();
  });

  it('can be called with opts without error', async () => {
    await expect(service.check({ custom: 'opt' })).resolves.toBeDefined();
  });
});
