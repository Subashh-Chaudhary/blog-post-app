export interface IPaginatedType<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
