import { createOpenAI } from "npm:@ai-sdk/openai";
import { type ModelMessage, streamText } from "npm:ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
} from "./run-id.ts";

export function createResponsesCall(
  request: Request,
  config: { baseURL: string; apiKey: string; model: string },
  messages: ModelMessage[],
  instructions?: string,
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(
    getLovableAiGatewayRunId(request),
  );
  const provider = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: {
      "Lovable-API-Key": config.apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(config.model),
    instructions,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return {
    result,
    responseHeaders: async (init?: HeadersInit) => {
      const headers = new Headers(init);
      const runId = await runIdFetch.waitForRunId();
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      return getLovableAiGatewayResponseHeaders(undefined, headers);
    },
  };
}
