import axios from 'axios'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

/** 빠른 무료 티어 모델 (Groq) */
export const GROQ_MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `당신은 AeroCast 앱에 내장된 범용 AI 도우미입니다.
- 기본적으로 한국어로 자연스럽고 친절하게 답하세요.
- 날씨·일상·추천·설명·코딩 등 일반적인 질문에 모두 답할 수 있습니다.
- 실시간 수치(기온, 뉴스 등)를 모르는 경우 추측하지 말고, 모른다고 말한 뒤 가능한 일반 조언을 주세요.
- 답변은 필요 이상으로 길지 않게 유지하세요.`

/**
 * Groq Chat Completions 호출
 * @param {{ apiKey: string, messages: Array<{role: string, content: string}>, model?: string }} opts
 */
export async function chatWithGroq({ apiKey, messages, model = GROQ_MODEL }) {
  if (!apiKey) {
    throw new Error('Groq API 키가 없습니다. .env에 VITE_GROQ_API_KEY를 넣거나 설정에서 입력하세요.')
  }

  const { data } = await axios.post(
    GROQ_URL,
    {
      model,
      temperature: 0.6,
      max_tokens: 600,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    },
  )

  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('모델 응답이 비어 있습니다.')
  return text
}

export function getEnvGroqKey() {
  return String(import.meta.env.VITE_GROQ_API_KEY || '').trim()
}
