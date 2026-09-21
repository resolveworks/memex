const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });

/** Splits text into the lowercase terms used by search and term statistics. */
export function tokenize(text: string): string[] {
	return [...segmenter.segment(text.toLowerCase())]
		.filter((segment) => segment.isWordLike)
		.map((segment) => segment.segment);
}
