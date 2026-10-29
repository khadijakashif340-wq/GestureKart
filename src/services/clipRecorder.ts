export class ClipRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private stopTimeout: number | null = null;

  public startRecording(canvas: HTMLCanvasElement): boolean {
    if (this.isRecording || typeof window === 'undefined') return false;

    try {
      const stream = canvas.captureStream(30); // 30 FPS stream
      this.recordedChunks = [];

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.downloadClip();
      };

      this.mediaRecorder.start(1000);
      this.isRecording = true;

      // Automatically stop after 30 seconds max
      this.stopTimeout = window.setTimeout(() => {
        this.stopRecording();
      }, 30000);

      return true;
    } catch (e) {
      console.warn('Clip recorder error:', e);
      return false;
    }
  }

  public stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;

    if (this.stopTimeout !== null) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }

    try {
      this.mediaRecorder.stop();
    } catch (e) {
      console.warn('Error stopping MediaRecorder:', e);
    }

    this.isRecording = false;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private downloadClip(): void {
    if (this.recordedChunks.length === 0) return;

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GestureKart-Clip-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const clipRecorder = new ClipRecorder();
