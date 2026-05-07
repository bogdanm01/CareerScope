export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type PaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};

export interface ApiSuccessResponse<TData = unknown> {
  success: true;
  message?: string;
  data: TData;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse<TError = ApiErrorDetail[]> {
  success: false;
  message: string;
  code?: string;
  errors?: TError;
}

export type ApiResponse<TData = unknown, TError = ApiErrorDetail[]> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse<TError>;

export type PaginatedResult<TData> = {
  data: TData[];
  pagination: PaginationMeta;
};

export const successResponse = <TData>(
  data: TData,
  message?: string,
  pagination?: PaginationMeta,
): ApiSuccessResponse<TData> => ({
  success: true,
  message,
  data,
  pagination,
});
