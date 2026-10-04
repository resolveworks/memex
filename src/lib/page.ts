/** Size of one page returned by the list tools, the paged API routes and the contents view. */
export const PAGE_SIZE = 10;

export interface Page<T> {
	items: T[];
	hasMore: boolean;
}
