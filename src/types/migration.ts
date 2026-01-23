/**
 * Migration-related type definitions.
 */

/**
 * Represents a single migration revision.
 */
export interface MigrationRevision {
  /** The revision identifier (e.g., "001_abc123") */
  revision: string;
  /** Human-readable description of the migration */
  description: string;
  /** Whether this revision has been applied to the database */
  isApplied: boolean;
  /** Whether this is a dynamic collection migration */
  isDynamic: boolean;
}

/**
 * Response from listing all migrations.
 */
export interface MigrationListResponse {
  /** All available migration revisions */
  revisions: MigrationRevision[];
  /** Total number of revisions */
  total: number;
  /** The currently applied revision (if any) */
  currentRevision: string | null;
}

/**
 * Response from getting the current migration.
 */
export interface CurrentRevisionResponse {
  /** The current revision identifier */
  revision: string;
  /** Human-readable description of the migration */
  description: string;
  /** Timestamp when this revision was applied */
  appliedAt: string;
  /** Whether this is a dynamic collection migration */
  isDynamic: boolean;
}

/**
 * A single item in the migration history.
 */
export interface MigrationHistoryItem {
  /** The revision identifier */
  revision: string;
  /** Human-readable description of the migration */
  description: string;
  /** Whether this is a dynamic collection migration */
  isDynamic: boolean;
  /** Timestamp when this revision was applied */
  createdAt: string;
}

/**
 * Response from getting migration history.
 */
export interface MigrationHistoryResponse {
  /** Applied migrations in chronological order */
  history: MigrationHistoryItem[];
  /** Total number of applied migrations */
  total: number;
}
