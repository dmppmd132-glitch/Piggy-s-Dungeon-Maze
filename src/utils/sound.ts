class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.04,
    delay = 0
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  public playClick(): void {
    this.playTone(580, 0.06, 'square', 0.035);
  }

  public playEquip(): void {
    this.playTone(440, 0.05, 'triangle', 0.05, 0);
    this.playTone(660, 0.07, 'triangle', 0.05, 0.05);
  }

  public playStart(): void {
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.11, 'square', 0.04, idx * 0.08);
    });
  }

  public playCoin(): void {
    this.playTone(987.77, 0.06, 'square', 0.04, 0);
    this.playTone(1318.51, 0.14, 'square', 0.04, 0.06);
  }

  public playEat(): void {
    this.playTone(330, 0.07, 'triangle', 0.05, 0);
    this.playTone(440, 0.07, 'triangle', 0.05, 0.07);
    this.playTone(587.33, 0.11, 'triangle', 0.05, 0.14);
  }

  public playHurt(): void {
    this.playTone(196, 0.09, 'sawtooth', 0.045, 0);
    this.playTone(138.59, 0.14, 'sawtooth', 0.045, 0.08);
  }

  public playGameOver(): void {
    const notes = [392, 349.23, 329.63, 261.63];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'sawtooth', 0.04, idx * 0.19);
    });
  }
}

export const retroAudio = new RetroAudioEngine();
