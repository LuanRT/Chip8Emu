<script setup lang="ts">
import { onMounted } from 'vue';
import Chip8 from '../core/Chip8';
import Memory from '../core/Memory';
import Display from '../components/Display.vue';
import Keypad from '../components/Keypad.vue';

let debugging = false;

export type DisplayAPI = {
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
}

export type KeypadAPI = {
  isKeyPressed: (key: number) => boolean
}

let displayAPI: DisplayAPI;
let keypadAPI: KeypadAPI;

const initDisplayAPI = (api: DisplayAPI) => displayAPI = api;
const initKeypadAPI = (api: KeypadAPI) => keypadAPI = api;

onMounted(async () => {
  const { ctx, canvas } = displayAPI;

  const memory = new Memory();
  const chip8 = new Chip8(memory, keypadAPI, debugging);

  const response = await fetch('/roms/Astro Dodge [Revival Studios, 2008].ch8');
  const buffer = await response.arrayBuffer();

  memory.loadProgram(new Uint8Array(buffer));

  setInterval(() => {
    for (var i = 0; i < 8; i++) {
      chip8.timerStep();
      chip8.tick();

      let index = 0;

      if (chip8.shouldClear) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        chip8.shouldClear = false;
      }

      if (chip8.shouldDraw) {
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 64; x++) {
            ctx.beginPath();
            ctx.fillStyle = chip8.gfx[index++] === 1 ? "white" : "black";
            ctx.rect(x * canvas.width / 64, y * canvas.height / 32, canvas.width / 64, canvas.height / 32);
            ctx.fill();
            ctx.closePath();
          }
        }
        chip8.shouldDraw = false;
      }
    }
  }, 1000 / 60);
});
</script>

<template>
  <div class="emu-container">
    <Display @initDisplayAPI="initDisplayAPI" />
    <Keypad @initKeypadAPI="initKeypadAPI"/>
  </div>
</template>

<style scoped>
.emu-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 540px;
}

.canvas {
  display: block;
}
</style>