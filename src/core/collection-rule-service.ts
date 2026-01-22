import { HttpClient } from './http-client';
import {
  CollectionRule,
  CollectionRuleUpdate,
  RuleValidationResult,
  RuleTestResult,
} from '../types/role';

/**
 * Service for managing collection-level access rules and field permissions.
 * Requires superadmin authentication.
 */
export class CollectionRuleService {
  constructor(private http: HttpClient) {}

  /**
   * Get access rules and field permissions for a specific collection.
   */
  async get(collectionName: string): Promise<CollectionRule> {
    const response = await this.http.get<CollectionRule>(
      `/api/v1/collections/${collectionName}/rules`
    );
    return response.data;
  }

  /**
   * Update access rules and field permissions for a specific collection.
   */
  async update(
    collectionName: string,
    data: CollectionRuleUpdate
  ): Promise<CollectionRule> {
    const response = await this.http.put<CollectionRule>(
      `/api/v1/collections/${collectionName}/rules`,
      data
    );
    return response.data;
  }

  /**
   * Validate a rule expression against a collection schema.
   */
  async validateRule(
    rule: string,
    operation: 'list' | 'view' | 'create' | 'update' | 'delete',
    collectionFields: string[]
  ): Promise<RuleValidationResult> {
    const response = await this.http.post<RuleValidationResult>(
      '/api/v1/rules/validate',
      {
        rule,
        operation,
        collectionFields,
      }
    );
    return response.data;
  }

  /**
   * Test a rule evaluation with a sample context.
   */
  async testRule(rule: string, context: any): Promise<RuleTestResult> {
    const response = await this.http.post<RuleTestResult>('/api/v1/rules/test', {
      rule,
      context,
    });
    return response.data;
  }
}
