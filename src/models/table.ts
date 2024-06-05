export interface PaginationOffsetLimit {
    offset: number;
    limit: number;
    total?: number;
}

export const PAGINATION_OFFSET_LIMIT_INITIAL_VALUE: PaginationOffsetLimit = {
    offset: 0,
    limit: 20,
};

export interface PaginationPage {
    currentPage: number;
    totalPages: number;
}
