export type QuadPoint = {
  x: number;
  y: number;
};

export type MarkerQuad = {
  center: QuadPoint;
  corners: QuadPoint[];
  area: number;
  width: number;
  height: number;
};

export type TrackerMode = "detecting" | "tracking" | "lost";

export type ScreenPose = {
  detected: boolean;
  mode: TrackerMode;
  corners: QuadPoint[];
  screenCornersImage: QuadPoint[];
  screenPoint: QuadPoint | null; // 0..1
  distanceScore: number;
  isNear: boolean;
  markers: MarkerQuad[];
  trackedFeatureCount: number;
};