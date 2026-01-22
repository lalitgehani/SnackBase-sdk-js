export interface Macro {
  id: string;
  name: string;
  description: string;
  sql_query: string;
  parameters: string[];
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface MacroCreate {
  name: string;
  description: string;
  sql_query: string;
  parameters: string[];
}

export interface MacroUpdate {
  name?: string;
  description?: string;
  sql_query?: string;
  parameters?: string[];
}

export interface MacroTestResult {
  success: boolean;
  result: any;
}

export interface MacroListResponse {
  items: Macro[];
  total: number;
}
