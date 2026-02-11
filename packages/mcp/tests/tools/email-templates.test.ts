import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleEmailTemplatesTool } from '../../src/tools/email-templates.js';
import { createClient } from '../../src/client.js';

// Mock the client
vi.mock('../../src/client.js', () => ({
  createClient: vi.fn(),
}));

describe('snackbase_email_templates', () => {
  const mockEmailTemplates = {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    sendTest: vi.fn(),
    listLogs: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (createClient as any).mockReturnValue({
      emailTemplates: mockEmailTemplates,
    });
  });

  it('should list templates', async () => {
    const mockTemplates = [{ id: 'tpl_123', template_type: 'verification' }];
    mockEmailTemplates.list.mockResolvedValue(mockTemplates);

    const result = await handleEmailTemplatesTool({
      action: 'list',
      filters: { template_type: 'verification' },
    });

    expect(mockEmailTemplates.list).toHaveBeenCalledWith({ template_type: 'verification' });
    expect(JSON.parse(result.content[0].text)).toEqual(mockTemplates);
  });

  it('should get a template', async () => {
    const mockTemplate = { id: 'tpl_123', subject: 'Verify Email' };
    mockEmailTemplates.get.mockResolvedValue(mockTemplate);

    const result = await handleEmailTemplatesTool({
      action: 'get',
      template_id: 'tpl_123',
    });

    expect(mockEmailTemplates.get).toHaveBeenCalledWith('tpl_123');
    expect(JSON.parse(result.content[0].text)).toEqual(mockTemplate);
  });

  it('should update a template', async () => {
    const mockTemplate = { id: 'tpl_123', subject: 'New Subject' };
    mockEmailTemplates.update.mockResolvedValue(mockTemplate);

    const result = await handleEmailTemplatesTool({
      action: 'update',
      template_id: 'tpl_123',
      subject: 'New Subject',
    });

    expect(mockEmailTemplates.update).toHaveBeenCalledWith('tpl_123', {
      subject: 'New Subject',
      html_body: undefined,
      text_body: undefined,
      enabled: undefined,
    });
    expect(JSON.parse(result.content[0].text)).toEqual(mockTemplate);
  });

  it('should render a template', async () => {
    const mockRender = { subject: 'Hello', html_body: '<b>Hello</b>' };
    mockEmailTemplates.render.mockResolvedValue(mockRender);

    const result = await handleEmailTemplatesTool({
      action: 'render',
      template_type: 'verification',
      locale: 'en',
      variables: { name: 'John' },
    });

    expect(mockEmailTemplates.render).toHaveBeenCalledWith({
      template_type: 'verification',
      locale: 'en',
      variables: { name: 'John' },
      subject_override: undefined,
      html_body_override: undefined,
      text_body_override: undefined,
    });
    expect(JSON.parse(result.content[0].text)).toEqual(mockRender);
  });

  it('should send a test email', async () => {
    mockEmailTemplates.sendTest.mockResolvedValue({ success: true });

    const result = await handleEmailTemplatesTool({
      action: 'send_test',
      template_id: 'tpl_123',
      recipient_email: 'test@example.com',
    });

    expect(mockEmailTemplates.sendTest).toHaveBeenCalledWith(
      'tpl_123',
      'test@example.com',
      undefined,
      undefined
    );
    expect(JSON.parse(result.content[0].text)).toEqual({ success: true });
  });

  it('should list email logs', async () => {
    const mockLogs = { items: [{ id: 'log_123' }], total: 1 };
    mockEmailTemplates.listLogs.mockResolvedValue(mockLogs);

    const result = await handleEmailTemplatesTool({
      action: 'list_logs',
      filters: { limit: 10 },
    });

    expect(mockEmailTemplates.listLogs).toHaveBeenCalledWith({ limit: 10 });
    expect(JSON.parse(result.content[0].text)).toEqual(mockLogs);
  });

  it('should handle errors', async () => {
    const error = new Error('Test error');
    mockEmailTemplates.get.mockRejectedValue(error);

    const result = await handleEmailTemplatesTool({
      action: 'get',
      template_id: 'tpl_123',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Test error');
  });

  it('should throw error for missing template_id in get', async () => {
    const result = await handleEmailTemplatesTool({
      action: 'get',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('template_id is required');
  });
});
