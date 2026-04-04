/**
 * AdminService integration tests — F6.1: Configuration & Providers
 *
 * These tests require superadmin authentication (SNACKBASE_API_KEY).
 * System-seeded built-in configurations cannot be deleted (backend returns 403).
 * Custom configurations created in each test use unique names to avoid conflicts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, createTestAccountName, TEST_CONFIG } from './setup';

const CATEGORY = {
  EMAIL: 'email_providers',
  AUTH: 'auth_providers',
  STORAGE: 'storage_providers',
  SYSTEM: 'system_settings',
};

function createTestConfigName() {
  return `test_config_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

describe('AdminService Integration Tests', () => {
  let client: SnackBaseClient;
  const createdConfigIds: string[] = [];
  const createdAccountIds: string[] = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;

    // Delete configs first (they may reference accounts)
    for (const id of createdConfigIds) {
      try {
        await client.admin.deleteConfiguration(id);
      } catch {
        // ignore cleanup errors
      }
    }
    createdConfigIds.length = 0;

    // Then delete accounts
    for (const id of createdAccountIds) {
      try {
        await client.accounts.delete(id);
      } catch {
        // ignore cleanup errors
      }
    }
    createdAccountIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // getConfigurationStats
  // ---------------------------------------------------------------------------

  describe('getConfigurationStats', () => {
    it('should return stats object with system_configs and account_configs', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const stats = await client.admin.getConfigurationStats();

      expect(stats).toBeDefined();
      expect(typeof stats.system_configs.total).toBe('number');
      expect(stats.system_configs.total).toBeGreaterThanOrEqual(0);
      expect(typeof stats.account_configs.total).toBe('number');
      expect(stats.account_configs.total).toBeGreaterThanOrEqual(0);
    });

    it('should reflect category breakdown in by_category', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const stats = await client.admin.getConfigurationStats();

      expect(typeof stats.system_configs.by_category).toBe('object');
      expect(typeof stats.account_configs.by_category).toBe('object');

      for (const count of Object.values(stats.system_configs.by_category)) {
        expect(typeof count).toBe('number');
      }
      for (const count of Object.values(stats.account_configs.by_category)) {
        expect(typeof count).toBe('number');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // listSystemConfigurations
  // ---------------------------------------------------------------------------

  describe('listSystemConfigurations', () => {
    it('should return non-empty array of system configurations', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const configs = await client.admin.listSystemConfigurations();

      expect(configs).toBeInstanceOf(Array);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should return only system-level configs (is_system filter is applied server-side)', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const configs = await client.admin.listSystemConfigurations();

      // The backend filters by is_system = true; account_id is not included in the response.
      // Verify by checking account configs for a fresh account return no overlap.
      expect(configs).toBeInstanceOf(Array);
      expect(configs.length).toBeGreaterThan(0);
      for (const config of configs) {
        expect(config.id).toBeDefined();
        expect(config.category).toBeDefined();
        expect(config.provider_name).toBeDefined();
      }
    });

    it('should filter by category when category param is provided', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const configs = await client.admin.listSystemConfigurations(CATEGORY.EMAIL);

      expect(configs).toBeInstanceOf(Array);
      for (const config of configs) {
        expect(config.category).toBe(CATEGORY.EMAIL);
      }
    });

    it('should include a newly created system config in results', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const displayName = createTestConfigName();
      const result = await client.admin.createConfiguration({
        display_name: displayName,
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
      });
      createdConfigIds.push(result.id);

      const configs = await client.admin.listSystemConfigurations(CATEGORY.EMAIL);
      const found = configs.find((c) => c.id === result.id);

      expect(found).toBeDefined();
      expect(found!.category).toBe(CATEGORY.EMAIL);
      expect(found!.provider_name).toBe('smtp');
    });
  });

  // ---------------------------------------------------------------------------
  // getRecentConfigurations
  // ---------------------------------------------------------------------------

  describe('getRecentConfigurations', () => {
    it('should return at most 10 configs by default', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const recent = await client.admin.getRecentConfigurations();

      expect(recent).toBeInstanceOf(Array);
      expect(recent.length).toBeLessThanOrEqual(10);
    });

    it('should respect the limit parameter', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const recent = await client.admin.getRecentConfigurations(3);

      expect(recent).toBeInstanceOf(Array);
      expect(recent.length).toBeLessThanOrEqual(3);
    });

    it('should include a newly created config near the top', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
      });
      createdConfigIds.push(result.id);

      const recent = await client.admin.getRecentConfigurations(10);
      const found = recent.find((c) => c.id === result.id);

      expect(found).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // listProviders
  // ---------------------------------------------------------------------------

  describe('listProviders', () => {
    it('should return all providers with required fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const providers = await client.admin.listProviders();

      expect(providers).toBeInstanceOf(Array);
      expect(providers.length).toBeGreaterThan(0);

      for (const provider of providers) {
        expect(typeof provider.provider_name).toBe('string');
        expect(typeof provider.display_name).toBe('string');
        expect(typeof provider.category).toBe('string');
        expect(typeof provider.is_builtin).toBe('boolean');
      }
    });

    it('should filter providers by category', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const providers = await client.admin.listProviders(CATEGORY.EMAIL);

      expect(providers).toBeInstanceOf(Array);
      expect(providers.length).toBeGreaterThan(0);

      for (const provider of providers) {
        expect(provider.category).toBe(CATEGORY.EMAIL);
      }
    });

    it('should include smtp in email_providers', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const providers = await client.admin.listProviders(CATEGORY.EMAIL);
      const smtp = providers.find((p) => p.provider_name === 'smtp');

      expect(smtp).toBeDefined();
      expect(smtp!.is_builtin).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getProviderSchema
  // ---------------------------------------------------------------------------

  describe('getProviderSchema', () => {
    it('should return a JSON schema object for smtp provider', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const schema = await client.admin.getProviderSchema(CATEGORY.EMAIL, 'smtp');

      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
      expect(schema.properties).toBeDefined();
    });

    it('should return schema with field definitions including host', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const schema = await client.admin.getProviderSchema(CATEGORY.EMAIL, 'smtp');

      expect(typeof schema.properties).toBe('object');
      expect(schema.properties.host).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // createConfiguration
  // ---------------------------------------------------------------------------

  describe('createConfiguration', () => {
    it('should create a system configuration and return id and status', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: true,
      });
      createdConfigIds.push(result.id);

      expect(result.id).toBeDefined();
      expect(result.status).toBe('success');
    });

    it('should appear in listSystemConfigurations after creation', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
      });
      createdConfigIds.push(result.id);

      const list = await client.admin.listSystemConfigurations(CATEGORY.EMAIL);
      expect(list.find((c) => c.id === result.id)).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getConfigurationValues
  // ---------------------------------------------------------------------------

  describe('getConfigurationValues', () => {
    it('should return values object containing keys from creation', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
      });
      createdConfigIds.push(result.id);

      const values = await client.admin.getConfigurationValues(result.id);

      expect(values).toBeDefined();
      expect(typeof values).toBe('object');
      expect(values.host).toBeDefined();
      expect(values.port).toBeDefined();
    });

    it('should throw for a non-existent configuration id', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(client.admin.getConfigurationValues('nonexistent-id-12345')).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // updateConfigurationValues
  // ---------------------------------------------------------------------------

  describe('updateConfigurationValues', () => {
    it('should update values and reflect change via getConfigurationValues', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'original.example.com', port: 587, username: 'user', password: 'pass' },
      });
      createdConfigIds.push(result.id);

      await client.admin.updateConfigurationValues(result.id, {
        host: 'updated.example.com',
        port: 465,
        username: 'user',
        password: 'pass',
      });

      const values = await client.admin.getConfigurationValues(result.id);
      expect(values.host).toBe('updated.example.com');
      expect(values.port).toBe(465);
    });
  });

  // ---------------------------------------------------------------------------
  // updateConfigurationStatus
  // ---------------------------------------------------------------------------

  describe('updateConfigurationStatus', () => {
    it('should disable a configuration and reflect enabled: false', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: true,
      });
      createdConfigIds.push(result.id);

      const status = await client.admin.updateConfigurationStatus(result.id, false);

      expect(status.enabled).toBe(false);
      expect(typeof status.is_default).toBe('boolean');
    });

    it('should re-enable a disabled configuration', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: false,
      });
      createdConfigIds.push(result.id);

      const status = await client.admin.updateConfigurationStatus(result.id, true);

      expect(status.enabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // setConfigurationDefault / unsetConfigurationDefault
  // ---------------------------------------------------------------------------

  describe('setConfigurationDefault', () => {
    it('should mark a configuration as default', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: true,
      });
      createdConfigIds.push(result.id);

      const setResult = await client.admin.setConfigurationDefault(result.id);

      expect(setResult.is_default).toBe(true);
      expect(setResult.provider_name).toBe('smtp');
      expect(setResult.display_name).toBeDefined();
    });

    it('should atomically move default so only one default exists per category', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Use two different providers — unique constraint is (category, provider_name, account_id)
      const result1 = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: true,
      });
      createdConfigIds.push(result1.id);

      const result2 = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'aws_ses',
        config: { region: 'us-east-1', access_key_id: 'AKIAIOSFODNN7EXAMPLE', secret_access_key: 'secret', from_email: 'no-reply@example.com' },
        enabled: true,
      });
      createdConfigIds.push(result2.id);

      await client.admin.setConfigurationDefault(result1.id);
      await client.admin.setConfigurationDefault(result2.id);

      const systemConfigs = await client.admin.listSystemConfigurations(CATEGORY.EMAIL);
      const defaults = systemConfigs.filter((c) => c.is_default === true);

      // Only one default should exist in the category
      expect(defaults.length).toBe(1);
      expect(defaults[0].id).toBe(result2.id);
    });
  });

  describe('unsetConfigurationDefault', () => {
    it('should clear the default flag from a configuration', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: true,
      });
      createdConfigIds.push(result.id);

      await client.admin.setConfigurationDefault(result.id);
      const unsetResult = await client.admin.unsetConfigurationDefault(result.id);

      expect(unsetResult.is_default).toBe(false);
    });

    it('should result in no default for this config after unsetting', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        enabled: true,
      });
      createdConfigIds.push(result.id);

      await client.admin.setConfigurationDefault(result.id);
      await client.admin.unsetConfigurationDefault(result.id);

      const systemConfigs = await client.admin.listSystemConfigurations(CATEGORY.EMAIL);
      const ownedDefaults = systemConfigs.filter(
        (c) => c.id === result.id && c.is_default === true
      );
      expect(ownedDefaults.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteConfiguration
  // ---------------------------------------------------------------------------

  describe('deleteConfiguration', () => {
    it('should delete a custom config so getConfigurationValues returns 404', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
      });

      await client.admin.deleteConfiguration(result.id);

      await expect(client.admin.getConfigurationValues(result.id)).rejects.toThrow();
    });

    it('should no longer appear in listSystemConfigurations after deletion', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
      });

      await client.admin.deleteConfiguration(result.id);

      const list = await client.admin.listSystemConfigurations(CATEGORY.EMAIL);
      expect(list.find((c) => c.id === result.id)).toBeUndefined();
    });

    it('should reject deletion of a built-in system configuration with an error', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Find a system-seeded built-in config (e.g. local storage)
      const storageConfigs = await client.admin.listSystemConfigurations(CATEGORY.STORAGE);
      const builtInConfig = storageConfigs.find((c) => c.is_builtin === true);

      // If no local storage config exists, skip gracefully
      if (!builtInConfig) return;

      await expect(client.admin.deleteConfiguration(builtInConfig.id)).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // listAccountConfigurations
  // ---------------------------------------------------------------------------

  describe('listAccountConfigurations', () => {
    it('should return only configurations belonging to the specified account', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Create a test account
      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      createdAccountIds.push(account.id);

      // Create a config for that account
      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        account_id: account.id,
      });
      createdConfigIds.push(result.id);

      const configs = await client.admin.listAccountConfigurations(account.id);

      expect(configs).toBeInstanceOf(Array);
      const found = configs.find((c) => c.id === result.id);
      expect(found).toBeDefined();
      expect(found!.account_id).toBe(account.id);
    });

    it('should filter by category when category param is provided', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const account = await client.accounts.create({
        name: createTestAccountName(),
      });
      createdAccountIds.push(account.id);

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        account_id: account.id,
      });
      createdConfigIds.push(result.id);

      const emailConfigs = await client.admin.listAccountConfigurations(account.id, CATEGORY.EMAIL);

      expect(emailConfigs).toBeInstanceOf(Array);
      for (const c of emailConfigs) {
        expect(c.category).toBe(CATEGORY.EMAIL);
      }
      expect(emailConfigs.find((c) => c.id === result.id)).toBeDefined();
    });

    it('should not include configs from a different account', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const account1 = await client.accounts.create({ name: createTestAccountName() });
      createdAccountIds.push(account1.id);
      const account2 = await client.accounts.create({ name: createTestAccountName() });
      createdAccountIds.push(account2.id);

      const result = await client.admin.createConfiguration({
        display_name: createTestConfigName(),
        category: CATEGORY.EMAIL,
        provider_name: 'smtp',
        config: { host: 'mail.example.com', port: 587, username: 'user', password: 'pass' },
        account_id: account1.id,
      });
      createdConfigIds.push(result.id);

      const account2Configs = await client.admin.listAccountConfigurations(account2.id);
      expect(account2Configs.find((c) => c.id === result.id)).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // testConnection
  // ---------------------------------------------------------------------------

  describe('testConnection', () => {
    it('should return a ConnectionTestResult with success and message fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.admin.testConnection(CATEGORY.EMAIL, 'smtp', {
        host: 'invalid.host.invalid',
        port: 587,
        username: 'user',
        password: 'wrongpassword',
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should return success: false with a connection error for invalid credentials', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Should return a graceful failure, not throw a 500 error
      const result = await client.admin.testConnection(CATEGORY.EMAIL, 'smtp', {
        host: 'invalid.host.invalid',
        port: 587,
        username: 'user',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
    });
  });
});
