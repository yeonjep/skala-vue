<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { chatWithGroq, getEnvGroqKey, GROQ_MODEL } from '@/api/groq'

const SESSION_KEY = 'aerocast_groq_key'

const messages = ref([
  {
    role: 'assistant',
    content:
      '안녕하세요! AeroCast AI 도우미예요. 날씨뿐 아니라 일상 질문도 편하게 물어보세요.',
  },
])
const input = ref('')
const isSending = ref(false)
const errorMsg = ref('')
const showSettings = ref(false)
const localKey = ref('')
const listEl = ref(null)

const envKey = getEnvGroqKey()
const apiKey = computed(() => localKey.value.trim() || envKey)
const hasKey = computed(() => Boolean(apiKey.value))

const chatHistory = computed(() =>
  messages.value
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map(({ role, content }) => ({ role, content })),
)

async function scrollBottom() {
  await nextTick()
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

watch(messages, scrollBottom, { deep: true })

onMounted(() => {
  localKey.value = sessionStorage.getItem(SESSION_KEY) || ''
  if (!hasKey.value) showSettings.value = true
})

function saveKey() {
  const key = localKey.value.trim()
  if (key) sessionStorage.setItem(SESSION_KEY, key)
  else sessionStorage.removeItem(SESSION_KEY)
  showSettings.value = false
  errorMsg.value = ''
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || isSending.value) return
  if (!hasKey.value) {
    showSettings.value = true
    errorMsg.value = '먼저 Groq API 키를 설정해 주세요.'
    return
  }

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  isSending.value = true
  errorMsg.value = ''

  try {
    const history = chatHistory.value.slice(-12)
    const reply = await chatWithGroq({
      apiKey: apiKey.value,
      messages: history,
    })
    messages.value.push({ role: 'assistant', content: reply })
  } catch (err) {
    console.error('[Groq]', err)
    const status = err?.response?.status
    const apiErr = err?.response?.data?.error?.message
    if (status === 401) {
      errorMsg.value = 'API 키가 올바르지 않습니다. 설정을 확인해 주세요.'
      showSettings.value = true
    } else if (status === 429) {
      errorMsg.value = '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
    } else {
      errorMsg.value = apiErr || err.message || '응답을 받지 못했습니다.'
    }
  } finally {
    isSending.value = false
  }
}

function clearChat() {
  messages.value = [
    {
      role: 'assistant',
      content: '대화를 초기화했어요. 뭐든 다시 물어보세요!',
    },
  ]
  errorMsg.value = ''
}
</script>

<template>
  <div class="chat">
    <header class="chat-head">
      <div>
        <p class="chat-eyebrow">GROQ · {{ GROQ_MODEL }}</p>
        <h2>AI 챗봇</h2>
        <p class="chat-lead">날씨·일상 질문을 도와드리는 AI 도우미 · 사이드바 Tools</p>
      </div>
      <div class="chat-actions">
        <button type="button" class="ghost-btn" @click="showSettings = !showSettings">
          API 키
        </button>
        <button type="button" class="ghost-btn" @click="clearChat">초기화</button>
      </div>
    </header>

    <section v-if="showSettings" class="key-panel">
      <p class="key-panel__title">Groq API 키 설정</p>
      <ol class="key-panel__steps">
        <li>
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          에서 키 발급
        </li>
        <li>
          프로젝트 루트에 <code>.env</code> 만들고
          <code>VITE_GROQ_API_KEY=키</code> 입력 후
          <code>npm run dev</code> 재시작
        </li>
        <li>또는 아래에 임시로 붙여넣기 (이 탭 sessionStorage만 사용)</li>
      </ol>
      <div class="key-row">
        <input
          v-model="localKey"
          type="password"
          autocomplete="off"
          placeholder="gsk_..."
          aria-label="Groq API Key"
        />
        <button type="button" class="send-btn" @click="saveKey">저장</button>
      </div>
      <p class="key-status" :class="{ ok: hasKey }">
        {{ hasKey ? '키 준비됨 · 채팅 가능' : '키가 아직 없습니다' }}
        <span v-if="envKey"> (env 감지됨)</span>
      </p>
    </section>

    <section class="chat-panel">
      <div ref="listEl" class="chat-list" aria-live="polite">
        <div
          v-for="(msg, i) in messages"
          :key="`${msg.role}-${i}`"
          class="bubble"
          :class="msg.role === 'user' ? 'is-user' : 'is-bot'"
        >
          <span class="bubble__who">{{ msg.role === 'user' ? '나' : 'AeroCast' }}</span>
          <p class="bubble__text">{{ msg.content }}</p>
        </div>
        <p v-if="isSending" class="typing">답변 작성 중…</p>
      </div>

      <p v-if="errorMsg" class="chat-error">{{ errorMsg }}</p>

      <form class="composer" @submit.prevent="sendMessage">
        <input
          v-model="input"
          type="text"
          placeholder="메시지를 입력하세요"
          :disabled="isSending"
          aria-label="메시지 입력"
        />
        <button type="submit" class="send-btn" :disabled="isSending || !input.trim()">
          전송
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.chat-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.chat-eyebrow {
  margin: 0 0 6px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgba(125, 211, 252, 0.75);
}

