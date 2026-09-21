import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { ProxyAssistantMessageEvent } from "@earendil-works/pi-agent-core";
import type {
	AssistantMessage,
	AssistantMessageEvent,
	Context,
	SimpleStreamOptions,
} from "@earendil-works/pi-ai";
import { contentText } from "@earendil-works/pi-ai";
import { model } from "$lib/model";
import { memexId } from "$lib/server/auth";
import { promptSection, total as totalRequests } from "$lib/server/requests";
import { total as totalMemories } from "$lib/server/storage";
import { models } from "$lib/server/llm";

function contentAt(partial: AssistantMessage, index: number) {
	const content = partial.content[index];
	if (!content) throw new Error(`Stream event has no content at index ${index}`);
	return content;
}

function toProxyEvent(event: AssistantMessageEvent): ProxyAssistantMessageEvent {
	switch (event.type) {
		case "start":
			return { type: "start" };
		case "text_start":
			return { type: "text_start", contentIndex: event.contentIndex };
		case "text_delta":
			return { type: "text_delta", contentIndex: event.contentIndex, delta: event.delta };
		case "text_end": {
			const content = contentAt(event.partial, event.contentIndex);
			if (content.type !== "text") throw new Error("text_end for non-text content");
			return {
				type: "text_end",
				contentIndex: event.contentIndex,
				contentSignature: content.textSignature,
			};
		}
		case "thinking_start":
			return { type: "thinking_start", contentIndex: event.contentIndex };
		case "thinking_delta":
			return { type: "thinking_delta", contentIndex: event.contentIndex, delta: event.delta };
		case "thinking_end": {
			const content = contentAt(event.partial, event.contentIndex);
			if (content.type !== "thinking") throw new Error("thinking_end for non-thinking content");
			return {
				type: "thinking_end",
				contentIndex: event.contentIndex,
				contentSignature: content.thinkingSignature,
			};
		}
		case "toolcall_start": {
			const content = contentAt(event.partial, event.contentIndex);
			if (content.type !== "toolCall") throw new Error("toolcall_start for non-toolCall content");
			return {
				type: "toolcall_start",
				contentIndex: event.contentIndex,
				id: content.id,
				toolName: content.name,
			};
		}
		case "toolcall_delta":
			return { type: "toolcall_delta", contentIndex: event.contentIndex, delta: event.delta };
		case "toolcall_end":
			return { type: "toolcall_end", contentIndex: event.contentIndex, toolCall: event.toolCall };
		case "done": {
			const { stopReason, usage, providerThinkingLevel } = event.message;
			if (stopReason !== "stop" && stopReason !== "length" && stopReason !== "toolUse") {
				throw new Error(`Unsupported done stop reason for proxy stream: ${stopReason}`);
			}
			return { type: "done", reason: stopReason, usage, providerThinkingLevel };
		}
		case "error": {
			const { usage, providerThinkingLevel, errorMessage } = event.error;
			return { type: "error", reason: event.reason, errorMessage, usage, providerThinkingLevel };
		}
	}
}

interface StreamRequest {
	context: Context;
	options?: SimpleStreamOptions;
}

function wordCount(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}

/** Rejects a context that exceeds the server's abuse limits before any spend happens. */
function exceedsLimits(context: Context): Response | undefined {
	const userMessages = context.messages.filter((message) => message.role === "user");
	const maxMessages = Number(env.MAX_USER_MESSAGES);
	const maxWords = Number(env.MAX_MESSAGE_WORDS);
	if (userMessages.length > maxMessages) {
		return json(
			{ error: `A chat can hold at most ${maxMessages} messages.` },
			{ status: 429 }
		);
	}
	for (const message of userMessages) {
		if (wordCount(contentText(message.content)) > maxWords) {
			return json(
				{ error: `A message can hold at most ${maxWords} words.` },
				{ status: 413 }
			);
		}
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const memex = memexId(request);
	let body: StreamRequest;
	try {
		body = (await request.json()) as StreamRequest;
	} catch {
		return json({ error: "Request body must be valid JSON" }, { status: 400 });
	}

	const rejected = exceedsLimits(body.context);
	if (rejected) return rejected;

	const context: Context = {
		...body.context,
		systemPrompt: `${body.context.systemPrompt ?? ""}\n\nThis memex holds ${totalMemories(memex)} memories and ${totalRequests(memex)} open requests.\n\n${promptSection(memex)}`,
	};
	const events = models.streamSimple(model, context, body.options);
	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			for await (const event of events) {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(toProxyEvent(event))}\n\n`));
			}
			controller.close();
		},
	});

	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache",
		},
	});
};
