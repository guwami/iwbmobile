"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MarkerQuad, QuadPoint, ScreenPose } from "@/types/tracker";

const EMPTY_POSE: ScreenPose = {
  detected: false,
  corners: [],
  screenPoint: null,
  distanceScore: 0,
  isNear: false,
  markers: [],
};

function distance(a: QuadPoint, b: QuadPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function orderPoints(points: QuadPoint[]): QuadPoint[] {
  const sorted = [...points].sort((a, b) => a.y - b.y);
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]];
}

function centroid(points: QuadPoint[]): QuadPoint {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length;
  const y = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x, y };
}

export function useScreenTracker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cvReady: boolean,
  enabled: boolean
) {
  const [pose, setPose] = useState<ScreenPose>(EMPTY_POSE);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const homographyState = useMemo(() => ({ lastPoint: null as QuadPoint | null }), []);

  useEffect(() => {
    if (!enabled || !cvReady || !window.cv) {
      setPose(EMPTY_POSE);
      return;
    }

    const cv = window.cv;
    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;

    const detect = () => {
      const video = videoRef.current;
      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const w = 480;
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      ctx.drawImage(video, 0, 0, w, h);

      let src = cv.imread(canvas);
      let gray = new cv.Mat();
      let blur = new cv.Mat();
      let thresh = new cv.Mat();
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();

      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
        cv.threshold(blur, thresh, 90, 255, cv.THRESH_BINARY_INV);

        cv.findContours(
          thresh,
          contours,
          hierarchy,
          cv.RETR_EXTERNAL,
          cv.CHAIN_APPROX_SIMPLE
        );

        const markers: MarkerQuad[] = [];

        for (let i = 0; i < contours.size(); i++) {
          const cnt = contours.get(i);
          const area = cv.contourArea(cnt);
          if (area < 400) {
            cnt.delete();
            continue;
          }

          const peri = cv.arcLength(cnt, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(cnt, approx, 0.04 * peri, true);

          if (approx.rows === 4 && cv.isContourConvex(approx)) {
            const points: QuadPoint[] = [];
            for (let j = 0; j < 4; j++) {
              const x = approx.intPtr(j, 0)[0];
              const y = approx.intPtr(j, 0)[1];
              points.push({ x, y });
            }

            const ordered = orderPoints(points);
            const c = centroid(ordered);
            const width = (distance(ordered[0], ordered[1]) + distance(ordered[3], ordered[2])) / 2;
            const height = (distance(ordered[0], ordered[3]) + distance(ordered[1], ordered[2])) / 2;
            const aspect = width / height;

            if (aspect > 0.65 && aspect < 1.35) {
              markers.push({
                center: c,
                corners: ordered,
                area,
                width,
                height,
              });
            }
          }

          approx.delete();
          cnt.delete();
        }

        markers.sort((a, b) => b.area - a.area);
        const topMarkers = markers.slice(0, 4);

        if (topMarkers.length < 4) {
          setPose(EMPTY_POSE);
          src.delete();
          gray.delete();
          blur.delete();
          thresh.delete();
          contours.delete();
          hierarchy.delete();
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        const centers = topMarkers.map((m) => m.center);
        const orderedCenters = orderPoints(centers);

        const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          orderedCenters[0].x, orderedCenters[0].y,
          orderedCenters[1].x, orderedCenters[1].y,
          orderedCenters[2].x, orderedCenters[2].y,
          orderedCenters[3].x, orderedCenters[3].y,
        ]);

        const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          1, 0,
          1, 1,
          0, 1,
        ]);

        const H = cv.getPerspectiveTransform(srcPts, dstPts);

        const camCenter = cv.matFromArray(1, 1, cv.CV_32FC2, [w / 2, h / 2]);
        const out = new cv.Mat();
        cv.perspectiveTransform(camCenter, out, H);

        const screenX = out.data32F[0];
        const screenY = out.data32F[1];

        const avgMarkerSize =
          topMarkers.reduce((sum, m) => sum + (m.width + m.height) / 2, 0) / topMarkers.length;

        const distanceScore = avgMarkerSize / Math.min(w, h);
        const isNear = distanceScore > 0.14;

        const inside =
          screenX >= 0 && screenX <= 1 &&
          screenY >= 0 && screenY <= 1;

        const point = inside ? { x: screenX, y: screenY } : null;
        homographyState.lastPoint = point;

        setPose({
          detected: inside,
          corners: orderedCenters,
          screenPoint: point,
          distanceScore,
          isNear: inside && isNear,
          markers: topMarkers,
        });

        srcPts.delete();
        dstPts.delete();
        H.delete();
        camCenter.delete();
        out.delete();
      } catch {
        setPose(EMPTY_POSE);
      } finally {
        src.delete();
        gray.delete();
        blur.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, cvReady, enabled, homographyState]);

  return pose;
}