import { createModels } from "@earendil-works/pi-ai";
import { deepseekProvider } from "@earendil-works/pi-ai/providers/deepseek";

const models = createModels();
models.setProvider(deepseekProvider());

export const model = models.getModel("deepseek", "deepseek-v4-flash");
if (!model) throw new Error("Model deepseek/deepseek-v4-flash not found in pi-ai catalog");
