export const DEFAULT_CHAT_MODEL: string = 'gpt-4.1';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Modelo principal para chats de propósito general',
  },
  {
    id: 'o4-mini',
    name: 'o4-mini (razonamiento)',
    description: 'Modelo de razonamiento avanzado',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Modelo GPT-4.1 Mini de OpenAI',
  },
];
