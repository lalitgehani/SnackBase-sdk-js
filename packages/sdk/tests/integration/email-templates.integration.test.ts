/**
 * EmailTemplateService integration tests — F7.2: Full Coverage
 *
 * These tests require superadmin authentication (SNACKBASE_API_KEY).
 * Built-in system templates are used for all read/render operations — they cannot be deleted.
 * Any subject/body changes made during update tests are reverted in afterEach.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnackBaseClient } from '../../src/core/client';
import { createTestClient, createTestEmail, TEST_CONFIG } from './setup';

describe('EmailTemplateService Integration Tests', () => {
  let client: SnackBaseClient;

  // Track template IDs we modified so we can revert them
  const revertQueue: Array<{ id: string; subject: string; html_body: string; text_body: string }> = [];

  beforeEach(() => {
    if (!TEST_CONFIG.apiKey) return;
    client = createTestClient();
  });

  afterEach(async () => {
    if (!TEST_CONFIG.apiKey || !client) return;

    for (const entry of revertQueue) {
      try {
        await client.emailTemplates.update(entry.id, {
          subject: entry.subject,
          html_body: entry.html_body,
          text_body: entry.text_body,
        });
      } catch {
        // ignore cleanup errors
      }
    }
    revertQueue.length = 0;
  });

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------

  describe('list', () => {
    it('should return non-empty array of system templates', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const templates = await client.emailTemplates.list();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);

      for (const t of templates) {
        expect(t.id).toBeDefined();
        expect(t.template_type).toBeDefined();
        expect(t.locale).toBeDefined();
        expect(t.subject).toBeDefined();
        expect(typeof t.is_builtin).toBe('boolean');
      }
    });

    it('should filter by template_type and return only matching templates', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const templates = await client.emailTemplates.list({ template_type: 'email_verification' });

      expect(templates).toBeInstanceOf(Array);
      for (const t of templates) {
        expect(t.template_type).toBe('email_verification');
      }
    });

    it('should include built-in system templates', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const templates = await client.emailTemplates.list();
      const builtins = templates.filter((t) => t.is_builtin);

      expect(builtins.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // get
  // ---------------------------------------------------------------------------

  describe('get', () => {
    it('should return a template with all required fields', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const templates = await client.emailTemplates.list();
      expect(templates.length).toBeGreaterThan(0);

      const template = await client.emailTemplates.get(templates[0].id);

      expect(template.id).toBe(templates[0].id);
      expect(template.template_type).toBeDefined();
      expect(template.locale).toBeDefined();
      expect(template.subject).toBeDefined();
      expect(template.html_body).toBeDefined();
      expect(template.text_body).toBeDefined();
      expect(typeof template.enabled).toBe('boolean');
      expect(typeof template.is_builtin).toBe('boolean');
      expect(template.created_at).toBeDefined();
      expect(template.updated_at).toBeDefined();
    });

    it('should reject with 404 for a non-existent template ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.emailTemplates.get('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('should update the subject and have get reflect the new value', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const templates = await client.emailTemplates.list();
      expect(templates.length).toBeGreaterThan(0);
      const template = templates[0];

      // Queue for revert
      revertQueue.push({
        id: template.id,
        subject: template.subject,
        html_body: template.html_body,
        text_body: template.text_body,
      });

      const newSubject = `Updated Subject ${Date.now()}`;
      const updated = await client.emailTemplates.update(template.id, { subject: newSubject });

      expect(updated.subject).toBe(newSubject);

      // Verify persistence
      const fetched = await client.emailTemplates.get(template.id);
      expect(fetched.subject).toBe(newSubject);
    });

    it('should reflect updated subject in render output', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // Find a verification template which has known variables
      const all = await client.emailTemplates.list({ template_type: 'email_verification' });
      if (all.length === 0) return; // skip if no email_verification template seeded

      const template = all[0];
      revertQueue.push({
        id: template.id,
        subject: template.subject,
        html_body: template.html_body,
        text_body: template.text_body,
      });

      const newSubject = `Test Subject ${Date.now()}`;
      await client.emailTemplates.update(template.id, { subject: newSubject });

      const rendered = await client.emailTemplates.render({
        template_type: template.template_type,
        locale: template.locale,
        variables: {
          app_name: 'TestApp',
          app_url: 'https://example.com',
          user_name: 'Alice',
          user_email: 'alice@example.com',
          verification_url: 'https://example.com/verify?token=abc',
          token: 'abc123',
          expires_at: '2026-12-31',
        },
      });

      expect(rendered.subject).toBe(newSubject);
    });
  });

  // ---------------------------------------------------------------------------
  // render
  // ---------------------------------------------------------------------------

  describe('render', () => {
    it('should return rendered content with variables substituted', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const rendered = await client.emailTemplates.render({
        template_type: 'email_verification',
        locale: 'en',
        variables: {
          app_name: 'SnackBase',
          app_url: 'https://example.com',
          user_name: 'Alice',
          user_email: 'alice@example.com',
          verification_url: 'https://example.com/verify?token=abc',
          token: 'abc123',
          expires_at: '2026-12-31',
        },
      });

      expect(rendered.subject).toBeDefined();
      expect(rendered.html_body).toBeDefined();
      expect(rendered.text_body).toBeDefined();

      // Variables should be substituted — Jinja2 braces should not appear in output
      expect(rendered.subject).not.toContain('{{');
      expect(rendered.html_body).not.toContain('{{');
      expect(rendered.text_body).not.toContain('{{');

      // Known substituted values should appear somewhere in the output
      const allContent = rendered.subject + rendered.html_body + rendered.text_body;
      expect(allContent).toContain('SnackBase');
    });

    it('should render with empty strings when variables are omitted', async () => {
      if (!TEST_CONFIG.apiKey) return;

      // The backend uses Jinja2 with Undefined which renders missing vars as "".
      // It does NOT raise a 422 for missing variables — it silently substitutes empty strings.
      const rendered = await client.emailTemplates.render({
        template_type: 'email_verification',
        locale: 'en',
        variables: {},
      });

      expect(rendered.subject).toBeDefined();
      expect(rendered.html_body).toBeDefined();
      expect(rendered.text_body).toBeDefined();
      // With no variables provided, placeholders collapse to empty strings
      expect(rendered.subject).not.toContain('{{');
      expect(rendered.html_body).not.toContain('{{');
    });

    it('should render with inline subject/html_body/text_body overrides', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const customSubject = 'Hello {{ user_name }}';
      const customHtml = '<p>Hi {{ user_name }}, welcome!</p>';
      const customText = 'Hi {{ user_name }}, welcome!';

      const rendered = await client.emailTemplates.render({
        template_type: 'email_verification',
        locale: 'en',
        variables: { user_name: 'Bob' },
        subject: customSubject,
        html_body: customHtml,
        text_body: customText,
      });

      expect(rendered.subject).toBe('Hello Bob');
      expect(rendered.html_body).toContain('Hi Bob');
      expect(rendered.text_body).toContain('Hi Bob');
    });
  });

  // ---------------------------------------------------------------------------
  // sendTest + listLogs + getLog
  // ---------------------------------------------------------------------------

  // sendTest requires a live email provider (SMTP/SES/Resend) with a reachable server.
  // The SMTP provider uses a 10-second connection timeout which exceeds Vitest's default
  // test timeout when the server is configured but unreachable. Gate these tests with
  // SNACKBASE_TEST_EMAIL_ENABLED=true to opt in only when email infrastructure is available.
  describe('sendTest', () => {
    it('should return a status/message response', async () => {
      if (!TEST_CONFIG.apiKey || !process.env.SNACKBASE_TEST_EMAIL_ENABLED) return;

      const templates = await client.emailTemplates.list();
      expect(templates.length).toBeGreaterThan(0);
      const template = templates[0];

      const result = await client.emailTemplates.sendTest(
        template.id,
        createTestEmail(),
        {
          app_name: 'SnackBase',
          app_url: 'https://example.com',
          user_name: 'Tester',
          user_email: 'tester@example.com',
          verification_url: 'https://example.com/verify?token=abc',
          token: 'abc123',
          expires_at: '2026-12-31',
        }
      );

      expect(result.status).toBe('success');
      expect(typeof result.message).toBe('string');
      expect(result.template_type).toBe(template.template_type);
      expect(result.locale).toBe(template.locale);
    });
  });

  describe('listLogs', () => {
    it('should return paginated response with logs, total, page, page_size', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.emailTemplates.listLogs();

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.page_size).toBe('number');
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should filter logs by status_filter', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const result = await client.emailTemplates.listLogs({ status_filter: 'sent' });

      expect(result.logs).toBeInstanceOf(Array);
      for (const log of result.logs) {
        expect(log.status).toBe('sent');
      }
    });

    it('should create a log entry after a successful sendTest', async () => {
      if (!TEST_CONFIG.apiKey || !process.env.SNACKBASE_TEST_EMAIL_ENABLED) return;

      const templates = await client.emailTemplates.list();
      expect(templates.length).toBeGreaterThan(0);
      const template = templates[0];

      const recipientEmail = createTestEmail();

      await client.emailTemplates.sendTest(
        template.id,
        recipientEmail,
        {
          app_name: 'SnackBase',
          app_url: 'https://example.com',
          user_name: 'Tester',
          user_email: 'tester@example.com',
          verification_url: 'https://example.com/verify?token=abc',
          token: 'abc123',
          expires_at: '2026-12-31',
        }
      );

      const logs = await client.emailTemplates.listLogs({ template_type: template.template_type });
      const entry = logs.logs.find((l) => l.recipient_email === recipientEmail);
      expect(entry).toBeDefined();
    });
  });

  describe('getLog', () => {
    it('should return a specific log with recipient_email, template_type, and sent_at', async () => {
      if (!TEST_CONFIG.apiKey) return;

      const logs = await client.emailTemplates.listLogs();

      if (logs.logs.length === 0) {
        // No logs in this environment — skip
        return;
      }

      const logId = logs.logs[0].id;
      const log = await client.emailTemplates.getLog(logId);

      expect(log.id).toBe(logId);
      expect(log.recipient_email).toBeDefined();
      expect(log.template_type).toBeDefined();
      expect(log.sent_at).toBeDefined();
      expect(log.status).toBeDefined();
      expect(log.provider).toBeDefined();
    });

    it('should reject with 404 for a non-existent log ID', async () => {
      if (!TEST_CONFIG.apiKey) return;

      await expect(
        client.emailTemplates.getLog('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });
  });
});
