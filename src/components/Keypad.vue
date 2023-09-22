<script setup lang="ts">
import { onMounted, ref } from 'vue';

let keysPressed = ref<string[]>([]);

const emit = defineEmits(['initKeypadAPI']);

const keys = [
  "1", "2", "3", "C",
  "4", "5", "6", "D",
  "7", "8", "9", "E",
  "A", "0", "B", "F",
];

function keydownHandler(ev: Event) {
  const target = ev.target as HTMLButtonElement;
  keysPressed.value.push(target.innerText);
}

function keyupHandler(ev: Event) {
  const target = ev.target as HTMLButtonElement;
  keysPressed.value = keysPressed.value.filter((key) => key !== target.innerText);
}

function isKeyPressed(key: number) {
  return keysPressed.value.includes(key.toString(16));
}

onMounted(() => {
  const keypadButtons = document.querySelectorAll('.keypad-button');

  keypadButtons.forEach((button) => {
    button.addEventListener('mouseup', (e) => keyupHandler(e));
    button.addEventListener('mousedown', (e) => keydownHandler(e));
    button.addEventListener('touchstart', (e) => keydownHandler(e));
    button.addEventListener('touchend', (e) => keyupHandler(e));
  });

  emit('initKeypadAPI', { isKeyPressed });
});
</script>

<template>
  <div class="keypad-container">
    <button v-for="key in keys" :key="key" class="keypad-button" >{{ key }}</button>
  </div>
</template>

<style scoped>
.keypad-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 5px;
}

.keypad-button {
  display: flex;
  flex: 1 0 22%;
  justify-content: center;
  align-items: center;
  height: 10vh;
  border: 1px solid black;
  border-radius: 5px;
  margin: 5px;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>