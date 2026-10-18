/**
 * Kanban Board TypeScript Type Definitions
 */

export type KanbanColumnId = 'APPLIED' | 'OA_TEST' | 'INTERVIEW' | 'OFFER';

export interface KanbanColumnData {
  id: KanbanColumnId;
  title: string;
  count: number;
}
