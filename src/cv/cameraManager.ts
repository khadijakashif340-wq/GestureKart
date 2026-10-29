class CameraManager {
  private stream: MediaStream | null = null;
  private requestingPromise: Promise<MediaStream | null> | null = null;

  public async getStream(): Promise<MediaStream | null> {
    if (this.stream && this.stream.active && this.stream.getVideoTracks().some((t) => t.readyState === 'live')) {
      return this.stream;
    }

    if (this.requestingPromise) {
      return this.requestingPromise;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia is not supported in this browser.');
      return null;
    }

    this.requestingPromise = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });
        this.stream = stream;
        return stream;
      } catch (err) {
        console.warn('CameraManager getUserMedia error:', err);
        return null;
      } finally {
        this.requestingPromise = null;
      }
    })();

    return this.requestingPromise;
  }

  public async attachToVideo(video: HTMLVideoElement | null): Promise<boolean> {
    if (!video) return false;

    const stream = await this.getStream();
    if (!stream) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };

    try {
      await video.play();
      return true;
    } catch {
      return true;
    }
  }

  public stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

export const cameraManager = new CameraManager();
