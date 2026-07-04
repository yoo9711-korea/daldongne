import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var __openai__: OpenAI | undefined;
}

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  if (!global.__openai__) {
    global.__openai__ = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return global.__openai__;
}