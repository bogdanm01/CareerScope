export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export interface ApiSuccessResponse<TData = unknown> {
  success: true;
  message?: string;
  data: TData;
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

export const successResponse = <TData>(data: TData, message?: string): ApiSuccessResponse<TData> => ({
  success: true,
  message,
  data,
});
