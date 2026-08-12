<script setup>
// [3일차 과제] props — 부모가 보유한 searchQuery를 currentQuery로 전달 (한글 동기화)
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
})

// [3일차 과제] emits — 입력값 변경 시 부모에게 update-query 이벤트로 전달
defineEmits(['update-query'])
</script>

<template>
  <div class="search-inner">
    <h3>도시 검색</h3>
    <!-- v-model 대신 :value + @input으로 부모 상태와 동기화 (교안 패턴) -->
    <input type="text" :value="currentQuery" @input="$emit('update-query', $event.target.value)" placeholder="검색할 도시 이름 입력" />
    <p>
      검색 중인 도시: <strong>{{ currentQuery }}</strong>
    </p>
  </div>
</template>

<style scoped>
.search-inner h3 {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.3px;
  margin: 0 0 16px 0;
}

.search-inner p {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 500;
  font-size: 0.92rem;
  margin: 14px 0 0 0;
}

.search-inner strong {
  color: #ffffff;
  font-weight: 700;
}

.search-inner input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  outline: none;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  color: #ffffff;
  font-size: 0.95rem;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-inner input::placeholder {
  color: rgba(255, 255, 255, 0.38);
}

.search-inner input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(140, 180, 255, 0.55);
  box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.15);
}
</style>
