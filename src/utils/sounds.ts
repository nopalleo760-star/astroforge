export class SpaceSoundManager {
  private audioCtx: AudioContext | null = null;
  private engineNoise: AudioWorkletNode | ScriptProcessorNode | null = null;
  private engineGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private lowPass: BiquadFilterNode | null = null;

  constructor() {}

  private init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Ambient Hum
    const oscillator = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(40, this.audioCtx.currentTime);
    oscGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    oscillator.connect(oscGain);
    oscGain.connect(this.audioCtx.destination);
    oscillator.start();

    // Engine Noise (Synthesized White Noise)
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.engineGain = this.audioCtx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

    this.lowPass = this.audioCtx.createBiquadFilter();
    this.lowPass.type = 'lowpass';
    this.lowPass.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    this.lowPass.Q.setValueAtTime(1, this.audioCtx.currentTime);

    whiteNoise.connect(this.lowPass);
    this.lowPass.connect(this.engineGain);
    this.engineGain.connect(this.audioCtx.destination);
    whiteNoise.start();
  }

  public update(isThrusting: boolean, fuel: number, altitude: number) {
    if (!this.audioCtx) {
      // Initialize on first user interaction
      if (isThrusting) this.init();
      return;
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const targetGain = (isThrusting && fuel > 0) ? 0.3 : 0;
    this.engineGain?.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.1);

    // Modulate frequency based on altitude (thinner sound in space)
    const atmosDensity = Math.max(0, 1 - altitude / 100000);
    const freq = 200 + (atmosDensity * 800);
    this.lowPass?.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.1);
  }

  public stop() {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
