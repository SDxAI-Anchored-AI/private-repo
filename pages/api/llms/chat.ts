import { NextRequest, NextResponse } from 'next/server';
import { chatGenerateSchema, openAIAccess, openAIChatCompletionPayload } from '~/modules/llms/openai/openai.router';

async function throwOpenAINotOkay(response: Response) {
  if (!response.ok) {
    let errorPayload: object | null = null;
    try {
      errorPayload = await response.json();
    } catch (e) {
      // ignore
    }
    throw new Error(`${response.status} · ${response.statusText}${errorPayload ? ' · ' + JSON.stringify(errorPayload) : ''}`);
  }
}

export default async function handler(req: NextRequest): Promise<Response> {
  // inputs - reuse the tRPC schema
  const { access, model, history } = chatGenerateSchema.parse(await req.json());

  // begin event streaming from the OpenAI API
  let upstreamResponse: Response;
  try {
    // prepare the API request data
    const { headers, url } = openAIAccess(access, '/v1/chat/completions');
    const body = openAIChatCompletionPayload(model, history, null, 1, false);

    // POST to the API
    upstreamResponse = await fetch(url, { headers, method: 'POST', body: JSON.stringify(body) });
    await throwOpenAINotOkay(upstreamResponse);
  } catch (error: any) {
    const fetchOrVendorError = (error?.message || typeof error === 'string' ? error : JSON.stringify(error)) + (error?.cause ? ' · ' + error.cause : '');
    console.log(`/api/llms/chat: fetch issue: ${fetchOrVendorError}`);
    return new NextResponse('[OpenAI Issue] ' + fetchOrVendorError, { status: 500 });
  }

  /* The following code is heavily inspired by the Vercel AI SDK, but simplified to our needs and in full control.
   * This replaces the former (custom) implementation that used to return a ReadableStream directly, and upon start,
   * it was blindly fetching the upstream response and piping it to the client.
   *
   * We now use backpressure, as explained on: https://sdk.vercel.ai/docs/concepts/backpressure-and-cancellation
   *
   * NOTE: we have not benchmarked to see if there is performance impact by using this approach - we do want to have
   * a 'healthy' level of inventory (i.e., pre-buffering) on the pipe to the client.
   */
  const chatResponse = upstreamResponse.body;

  return new NextResponse(chatResponse, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

// noinspection JSUnusedGlobalSymbols
export const runtime = 'edge';
