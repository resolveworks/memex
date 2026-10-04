import { DEEPSEEK_API_KEY } from '$app/env/private';
import { createModels, defaultProviderAuthContext } from '@earendil-works/pi-ai';
import { deepseekProvider } from '@earendil-works/pi-ai/providers/deepseek';

// pi-ai resolves provider credentials through an injected AuthContext. DeepSeek's
// only credential is an API key, which SvelteKit exposes as an explicit env variable.
export const models = createModels({
	authContext: {
		...defaultProviderAuthContext(),
		env: () => Promise.resolve(DEEPSEEK_API_KEY)
	}
});

models.setProvider(deepseekProvider());
