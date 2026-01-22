import { HttpClient } from './http-client';
import {
  EmailTemplate,
  EmailTemplateUpdate,
  EmailTemplateFilters,
  EmailTemplateRenderRequest,
  EmailTemplateRenderResponse,
  EmailLog,
  EmailLogFilters,
  EmailLogListResponse
} from '../types/email-template';

/**
 * Service for managing email templates and logs.
 */
export class EmailTemplateService {
  constructor(private http: HttpClient) {}

  /**
   * Returns a list of email templates.
   * @param filters Optional filters for listing templates
   */
  async list(filters?: EmailTemplateFilters): Promise<EmailTemplate[]> {
    const response = await this.http.get<EmailTemplate[]>('/api/v1/admin/email/templates', {
      params: filters
    });
    return response.data;
  }

  /**
   * Returns email template details.
   * @param templateId Template ID
   */
  async get(templateId: string): Promise<EmailTemplate> {
    const response = await this.http.get<EmailTemplate>(`/api/v1/admin/email/templates/${templateId}`);
    return response.data;
  }

  /**
   * Updates an email template.
   * @param templateId Template ID
   * @param data Update data
   */
  async update(templateId: string, data: EmailTemplateUpdate): Promise<EmailTemplate> {
    const response = await this.http.put<EmailTemplate>(`/api/v1/admin/email/templates/${templateId}`, data);
    return response.data;
  }

  /**
   * Renders an email template with provided variables.
   * @param request Render request data
   */
  async render(request: EmailTemplateRenderRequest): Promise<EmailTemplateRenderResponse> {
    const response = await this.http.post<EmailTemplateRenderResponse>('/api/v1/admin/email/templates/render', request);
    return response.data;
  }

  /**
   * Sends a test email using the specified template.
   * @param templateId Template ID
   * @param recipientEmail Recipient email address
   * @param variables Template variables
   * @param provider Optional provider override
   */
  async sendTest(
    templateId: string,
    recipientEmail: string,
    variables: Record<string, any> = {},
    provider?: string
  ): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(`/api/v1/admin/email/templates/${templateId}/test`, {
      recipient: recipientEmail,
      variables,
      provider
    });
    return response.data;
  }

  /**
   * Returns a paginated list of email logs.
   * @param filters Optional filters for listing logs
   */
  async listLogs(filters?: EmailLogFilters): Promise<EmailLogListResponse> {
    const response = await this.http.get<EmailLogListResponse>('/api/v1/admin/email/logs', {
      params: filters
    });
    return response.data;
  }

  /**
   * Returns single email log details.
   * @param logId Log ID
   */
  async getLog(logId: string): Promise<EmailLog> {
    const response = await this.http.get<EmailLog>(`/api/v1/admin/email/logs/${logId}`);
    return response.data;
  }
}
