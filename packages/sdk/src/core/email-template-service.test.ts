import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailTemplateService } from './email-template-service';
import { HttpClient } from './http-client';
import {
  EmailTemplate,
  EmailLog,
  EmailLogListResponse,
  EmailTemplateRenderResponse
} from '../types/email-template';

describe('EmailTemplateService', () => {
  let httpClient: HttpClient;
  let emailService: EmailTemplateService;

  const mockTemplate: EmailTemplate = {
    id: 'tmpl-1',
    template_type: 'verification',
    locale: 'en',
    subject: 'Verify your email',
    html_body: '<h1>Verify</h1>',
    text_body: 'Verify',
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockLog: EmailLog = {
    id: 'log-1',
    account_id: 'acc-1',
    template_type: 'verification',
    recipient: 'user@example.com',
    subject: 'Verify your email',
    status: 'sent',
    provider: 'sendgrid',
    sent_at: new Date().toISOString(),
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    emailService = new EmailTemplateService(httpClient);
  });

  describe('list', () => {
    it('should fetch email templates', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: [mockTemplate],
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const filters = { template_type: 'verification' };
      const result = await emailService.list(filters);
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/email/templates', { params: filters });
      expect(result).toEqual([mockTemplate]);
    });
  });

  describe('get', () => {
    it('should fetch email template details', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockTemplate,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await emailService.get('tmpl-1');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/email/templates/tmpl-1');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('update', () => {
    it('should update an email template', async () => {
      const updateData = { subject: 'New Subject' };
      const putSpy = vi.spyOn(httpClient, 'put').mockResolvedValue({
        data: { ...mockTemplate, ...updateData },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await emailService.update('tmpl-1', updateData);
      expect(putSpy).toHaveBeenCalledWith('/api/v1/admin/email/templates/tmpl-1', updateData);
      expect(result.subject).toBe('New Subject');
    });
  });

  describe('render', () => {
    it('should render an email template', async () => {
      const mockRenderResponse: EmailTemplateRenderResponse = {
        subject: 'Rendered Subject',
        html_body: '<p>Rendered Body</p>',
        text_body: 'Rendered Body',
      };
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockRenderResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const request = {
        template_type: 'verification',
        locale: 'en',
        variables: { name: 'John' },
      };
      const result = await emailService.render(request);
      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/email/templates/render', request);
      expect(result).toEqual(mockRenderResponse);
    });
  });

  describe('sendTest', () => {
    it('should send a test email', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: { success: true },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const variables = { name: 'John' };
      const result = await emailService.sendTest('tmpl-1', 'test@example.com', variables);
      expect(postSpy).toHaveBeenCalledWith('/api/v1/admin/email/templates/tmpl-1/test', {
        recipient: 'test@example.com',
        variables,
        provider: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('listLogs', () => {
    it('should fetch email logs', async () => {
      const mockLogResponse: EmailLogListResponse = {
        data: [mockLog],
        total: 1,
        page: 1,
        limit: 10,
        last_page: 1,
      };
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockLogResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const filters = { status: 'sent' };
      const result = await emailService.listLogs(filters);
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/email/logs', { params: filters });
      expect(result).toEqual(mockLogResponse);
    });
  });

  describe('getLog', () => {
    it('should fetch email log details', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockLog,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await emailService.getLog('log-1');
      expect(getSpy).toHaveBeenCalledWith('/api/v1/admin/email/logs/log-1');
      expect(result).toEqual(mockLog);
    });
  });
});
