import { HttpClient } from './http-client';
import { 
  Invitation, 
  InvitationCreate, 
  InvitationListParams 
} from '../types/invitation';
import { AuthResponse } from '../types/auth';

/**
 * Service for managing user invitations.
 * Allows admins to invite users and tracks invitation status.
 */
export class InvitationService {
  constructor(private http: HttpClient) {}

  /**
   * List all invitations in the current account.
   */
  async list(params?: InvitationListParams): Promise<Invitation[]> {
    const response = await this.http.get<Invitation[]>('/api/v1/invitations', {
      params,
    });
    return response.data;
  }

  /**
   * Create a new invitation for a user.
   */
  async create(data: InvitationCreate): Promise<Invitation> {
    const response = await this.http.post<Invitation>('/api/v1/invitations', data);
    return response.data;
  }

  /**
   * Resend an invitation email.
   */
  async resend(invitationId: string): Promise<{ success: boolean }> {
    await this.http.post(`/api/v1/invitations/${invitationId}/resend`, {});
    return { success: true };
  }

  /**
   * Get public details of an invitation using a token.
   * No authentication required.
   */
  async getPublic(token: string): Promise<Invitation> {
    const response = await this.http.get<Invitation>(`/api/v1/invitations/public/${token}`);
    return response.data;
  }

  /**
   * Accept an invitation using a token and password.
   * Creates the user account and returns authentication tokens.
   */
  async accept(token: string, password: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>(`/api/v1/invitations/accept/${token}`, {
      password,
    });
    return response.data;
  }

  /**
   * Cancel a pending invitation.
   */
  async cancel(invitationId: string): Promise<{ success: boolean }> {
    await this.http.delete(`/api/v1/invitations/${invitationId}`);
    return { success: true };
  }
}