.chat-head h2 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #e8eef8;
}

.chat-lead {
  margin: 8px 0 0;
  font-size: 0.95rem;
  color: rgba(232, 238, 248, 0.62);
  font-weight: 600;
}

.chat-actions {
  display: flex;
  gap: 10px;
}

.ghost-btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 8px 14px;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  color: #e8eef8;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.ghost-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.key-panel {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.key-panel__title {
  margin: 0 0 8px;
  font-weight: 800;
  font-size: 1.05rem;
  color: #e8eef8;
}

.key-panel__steps {
  margin: 0 0 12px;
  padding-left: 1.3em;
  font-size: 0.92rem;
  line-height: 1.55;
  color: rgba(232, 238, 248, 0.72);
}

.key-panel__steps a {
  color: #7dd3fc;
}

.key-panel__steps code {
  font-size: 0.9em;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #e8eef8;
}

.key-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.key-row input,
.composer input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  height: 44px;
  min-height: 44px;
  border: 1px solid rgba(125, 211, 252, 0.45);
  border-radius: 14px;
  padding: 0 14px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  background: rgba(8, 12, 22, 0.55);
  color: #e8eef8;
}

.key-row input::placeholder,
.composer input::placeholder {
  color: rgba(232, 238, 248, 0.42);
  font-size: 0.9rem;
}

.key-row input:focus,
.composer input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.85);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

.key-status {
  margin: 10px 0 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #fbbf24;
}

.key-status.ok {
  color: #34d399;
}

.chat-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: rgba(18, 24, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.chat-list {
  flex: 1 1 auto;
  min-height: 200px;
  overflow: auto;
  padding: 16px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bubble {
  max-width: min(92%, 720px);
  padding: 12px 14px;
  border-radius: 14px;
}

.bubble.is-bot {
  align-self: flex-start;
  background: rgba(56, 189, 248, 0.16);
  border: 1px solid rgba(125, 211, 252, 0.22);
  color: #e8eef8;
}

.bubble.is-user {
  align-self: flex-end;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff;
}

.bubble__who {
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  opacity: 0.6;
  margin-bottom: 4px;
}

.bubble.is-user .bubble__who {
  opacity: 0.75;
}

.bubble__text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.typing {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(232, 238, 248, 0.55);
}

.chat-error {
  margin: 0 14px 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(180, 35, 24, 0.18);
  color: #fecaca;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}

.composer {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  align-items: stretch;
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(8, 12, 22, 0.35);
}

.send-btn {
  border: none;
  border-radius: 14px;
  height: 44px;
  min-height: 44px;
  padding: 0 20px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  background: linear-gradient(145deg, #38bdf8, #6366f1);
  color: #fff;
  box-shadow: 0 10px 24px rgba(56, 189, 248, 0.28);
  flex: 0 0 auto;
}

.send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
