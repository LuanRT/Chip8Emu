export default class Memory {
  static size = 0x1000; // 4k

  private memory: Uint8Array;

  constructor() {
    this.memory = new Uint8Array(Memory.size);
  }

  public read(address: number): number {
    return this.memory[address] & 0xFF;
  }

  public write(address: number, value: number): void {
    this.memory[address] = value & 0xFF;
  }

  public getLength(): number {
    return this.memory.length;
  }

  public loadProgram(program: Uint8Array): void {
    for (let i = 0; i < program.length; i++) {
      this.write(i + 0x200, program[i]);
    }
  }
}