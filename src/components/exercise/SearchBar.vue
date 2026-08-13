<script setup>
//  props — 부모가 보유한 searchQuery를 currentQuery로 전달 (한글 동기화)
defineProps({
  currentQuery: {
    type: String,
    default: '',
  },
})

defineEmits(['update-query'])
</script>

<template>
  <div class="search-inner">
    <h3>도시 검색</h3>
    <input type="text" :value="currentQuery" @input="$emit('update-query', $event.target.value)" placeholder="검색할 도시 이름 입력" />
    <p>
      검색 중인 도시: <strong>{{ currentQuery }}</strong>
    </p>
  </div>
</template>

<style scoped>
.search-inner h3 {
  color: #2a3340;
  font-weight: 800;
  font-size: 2.1rem;
  letter-spacing: -0.3px;
  margin: 0 0 20px 0;
}

.search-inner p {
  color: rgba(42, 51, 64, 0.72);
  font-weight: 600;
  font-size: 1.45rem;
  margin: 18px 0 0 0;
}

.search-inner strong {
  color: #2a3340;
  font-weight: 750;
}

.search-inner input {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  min-height: 72px;
  padding: 22px 26px;
  border: none;
  border-radius: 20px;
  outline: none;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 1px 3px rgba(90, 110, 140, 0.1);
  color: #0b1220;
  font-size: 1.7rem;
  font-weight: 650;
  line-height: 1.3;
}

.search-inner input::placeholder {
  color: rgba(42, 51, 64, 0.42);
  font-size: 1.55rem;
  font-weight: 550;
}

.search-inner input:focus {
  background: #fff;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.35);
}
</style>
