import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ChatMessage from './ChatMessage.svelte';

// Vitest runs without globals, so testing-library's automatic cleanup never registers.
afterEach(cleanup);

describe('ChatMessage', () => {
	it('renders assistant markdown as HTML', () => {
		render(ChatMessage, { kind: 'assistant', text: 'some **bold** claim' });

		expect(screen.getByText('bold').tagName).toBe('STRONG');
	});

	it('escapes raw HTML in assistant text', () => {
		render(ChatMessage, { kind: 'assistant', text: 'hello <script>alert(1)</script>' });

		expect(document.querySelector('script')).toBeNull();
		expect(screen.getByText('hello <script>alert(1)</script>')).toBeInTheDocument();
	});

	it('renders the tool name with argument values joined by ·', () => {
		const { container } = render(ChatMessage, {
			kind: 'tool',
			name: 'search',
			args: [
				{ key: 'query', value: 'red fish' },
				{ key: 'limit', value: '5' }
			]
		});

		expect(screen.getByText('search')).toBeInTheDocument();
		expect(container.querySelector('.tool-args')).toHaveTextContent('red fish·5');
	});

	it('announces error items as alerts', () => {
		render(ChatMessage, { kind: 'error', text: 'the model failed' });

		expect(screen.getByRole('alert')).toHaveTextContent('the model failed');
	});

	it('renders user items as plain text', () => {
		const { container } = render(ChatMessage, {
			kind: 'user',
			text: '**not markdown** <b>not bold</b>'
		});

		expect(screen.getByText('**not markdown** <b>not bold</b>')).toBeInTheDocument();
		expect(container.querySelector('b, strong, em')).toBeNull();
	});
});
