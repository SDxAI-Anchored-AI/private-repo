import { PromisePool } from '@supercharge/promise-pool';
import { apiAsync } from '~/modules/trpc/trpc.client';
import { prodiaDefaultModelId } from '~/modules/prodia/prodia.models';
import { useProdiaStore } from '~/modules/prodia/store-prodia';

import { useChatStore } from '~/common/state/store-chats';

import { createAssistantTypingMessage } from './editors';
import { ChatGenerateSchema } from '~/modules/llms/openai/openai.router';
import { SourceSetupOpenAI, normalizeOAISetup } from '~/modules/llms/openai/openai.vendor';
import { findLLMOrThrow } from '~/modules/llms/store-llms';

/**
 * The main 'image generation' function - for now specialized to the 'imagine' command.
 */
export async function runImageGenerationUpdatingState(conversationId: string, imageText: string) {
  // create a blank and 'typing' message for the assistant
  const assistantMessageId = createAssistantTypingMessage(
    conversationId,
    'prodia',
    undefined,
    `Give me a few seconds while I draw ${imageText?.length > 20 ? 'that' : '"' + imageText + '"'}...`,
  );

  // reference the state editing functions
  const { editMessage } = useChatStore.getState();

  try {
    const {
      prodiaApiKey: prodiaKey,
      prodiaModelId,
      prodiaNegativePrompt: negativePrompt,
      prodiaSteps: steps,
      prodiaCfgScale: cfgScale,
      prodiaSeed: seed,
    } = useProdiaStore.getState();

    const { imageUrl } = await apiAsync.prodia.imagine.query({
      ...(!!prodiaKey && { prodiaKey }),
      prodiaModel: prodiaModelId || prodiaDefaultModelId,
      prompt: imageText,
      ...(!!negativePrompt && { negativePrompt }),
      ...(!!steps && { steps }),
      ...(!!cfgScale && { cfgScale }),
      ...(!!seed && { seed }),
    });

    // NOTE: imagineResponse shall have an altText which contains some description we could show on mouse hover
    //       Would be hard to do it with the current plain-text URL tho - shall consider changing the workaround format
    editMessage(conversationId, assistantMessageId, { text: imageUrl, typing: false }, false);
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    editMessage(conversationId, assistantMessageId, { text: `Sorry, I couldn't create an image for you. ${errorMessage}`, typing: false }, false);
  }
}

/**
 * The main 'image generation' function - for now specialized to the 'imagine' command.
 */
export async function runGroundedImageGenerationUpdatingState(conversationId: string, imageText: string, messageProps?: unknown) {
  // create a blank and 'typing' message for the assistant
  const assistantMessageId = createAssistantTypingMessage(
    conversationId,
    'stable-diffusion',
    undefined,
    `Give me a few seconds while I draw ${imageText?.length > 20 ? 'that' : '"' + imageText + '"'}...`,
  );

  // reference the state editing functions
  const { editMessage } = useChatStore.getState();

  try {
    const step1String = await fetch('/api/python/llm-grounded-diffusion-step-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imageText }),
    }).then((res) => {
      return res.text();
    });

    // remove first and last chaacter
    const step1Result = step1String?.slice(1, -1);

    // if (!step1Result) {
    //   editMessage(conversationId, assistantMessageId, { text: 'Error', typing: false }, false);
    //   throw new Error('No result from step 1');
    // }

    const llm = findLLMOrThrow('openai-gpt-4');
    const oaiSetup: Partial<SourceSetupOpenAI> = llm._source.setup as Partial<SourceSetupOpenAI>;

    const input: ChatGenerateSchema = {
      access: normalizeOAISetup(oaiSetup),
      model: {
        id: 'gpt-4',
        temperature: 0,
        maxTokens: 1024,
      },
      history: [{ role: 'user', content: step1Result }],
    };

    const gpt4response = await fetch('/api/llms/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then((res) => {
      return res.json();
    });

    const step2Result = gpt4response?.choices?.[0]?.message?.content;
    const fullPrompt = `Caption: ${imageText} Objects: ${step2Result}`.replace('\\n', '');

    const promises = [];

    promises.push({
      name: 'layout',
      promise: fetch('/api/python/llm-grounded-diffusion-visualize-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      }).then((res) => {
        return res.json();
      }),
    });

    if (typeof messageProps === 'object' && Object.keys(messageProps || {}).length > 0) {
      promises.push({
        name: 'groundedImage',
        promise: fetch('/api/python/llm-grounded-diffusion-layout-to-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, ...messageProps }),
        }).then((res) => {
          return res.json();
        }),
      });
    } else {
      promises.push({
        name: 'groundedImage',
        promise: fetch('/api/python/llm-grounded-diffusion-layout-to-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt }),
        }).then((res) => {
          return res.json();
        }),
      });
    }

    promises.push({
      name: 'baseline',
      promise: fetch('/api/python/llm-grounded-diffusion-baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imageText }),
      }).then((res) => {
        return res.json();
      }),
    });

    const { results, errors } = await PromisePool.for(promises).process(async (p, index, pool) => {
      const { name, promise } = p;

      const res = await promise;

      return { name, response: res };
    });

    const baseLineIndex = results.findIndex((r) => r.name === 'baseline');
    const layoutIndex = results.findIndex((r) => r.name === 'layout');
    const groundedImageIndex = results.findIndex((r) => r.name === 'groundedImage');

    if (baseLineIndex === -1 && layoutIndex === -1 && groundedImageIndex === -1) {
      editMessage(conversationId, assistantMessageId, { text: `Sorry, I couldn't create an image for you.`, typing: false }, false);
    } else {
      let finalMessage = '';
      if (baseLineIndex > -1) {
        // const baselineFileUploadRes = await fetch('/api/llms/upload-image', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     base64: results?.[baseLineIndex]?.response, // base64 image data
        //     name: 'baseline',
        //   }),
        // }).then((res) => {
        //   return res.json();
        // });

        // console.log('baselineFileUploadRes', baselineFileUploadRes);
        // we can also upload the files to local storage if they are too big
        finalMessage += `Stable Diffusion Baseline:\n<base64start>${results?.[baseLineIndex]?.response}<base64end>\n`;
      }
      if (layoutIndex > -1) {
        // const layoutImgFileUploadRes = await fetch('/api/llms/upload-image', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     base64: results?.[layoutIndex]?.response, // base64 image data
        //     name: 'layout-to-image',
        //   }),
        // }).then((res) => {
        //   return res.json();
        // });
        // console.log('layoutImgFileUploadRes', layoutImgFileUploadRes);
        finalMessage += `Grounded Layout:\n<base64start>${results?.[layoutIndex]?.response}<base64end>\n`;
      }
      if (groundedImageIndex > -1) {
        // const groundedImgFileUploadRes = await fetch('/api/llms/upload-image', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     base64: results?.[groundedImageIndex]?.response, // base64 image data
        //     name: 'layout-to-image',
        //   }),
        // }).then((res) => {
        //   return res.json();
        // });
        // console.log('groundedImgFileUploadRes', groundedImgFileUploadRes);
        finalMessage += `Grounded Stable Diffusion Image:\n<base64start>${results?.[groundedImageIndex]?.response}<base64end>`;
      }
      editMessage(conversationId, assistantMessageId, { text: finalMessage, typing: false }, false);
      return;
    }
  } catch (error: any) {
    console.log('error', error);
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    editMessage(conversationId, assistantMessageId, { text: `Sorry, I couldn't create an image for you. ${errorMessage}`, typing: false }, false);
  }
}
