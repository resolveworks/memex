import { env } from "$env/dynamic/private";
import { createModels, defaultProviderAuthContext } from "@earendil-works/pi-ai";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";

// pi-ai resolves provider credentials through an injected AuthContext. Point its
// env lookups at SvelteKit's runtime env so `.env` works in dev and `process.env`
// works in a production node build.
export const models = createModels({
	authContext: {
		...defaultProviderAuthContext(),
		env: (name) => Promise.resolve(env[name]),
	},
});

models.setProvider(deepseekProvider());
