<script lang="ts">
	import { marked, type MarkedToken, type Token } from 'marked';

	let { text }: { text: string } = $props();

	const tokens = $derived(marked.lexer(text));

	// `Token` also covers `Generic` tokens from custom extensions, which would
	// make every `tokens` property optional. We register no extensions, so this
	// narrows to the built-in token matching `type`.
	function isToken<T extends MarkedToken['type']>(
		token: Token,
		type: T
	): token is Extract<MarkedToken, { type: T }> {
		return token.type === type;
	}

	// Link and image destinations come from the model, so only well-known safe
	// schemes are allowed through; anything else renders without a resource.
	function safeHref(href: string): string | undefined {
		const url = href.trim();
		return /^(https?:|mailto:)/i.test(url) ? url : undefined;
	}
</script>

{#snippet inline(tokens: Token[])}
	{#each tokens as token, i (i)}
		{#if isToken(token, 'text') || isToken(token, 'escape')}
			{token.text}
		{:else if isToken(token, 'strong')}
			<strong>{@render inline(token.tokens)}</strong>
		{:else if isToken(token, 'em')}
			<em>{@render inline(token.tokens)}</em>
		{:else if isToken(token, 'del')}
			<del>{@render inline(token.tokens)}</del>
		{:else if isToken(token, 'codespan')}
			<code>{token.text}</code>
		{:else if isToken(token, 'br')}
			<br />
		{:else if isToken(token, 'link')}
			<a href={safeHref(token.href)} rel="external">{@render inline(token.tokens)}</a>
		{:else if isToken(token, 'image')}
			<img src={safeHref(token.href)} alt={token.text} />
		{/if}
	{/each}
{/snippet}

{#snippet blocks(tokens: Token[])}
	{#each tokens as token, i (i)}
		{#if isToken(token, 'paragraph')}
			<p>{@render inline(token.tokens)}</p>
		{:else if isToken(token, 'heading')}
			<svelte:element this={`h${token.depth}`}>{@render inline(token.tokens)}</svelte:element>
		{:else if isToken(token, 'list')}
			<svelte:element this={token.ordered ? 'ol' : 'ul'}>
				{#each token.items as item, j (j)}
					<li>{@render blocks(item.tokens)}</li>
				{/each}
			</svelte:element>
		{:else if isToken(token, 'blockquote')}
			<blockquote>{@render blocks(token.tokens)}</blockquote>
		{:else if isToken(token, 'code')}
			<pre><code>{token.text}</code></pre>
		{:else if isToken(token, 'checkbox')}
			<input type="checkbox" checked={token.checked} disabled />
		{:else if isToken(token, 'hr')}
			<hr />
		{:else if isToken(token, 'table')}
			<table>
				<thead>
					<tr>
						{#each token.header as cell, j (j)}
							<th>{@render inline(cell.tokens)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each token.rows as row, j (j)}
						<tr>
							{#each row as cell, k (k)}
								<td>{@render inline(cell.tokens)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{:else if isToken(token, 'text')}
			{#if token.tokens}
				{@render inline(token.tokens)}
			{:else}
				{token.text}
			{/if}
		{/if}
	{/each}
{/snippet}

{@render blocks(tokens)}
