import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";

// Memories live under their own namespace so they cannot collide with other localStorage keys.
const KEY_PREFIX = "memex:";

const storeParameters = Type.Object({
	key: Type.String(),
	value: Type.String(),
});

export const store: AgentTool<typeof storeParameters> = {
	name: "store",
	label: "Store",
	description:
		"Save a piece of information under a key. Use this whenever the user asks you to remember something.",
	parameters: storeParameters,
	execute: async (_toolCallId, { key, value }) => {
		localStorage.setItem(KEY_PREFIX + key, value);
		return {
			content: [{ type: "text", text: `Stored "${key}".` }],
			details: undefined,
		};
	},
};

const retrieveParameters = Type.Object({
	key: Type.String(),
});

export const retrieve: AgentTool<typeof retrieveParameters> = {
	name: "retrieve",
	label: "Retrieve",
	description:
		"Look up a piece of information by its key. Use this whenever the user asks you to recall something they told you to remember.",
	parameters: retrieveParameters,
	execute: async (_toolCallId, { key }) => {
		const value = localStorage.getItem(KEY_PREFIX + key);
		if (value === null) {
			throw new Error(`Nothing is stored under the key "${key}".`);
		}
		return {
			content: [{ type: "text", text: value }],
			details: undefined,
		};
	},
};
