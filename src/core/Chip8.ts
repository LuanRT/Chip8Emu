import Memory from "./Memory";

export default class Chip8 {
  public memory: Memory;

  public I: number;
  public PC: number;
  public V: Uint8Array;
  public stack: Uint16Array;
  public delayTimer: number;
  public soundTimer: number;
  public stackPointer: number;
  public gfx: Uint8Array;
  public shouldDraw: boolean = false;
  public shouldClear: boolean = false;
  public debugMode: boolean;

  constructor(memory: Memory, debugMode: boolean = false) {
    this.memory = memory;
    this.V = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.gfx = new Uint8Array((64 * 5) * (32 * 5));

    this.I = 0x000;
    this.PC = 0x200;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.stackPointer = 0;
    this.debugMode = debugMode;

    this.loadFont();
  }

  public loadFont() {
    this.log('Loading font into memory');

    const font = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    for (let i = 0; i < font.length; i++) {
      this.memory.write(i, font[i]);
    }
  }

  public tick() {
    const opcode = this.fetchOpcode();
    this.decodeOpcode(opcode);
  }

  private fetchOpcode(): number {
    const opcode = this.memory.read(this.PC) << 8 | this.memory.read(this.PC + 1);
    return opcode;
  }

  private decodeOpcode(opcode: number) {
    const NN = opcode & 0x00FF;
    const NNN = opcode & 0x0FFF;
    const yReg = (opcode & 0x00F0) >> 4;
    const xReg = (opcode & 0x0F00) >> 8;

    switch (opcode >> 12) {
      case 0x0:
        switch (opcode & 0x00FF) {
          case 0x00:
            console.log('[CPU]', 'NOP')
            return;
          case 0xE0:
            this.shouldClear = true;
            Uint8Array.from(this.gfx).forEach((_, i) => this.gfx[i] = 0);
            this.log('CLS');
            break;
          case 0xEE:
            this.stackPointer -= 1;
            this.PC = this.stack[this.stackPointer];
            this.log('RET', this.PC.toString(16));
            break;
          default:
            console.error('[CPU]', 'Unknown opcode', opcode.toString(16));
        }
        break;
      case 0x1:
        this.PC = NNN;
        this.log('JMP', NNN.toString(16));
        return;
      case 0x2:
        this.stack[this.stackPointer] = this.PC;
        this.stackPointer += 1;
        this.PC = NNN;
        this.log('CALL', NN.toString(16));
        return;
      case 0x3:
        if (this.V[xReg] === NN) {
          this.PC += 2;
        }
        this.log(`SKEQ V${xReg.toString(16)}, `, NN.toString(16));
        break;
      case 0x4:
        if (this.V[xReg] !== NN) {
          this.PC += 2;
        }
        this.log(`SKNE V${xReg.toString(16)}, `, NN.toString(16));
        break;
      case 0x5:
        if (this.V[xReg] === this.V[yReg]) {
          this.PC += 2;
        }
        this.log(`SKEQ V${xReg.toString(16)},`, `V${yReg.toString(16)}`);
        break;
      case 0x6:
        this.V[xReg] = NN;
        this.log(`MOV V${xReg.toString(16)}, `, NN.toString(16));
        break;
      case 0x7:
        this.V[xReg] += NN;
        this.log(`ADD V${xReg.toString(16)}, `, NN.toString(16));
        break;
      case 0x8:
        switch (opcode & 0x000F) {
          case 0x0:
            this.V[xReg] = this.V[yReg];
            this.log(`MOV V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0x1:
            this.V[xReg] |= this.V[yReg];
            this.log(`OR V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0x2:
            this.V[xReg] &= this.V[yReg];
            this.log(`AND V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0x3:
            this.V[xReg] ^= this.V[yReg];
            this.log(`XOR V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0x4:
            this.V[xReg] = this.V[xReg] >= this.V[yReg] ? (this.V[xReg] + this.V[yReg]) : (256 + this.V[xReg] + this.V[yReg]);
            this.V[0xF] = (this.V[yReg] >= this.V[xReg]) ? 1 : 0;
            this.log(`ADD V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0x5:
            this.V[xReg] = this.V[xReg] >= this.V[yReg] ? (this.V[xReg] - this.V[yReg]) : (256 + this.V[xReg] - this.V[yReg]);
            this.V[0xF] = this.V[yReg] >= this.V[xReg] ? 1 : 0;
            this.log(`SUB V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0x6:
            let tmp = this.V[xReg] & 0x01;
            this.V[xReg] >>= 1;
            this.V[0xF] = tmp;
            this.log(`SHR V${xReg.toString(16)}`);
            break;
          case 0x7:
            this.V[xReg] = this.V[xReg] >= this.V[yReg] ? (this.V[yReg] - this.V[xReg]) : (256 + this.V[yReg] - this.V[xReg]);
            this.V[0xF] = this.V[yReg] >= this.V[xReg] ? 1 : 0;
            this.log(`SUBN V${xReg.toString(16)}, V${yReg.toString(16)}`);
            break;
          case 0xE:
            let bit = (this.V[xReg] & 0x80) >> 7;
            this.V[xReg] <<= 1;
            this.V[0xF] = bit;
            this.log(`SHL V${xReg.toString(16)}`);
            break;
        }
        break;
      case 0x9:
        if (this.V[xReg] !== this.V[yReg]) {
          this.PC += 2;
        }
        this.log(`SKNE V${xReg.toString(16)}, V${yReg.toString(16)}`);
        break;
      case 0xA:
        this.I = NNN;
        this.log(`MOV I, `, NNN.toString(16));
        break;
      case 0xB:
        this.PC = NNN + this.V[0];
        this.log(`JMP V0, `, NNN.toString(16));
        return;
      case 0xC:
        const rand = Math.floor(Math.random() * 0xFF);
        this.V[xReg] = rand & NN;
        this.log(`RND V${xReg.toString(16)}, `, NN.toString(16));
        break;
      case 0xD:
        const height = opcode & 0x000F;

        let pixel: number;

        this.V[0xF] = 0;

        for (let yline = 0; yline < height; yline++) {
          pixel = this.memory.read(this.I + yline);
          for (let xline = 0; xline < 8; xline++) {
            if ((pixel & (0x80 >> xline)) !== 0) {
              if (this.gfx[(this.V[xReg] + xline + ((this.V[yReg] + yline) * 64))] === 1) {
                this.V[0xF] = 1;
              }
              this.gfx[this.V[xReg] + xline + ((this.V[yReg] + yline) * 64)] ^= 1;
            }
          }
        }

        this.shouldDraw = true;

        this.log(`DRW V${xReg.toString(16)}, V${yReg.toString(16)}, `, height.toString(16));
        break;
      case 0xF:
        switch (opcode & 0x00FF) {
          case 0x07:
            this.V[xReg] = (this.delayTimer & 0xFF);
            this.log(`MOV V${xReg.toString(16)}, DT`);
            break;
          case 0x15:
            this.delayTimer = this.V[xReg];
            this.log(`MOV DT, V${xReg.toString(16)}`);
            break;
          case 0x18:
            this.soundTimer = this.V[xReg];
            this.log(`MOV ST, V${xReg.toString(16)}`);
            break;
          case 0x1E:
            this.I += this.V[xReg];
            this.log(`ADD I, V${xReg.toString(16)}`);
            break;
          case 0x29:
            this.I = this.memory.read(0x50);
            this.log(`MOV I, V${xReg.toString(16)}`);
            break;
          case 0x33:
            this.memory.write(this.I, (this.V[xReg] / 100 % 10));
            this.memory.write(this.I + 1, (this.V[xReg] / 10 % 10));
            this.memory.write(this.I + 2, (this.V[xReg] / 1 % 10));
            this.log(`BCD V${xReg.toString(16)}`);
            break;
          case 0x55:
            for (let i = 0; i <= xReg; i++) {
              this.memory.write(this.I + i, this.V[i]);
            }
            this.log(`MOV [I], V${xReg.toString(16)}`);
            break;
          case 0x65:
            for (let i = 0; i <= xReg; i++) {
              this.V[i] = this.memory.read(this.I + i);
            }
            this.log(`MOV V${xReg.toString(16)}, [I]`);
            break;
        }
        break;
      default:
        this.log('Unknown opcode', opcode.toString(16));
    }

    this.PC += 2;
  }

  private log(...text: any[]) {
    if (this.debugMode) {
      console.log('[CPU]', ...text);
    }
  }

  public timerStep(): boolean {
    if (this.soundTimer > 0) {
      if (--this.delayTimer == 0)
        return true;
    }

    if (this.delayTimer > 0) {
      this.delayTimer--;
    }

    return false;
  }
}