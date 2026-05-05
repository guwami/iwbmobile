"use client";

import { useMemo } from "react";
import { useMarkerDetection } from "@/hooks/useMarkerDetection";
import type { GridPose } from "@/types/tracker";

const GRID_WIDTH = 90;
const GRID_HEIGHT = 150;
const BLOCK_STEP = 5;
const BLOCK_COLS = GRID_WIDTH / BLOCK_STEP; // 18
const BLOCK_ROWS = GRID_HEIGHT / BLOCK_STEP; // 30

const EMPTY_POSE: GridPose = {
  detected: false,
  markerNumber: null,
  markerCenter: null,
  displayCell: null,
  displayNormalized: null,
};

export function useScreenTracker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  markerNumber: number
) {
  const detection = useMarkerDetection(videoRef, enabled);

  return useMemo<GridPose>(() => {
    if (!detection.detected || !detection.center) return EMPTY_POSE;

    const safeMarker = Math.max(1, Math.min(40, markerNumber));
    const markerCol = (safeMarker - 1) % 8;
    const markerRow = Math.floor((safeMarker - 1) / 8);

    const markerBlockX = markerCol * 2 + 1;
    const markerBlockY = markerRow * 2 + 1;

    const offsetBlocksX = Math.round((detection.center.x - 0.5) * BLOCK_COLS);
    const offsetBlocksY = Math.round((detection.center.y - 0.5) * BLOCK_ROWS);

    const blockX = Math.max(0, Math.min(BLOCK_COLS - 1, markerBlockX + offsetBlocksX));
    const blockY = Math.max(0, Math.min(BLOCK_ROWS - 1, markerBlockY + offsetBlocksY));

    const cellX = Math.max(0, Math.min(GRID_WIDTH - 1, blockX * BLOCK_STEP + 2));
    const cellY = Math.max(0, Math.min(GRID_HEIGHT - 1, blockY * BLOCK_STEP + 2));

    return {
      detected: true,
      markerNumber: safeMarker,
      markerCenter: detection.center,
      displayCell: { x: cellX, y: cellY },
      displayNormalized: {
        x: cellX / GRID_WIDTH,
        y: cellY / GRID_HEIGHT,
      },
    };
  }, [detection.center, detection.detected, markerNumber]);
}
