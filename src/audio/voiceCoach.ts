/**
 * Voice Coach using browser Web Speech API.
 * Non-blocking, rate-limited to 1 cue per ~3 seconds with subtitle dispatch.
 */

class VoiceCoach {
  private isEnabled: boolean = true;
  private lastSpokenTime: number = 0;
  private onSubtitleCallback: ((text: string) => void) | null = null;
  private subtitleClearTimeout: number | null = null;

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setSubtitleListener(cb: (text: string) => void): void {
    this.onSubtitleCallback = cb;
  }

  public speak(cue: string, force: boolean = false): void {
    if (!this.isEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // Still show subtitle if enabled
      this.displaySubtitle(cue);
      return;
    }

    const now = performance.now();
    if (!force && now - this.lastSpokenTime < 3200) {
      // Debounce frequent cues
      return;
    }

    this.lastSpokenTime = now;
    this.displaySubtitle(cue);

    try {
      window.speechSynthesis.cancel(); // Cancel any existing speech to prioritize current safety cue
      const utterance = new SpeechSynthesisUtterance(cue);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && !v.name.includes('Google') && !v.name.includes('Microsoft'));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  private displaySubtitle(text: string): void {
    if (this.onSubtitleCallback) {
      this.onSubtitleCallback(text);

      if (this.subtitleClearTimeout !== null) {
        window.clearTimeout(this.subtitleClearTimeout);
      }
      this.subtitleClearTimeout = window.setTimeout(() => {
        if (this.onSubtitleCallback) {
          this.onSubtitleCallback('');
        }
      }, 3500);
    }
  }
}

export const voiceCoach = new VoiceCoach();
