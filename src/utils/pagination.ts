import { PaginationOffsetLimit, PaginationPage } from "@/models/table";

export const getPaginationPage = (paginationOffsetLimit: PaginationOffsetLimit): PaginationPage | undefined => {
    if (!paginationOffsetLimit.total) {
        return undefined;
    }

    const totalPages = Math.ceil(paginationOffsetLimit.total / paginationOffsetLimit.limit);
    const currentPage = Math.floor(paginationOffsetLimit.offset / paginationOffsetLimit.limit) + 1;

    return {
        currentPage,
        totalPages
    };
}