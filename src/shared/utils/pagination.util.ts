export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PaginationUtil {
  static createOptions(page?: number, limit?: number): PaginationOptions {
    return {
      page: Math.max(parseInt(String(page)) || 1, 1),
      limit: Math.min(Math.max(parseInt(String(limit)) || 10, 1), 100),
    };
  }

  static createResult<T>(data: T[], total: number, options: PaginationOptions): PaginatedResult<T> {
    const totalPages = Math.ceil(total / options.limit);
    return {
      data,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1,
      },
    };
  }

  static getSkip(options: PaginationOptions): number {
    return (options.page - 1) * options.limit;
  }
}
