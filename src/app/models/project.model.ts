/**
 * Represents a portfolio project
 */
export interface Project {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly github?: string;
  readonly demo?: string;
  readonly featured?: boolean;
}
