import type { ChatRequestBody, ChatResponseBody, Topic } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export const tutorApi = {
  async getTopics(): Promise<Topic[]> {
    const res = await fetch(`${API_BASE_URL}/tutor/topics`);
    return handleResponse<Topic[]>(res);
  },

  async chat(payload: ChatRequestBody): Promise<ChatResponseBody> {
    const res = await fetch(`${API_BASE_URL}/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<ChatResponseBody>(res);
  }
};

export { ApiError };
