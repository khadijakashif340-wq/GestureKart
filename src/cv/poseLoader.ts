import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let landmarkerInstance: PoseLandmarker | null = null;
let loadPromise: Promise<PoseLandmarker> | null = null;

const WASM_CDN_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export async function getPoseLandmarker(
  onProgress?: (step: string, percent: number) => void
): Promise<PoseLandmarker> {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      onProgress?.('Preparing 3D simulation and physics...', 25);

      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

      onProgress?.('Loading gesture tracking engine...', 60);

      // Attempt GPU delegate first, fallback to CPU
      try {
        landmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
        onProgress?.('Gesture engine ready with GPU acceleration', 100);
      } catch (gpuError) {
        console.warn('GPU delegate failed for PoseLandmarker, falling back to CPU delegate:', gpuError);
        onProgress?.('Calibrating standard gesture tracking...', 75);

        landmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
        onProgress?.('Gesture engine ready', 100);
      }

      return landmarkerInstance;
    } catch (error) {
      loadPromise = null;
      console.error('Critical failure loading PoseLandmarker:', error);
      throw error;
    }
  })();

  return loadPromise;
}

export function disposePoseLandmarker(): void {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close();
    } catch (e) {
      console.warn('Error closing PoseLandmarker:', e);
    }
    landmarkerInstance = null;
    loadPromise = null;
  }
}
