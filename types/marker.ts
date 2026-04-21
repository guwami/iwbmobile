export type MarkerDetection = {
  detected: boolean;
  near: boolean;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  center: {
    x: number;
    y: number;
  } | null;
  offset: {
    x: number;
    y: number;
  } | null;
  areaRatio: number;
};