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

export type ScreenPose = {
  detected: boolean;
  corners: QuadPoint[];
  screenPoint: QuadPoint | null;
  distanceScore: number;
  isNear: boolean;
  markers: MarkerQuad[];
};