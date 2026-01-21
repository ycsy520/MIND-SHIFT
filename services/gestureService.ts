import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// Configuration for the model
const VISION_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

export class FaceService {
  private landmarker: FaceLandmarker | null = null;
  private runningMode: "IMAGE" | "VIDEO" = "VIDEO";
  
  private static instance: FaceService;
  private lastVideoTime: number = -1;
  
  // Normalized Nose Coordinates: 0.5 is center.
  private lastNoseX: number = 0.5;
  private lastNoseY: number = 0.5;

  private constructor() {}

  public static getInstance(): FaceService {
    if (!FaceService.instance) {
      FaceService.instance = new FaceService();
    }
    return FaceService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.landmarker) return;

    const vision = await FilesetResolver.forVisionTasks(VISION_BASE_URL);
    
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU"
      },
      outputFaceBlendshapes: false,
      runningMode: this.runningMode,
      numFaces: 1
    });
  }

  public detect(video: HTMLVideoElement): { x: number, y: number } {
    if (!this.landmarker) return { x: 0.5, y: 0.5 };

    if (video.currentTime === this.lastVideoTime) {
        return { x: this.lastNoseX, y: this.lastNoseY };
    }
    this.lastVideoTime = video.currentTime;

    try {
        const result = this.landmarker.detectForVideo(video, Date.now());
        
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            // Landmark 1 is the tip of the nose
            const currentX = result.faceLandmarks[0][1].x;
            const currentY = result.faceLandmarks[0][1].y;
            
            // --- ADAPTIVE SMOOTHING ALGORITHM ---
            // Calculate how much the head moved since last frame
            const deltaX = Math.abs(currentX - this.lastNoseX);
            const deltaY = Math.abs(currentY - this.lastNoseY);
            const delta = Math.max(deltaX, deltaY);
            
            // Dynamic Alpha:
            // If movement is large (> 0.02), use high alpha (0.3) for responsiveness.
            // If movement is tiny (< 0.02), use very low alpha (0.05) to filter out jitter.
            let alpha = 0.05; 
            if (delta > 0.05) alpha = 0.5;      // Fast flick
            else if (delta > 0.02) alpha = 0.2; // Normal movement
            else alpha = 0.04;                  // Holding still (Anti-shake)

            // Apply Exponential Moving Average
            this.lastNoseX = this.lastNoseX * (1 - alpha) + currentX * alpha;
            this.lastNoseY = this.lastNoseY * (1 - alpha) + currentY * alpha;
        }
    } catch (e) {
        // ignore sporadic errors
    }

    return { x: this.lastNoseX, y: this.lastNoseY };
  }
}