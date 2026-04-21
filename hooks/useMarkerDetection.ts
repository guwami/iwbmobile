"use client";

import { useEffect, useRef, useState } from "react";
import type { MarkerDetection } from "@/types/marker";

const DEFAULT_DETECTION: MarkerDetection = {
  detected: false,
  near: false,
  confidence: 0,
  box: null,
  center: null,
  offset: null,
  areaRatio: 0,
};

export function useMarkerDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const [result, setResult] = useState<MarkerDetection>(DEFAULT_DETECTION);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setResult(DEFAULT_DETECTION);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const detect = () => {
      const currentVideo = videoRef.current;
      if (
        !currentVideo ||
        currentVideo.readyState < 2 ||
        currentVideo.videoWidth === 0 ||
        currentVideo.videoHeight === 0
      ) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const sampleWidth = 160;
      const sampleHeight = Math.round(
        (currentVideo.videoHeight / currentVideo.videoWidth) * sampleWidth
      );

      canvas.width = sampleWidth;
      canvas.height = sampleHeight;

      ctx.drawImage(currentVideo, 0, 0, sampleWidth, sampleHeight);
      const image = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const data = image.data;

      let minX = sampleWidth;
      let minY = sampleHeight;
      let maxX = -1;
      let maxY = -1;
      let darkCount = 0;

      for (let y = 0; y < sampleHeight; y++) {
        for (let x = 0; x < sampleWidth; x++) {
          const i = (y * sampleWidth + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          if (brightness < 55) {
            darkCount++;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (darkCount < 250 || maxX < 0 || maxY < 0) {
        setResult(DEFAULT_DETECTION);
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      const boxArea = boxWidth * boxHeight;
      const areaRatio = boxArea / (sampleWidth * sampleHeight);
      const fillRatio = darkCount / boxArea;
      const aspect = boxWidth / boxHeight;

      const isSquareLike = aspect > 0.65 && aspect < 1.35;
      const isDenseEnough = fillRatio > 0.35;
      const isReasonableSize = areaRatio > 0.015;

      if (!isSquareLike || !isDenseEnough || !isReasonableSize) {
        setResult(DEFAULT_DETECTION);
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const centerX = minX + boxWidth / 2;
      const centerY = minY + boxHeight / 2;

      const offsetX = (centerX - sampleWidth / 2) / sampleWidth;
      const offsetY = (centerY - sampleHeight / 2) / sampleHeight;

      const near = areaRatio > 0.12;

      setResult({
        detected: true,
        near,
        confidence: Math.min(1, fillRatio),
        box: {
          x: minX / sampleWidth,
          y: minY / sampleHeight,
          width: boxWidth / sampleWidth,
          height: boxHeight / sampleHeight,
        },
        center: {
          x: centerX / sampleWidth,
          y: centerY / sampleHeight,
        },
        offset: {
          x: offsetX,
          y: offsetY,
        },
        areaRatio,
      });

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, videoRef]);

  return result;
}