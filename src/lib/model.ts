import { createModels } from "@earendil-works/pi-ai";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";

const models = createModels();
models.setProvider(deepseekProvider());

const resolved = models.getModel("deepseek", "deepseek-v4-flash");
if (!resolved) throw new Error("Model deepseek/deepseek-v4-flash not found in pi-ai catalog");

export const model = resolved;
