/**
 * Email template type.
 */
export type EmailTemplateType = 'verification' | 'reset_password' | 'invitation' | string;

/**
 * Email template interface.
 */
export interface EmailTemplate {
  id: string;
  template_type: EmailTemplateType;
  locale: string;
  subject: string;
  html_body: string;
  text_body: string;
  enabled: boolean;
  is_builtin: boolean;
  account_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Data for updating an email template.
 */
export interface EmailTemplateUpdate {
  subject?: string;
  html_body?: string;
  text_body?: string;
  enabled?: boolean;
}

/**
 * Filters for listing email templates.
 */
export interface EmailTemplateFilters {
  [key: string]: string | number | boolean | undefined;
  template_type?: EmailTemplateType;
  locale?: string;
  account_id?: string;
  enabled?: boolean;
}

/**
 * Request for rendering an email template.
 */
export interface EmailTemplateRenderRequest {
  template_type: EmailTemplateType;
  locale: string;
  variables: Record<string, any>;
  account_id?: string;
  subject?: string;
  html_body?: string;
  text_body?: string;
}

/**
 * Response from rendering an email template.
 */
export interface EmailTemplateRenderResponse {
  subject: string;
  html_body: string;
  text_body: string;
}

/**
 * Email log interface.
 */
export interface EmailLog {
  id: string;
  account_id: string;
  template_type: EmailTemplateType;
  recipient_email: string;
  status: 'sent' | 'failed' | 'pending';
  provider: string;
  error_message?: string | null;
  variables?: Record<string, string> | null;
  sent_at: string;
}

/**
 * Filters for listing email logs.
 */
export interface EmailLogFilters {
  [key: string]: string | number | boolean | undefined;
  status_filter?: string;
  template_type?: EmailTemplateType;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * Paginated response for email logs.
 */
export interface EmailLogListResponse {
  logs: EmailLog[];
  total: number;
  page: number;
  page_size: number;
}
