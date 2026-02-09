// User types
export * from './user.js';

// Project types
export * from './project.js';

// Lyrics types
export * from './lyrics.js';

// Video configuration types
export * from './config.js';

// Export types
export * from './export.js';

// Template types
export * from './template.js';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
