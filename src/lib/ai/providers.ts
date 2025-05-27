import { openai } from '@ai-sdk/openai';
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';

export const myProvider = customProvider({
      languageModels: {
        'gpt-4.1': openai('gpt-4.1'),
        'o4-mini': wrapLanguageModel({
          model: openai('o4-mini'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'gpt-4.1-mini': openai('gpt-4.1-mini'),
      },
      imageModels: {
        'image-model': openai.image('gpt-4.1'),
      },
    });
