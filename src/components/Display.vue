<script setup lang="ts">
import { onMounted } from 'vue';

const emit = defineEmits(['initDisplayAPI']);

onMounted(() => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  canvas.width = 640;
  canvas.height = 320;

  emit('initDisplayAPI', { ctx, canvas });
});
</script>

<template>
  <div class="chip8-display">
    <canvas class="canvas" id="canvas"></canvas>
  </div>
</template>

<style scoped></style>