/**
 * Todos service
 * Handles all todo CRUD operations
 */

import { snackbase } from '@/lib/snackbase';
import type { Todo, TodoInput, TodosResponse } from '@/types';

export interface GetTodosParams {
  skip?: number;
  limit?: number;
  sort?: string;
  completed?: boolean;
}

/**
 * Get all todos with optional filtering
 */
export const getTodos = async (params?: GetTodosParams): Promise<TodosResponse> => {
  const response = await snackbase.records.list<Todo>('todos', {
    skip: params?.skip,
    limit: params?.limit,
    sort: params?.sort,
    filter: params?.completed !== undefined ? `completed='${params.completed}'` : undefined,
  });
  
  return {
    items: response.items,
    total: response.total,
    skip: response.skip,
    limit: response.limit,
  };
};

/**
 * Get a single todo by ID
 */
export const getTodo = async (id: string): Promise<Todo> => {
  return await snackbase.records.get<Todo>('todos', id);
};

/**
 * Create a new todo
 */
export const createTodo = async (data: TodoInput): Promise<Todo> => {
  return await snackbase.records.create<Todo>('todos', data as any);
};

/**
 * Update a todo (partial update using PATCH)
 */
export const updateTodo = async (id: string, data: Partial<TodoInput>): Promise<Todo> => {
  return await snackbase.records.patch<Todo>('todos', id, data as any);
};

/**
 * Delete a todo
 */
export const deleteTodo = async (id: string): Promise<void> => {
  await snackbase.records.delete('todos', id);
};

/**
 * Toggle todo completion status
 */
export const toggleTodoComplete = async (id: string, completed: boolean): Promise<Todo> => {
  return updateTodo(id, { completed });
};
