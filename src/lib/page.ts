/** Size of one page returned by the list tools and the paged API routes. */
export const PAGE_SIZE = 50;

export interface Page<T> {
	items: T[];
	hasMore: boolean;
}
