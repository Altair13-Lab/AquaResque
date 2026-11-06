import type * as cocoSsd from "@tensorflow-models/coco-ssd";

export interface PersonDetection {
  id: number;
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  confidence: number;
}

export type AnalysisStatus = "off" | "camera" | "loading" | "ready" | "error";

export interface AnalysisUpdate {
  status: AnalysisStatus;
  people: PersonDetection[];
  message?: string;
}

let detectorPromise: Promise<cocoSsd.ObjectDetection> | undefined;

export function loadPersonDetector(): Promise<cocoSsd.ObjectDetection> {
  if (!detectorPromise) {
    detectorPromise = Promise.all([
      import("@tensorflow/tfjs-core"),
      import("@tensorflow/tfjs-backend-webgl"),
      import("@tensorflow/tfjs-backend-cpu"),
      import("@tensorflow-models/coco-ssd"),
    ])
      .then(async ([tf, _webgl, _cpu, model]) => {
        let backendReady = false;
        try {
          backendReady = await tf.setBackend("webgl");
        } catch {
          backendReady = false;
        }
        if (!backendReady) backendReady = await tf.setBackend("cpu");
        if (!backendReady) throw new Error("TensorFlow не смог запустить WebGL или CPU backend.");
        await tf.ready();
        return model.load({ base: "lite_mobilenet_v2" });
      })
      .catch((error: unknown) => {
        detectorPromise = undefined;
        throw error;
      });
  }
  return detectorPromise;
}

export async function detectPeople(
  model: cocoSsd.ObjectDetection,
  video: HTMLVideoElement,
): Promise<PersonDetection[]> {
  const predictions = await model.detect(video, 10, 0.5);

  return predictions
    .filter((prediction) => prediction.class === "person")
    .map((prediction, index) => {
      const [x, y, width, height] = prediction.bbox;
      const left = (x / video.videoWidth) * 100;
      const top = (y / video.videoHeight) * 100;
      const boxWidth = (width / video.videoWidth) * 100;
      const boxHeight = (height / video.videoHeight) * 100;

      return {
        id: index,
        left,
        top,
        width: boxWidth,
        height: boxHeight,
        centerX: Math.round(left + boxWidth / 2),
        centerY: Math.round(top + boxHeight / 2),
        confidence: prediction.score,
      };
    });
}
