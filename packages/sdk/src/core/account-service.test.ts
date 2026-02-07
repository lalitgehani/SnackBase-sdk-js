import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountService } from './account-service';
import { HttpClient } from './http-client';
import { Account, AccountListResponse } from '../types/account';
import { UserListResponse } from '../types/auth';

describe('AccountService', () => {
  let httpClient: HttpClient;
  let accountService: AccountService;

  const mockAccount: Account = {
    id: 'acc-1',
    slug: 'test-acc',
    name: 'Test Account',
    created_at: new Date().toISOString(),
  };

  const mockUserListResponse: UserListResponse = {
    items: [
      {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
        groups: [],
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: null,
      }
    ],
    total: 1,
  };

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: 'https://api.example.com' });
    accountService = new AccountService(httpClient);
  });

  describe('list', () => {
    it('should fetch paginated accounts', async () => {
      const mockResponse: AccountListResponse = {
        items: [mockAccount],
        total: 1,
      };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const params = { page: 1, page_size: 10, search: 'test' };
      const result = await accountService.list(params);

      expect(getSpy).toHaveBeenCalledWith('/api/v1/accounts', { params });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('get', () => {
    it('should fetch account details', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockAccount,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await accountService.get('acc-1');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/accounts/acc-1');
      expect(result).toEqual(mockAccount);
    });
  });

  describe('create', () => {
    it('should create a new account', async () => {
      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
        data: mockAccount,
        status: 201,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { name: 'New Account', slug: 'new-acc' };
      const result = await accountService.create(data);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/accounts', data);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('should update an existing account', async () => {
      const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({
        data: { ...mockAccount, name: 'Updated Name' },
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const data = { name: 'Updated Name' };
      const result = await accountService.update('acc-1', data);

      expect(patchSpy).toHaveBeenCalledWith('/api/v1/accounts/acc-1', data);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete an account', async () => {
      const deleteSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({
        data: {},
        status: 204,
        headers: new Headers(),
        request: {} as any,
      });

      const result = await accountService.delete('acc-1');

      expect(deleteSpy).toHaveBeenCalledWith('/api/v1/accounts/acc-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getUsers', () => {
    it('should fetch account users', async () => {
      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
        data: mockUserListResponse,
        status: 200,
        headers: new Headers(),
        request: {} as any,
      });

      const params = { page: 1, page_size: 5 };
      const result = await accountService.getUsers('acc-1', params);

      expect(getSpy).toHaveBeenCalledWith('/api/v1/accounts/acc-1/users', { params });
      expect(result).toEqual(mockUserListResponse);
    });
  });
});
