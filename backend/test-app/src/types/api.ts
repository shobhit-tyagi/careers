export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
};

export type ApiResponse<T> = {
    data: T;
};

export type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
};