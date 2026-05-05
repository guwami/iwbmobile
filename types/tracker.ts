export type GridPose = {
  detected: boolean;
  markerNumber: number | null;
  markerCenter: {
    x: number;
    y: number;
  } | null;
  displayCell: {
    x: number;
    y: number;
  } | null;
  displayNormalized: {
    x: number;
    y: number;
  } | null;
};
