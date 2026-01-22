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
  subject_override?: string;
  html_body_override?: string;
  text_body_override?: string;
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
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  provider: string;
  error?: string;
  sent_at: string;
  metadata?: Record<string, any>;
}

/**
 * Filters for listing email logs.
 */
export interface EmailLogFilters {
  [key: string]: string | number | boolean | undefined;
  status?: string;
  template_type?: EmailTemplateType;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated response for email logs.
 */
export interface EmailLogListResponse {
  data: EmailLog[];
  total: number;
  page: number;
  limit: number;
  last_page: number;
}
