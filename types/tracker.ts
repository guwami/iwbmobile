export type QuadPoint = {
  x: number;
  y: number;
};

export type ScreenRect = {
  corners: QuadPoint[];
  area: number;
  width: number;
  height: number;
};

export type TrackerMode = "detecting" | "tracking" | "lost";

export type ScreenPose = {
  detected: boolean;
  mode: TrackerMode;
  screenPoint: QuadPoint | null; // 0..1
  distanceScore: number;
  isNear: boolean;
  screenCornersImage: QuadPoint[];
  trackedFeatureCount: number;
  screenRect: ScreenRect | null;
};