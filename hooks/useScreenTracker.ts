"use client";

import { useEffect, useRef, useState } from "react";
import type { MarkerQuad, QuadPoint, ScreenPose } from "@/types/tracker";

const EMPTY_POSE: ScreenPose = {
  detected: false,
  mode: "detecting",
  corners: [],
  screenCornersImage: [],
  screenPoint: null,
  distanceScore: 0,
  isNear: false,
  markers: [],
  trackedFeatureCount: 0,
};

function distance(a: QuadPoint, b: QuadPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function polygonArea(points: QuadPoint[]) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function orderPoints(points: QuadPoint[]): QuadPoint[] {
  const sorted = [...points].sort((a, b) => a.y - b.y);
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]]; // TL, TR, BR, BL
}

function centroid(points: QuadPoint[]): QuadPoint {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length;
  const y = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x, y };
}

function homographyArrayFromMat(mat: any): number[] {
  const out: number[] = [];
  for (let i = 0; i < 9; i++) out.push(mat.data64F[i]);
  return out;
}

function applyHomographyToPoint(H: number[], p: QuadPoint): QuadPoint | null {
  const x = p.x;
  const y = p.y;
  const w = H[6] * x + H[7] * y + H[8];
  if (Math.abs(w) < 1e-8) return null;
  return {
    x: (H[0] * x + H[1] * y + H[2]) / w,
    y: (H[3] * x + H[4] * y + H[5]) / w,
  };
}

function pointsToMat(cv: any, points: QuadPoint[]) {
  return cv.matFromArray(
    points.length,
    1,
    cv.CV_32FC2,
    points.flatMap((p) => [p.x, p.y])
  );
}

function matToPoints(mat: any): QuadPoint[] {
  const points: QuadPoint[] = [];
  for (let i = 0; i < mat.rows; i++) {
    const x = mat.data32F[i * 2];
    const y = mat.data32F[i * 2 + 1];
    points.push({ x, y });
  }
  return points;
}

export function useScreenTracker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cvReady: boolean,
  enabled: boolean
) {
  const [pose, setPose] = useState<ScreenPose>(EMPTY_POSE);

  const rafRef = useRef<number | null>(null);
  const prevGrayRef = useRef<any>(null);
  const prevPtsRef = useRef<any>(null);
  const screenCornersRef = useRef<QuadPoint[]>([]);
  const modeRef = useRef<"detecting" | "tracking">("detecting");
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!enabled || !cvReady || !window.cv) {
      setPose(EMPTY_POSE);
      return;
    }

    const cv = window.cv;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      setPose(EMPTY_POSE);
      return;
    }

    const cleanupTracking = () => {
      if (prevGrayRef.current) {
        prevGrayRef.current.delete();
        prevGrayRef.current = null;
      }
      if (prevPtsRef.current) {
        prevPtsRef.current.delete();
        prevPtsRef.current = null;
      }
      screenCornersRef.current = [];
      modeRef.current = "detecting";
    };

    const buildMaskFromQuad = (gray: any, quad: QuadPoint[]) => {
      const mask = new cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1);
      const pts = cv.matFromArray(
        4,
        1,
        cv.CV_32SC2,
        quad.flatMap((p) => [Math.round(p.x), Math.round(p.y)])
      );
      const ptsVec = new cv.MatVector();
      ptsVec.push_back(pts);
      cv.fillPoly(mask, ptsVec, new cv.Scalar(255));
      pts.delete();
      ptsVec.delete();
      return mask;
    };

    const detectMarkersAndInitialize = (gray: any, src: any) => {
      const blur = new cv.Mat();
      const thresh = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      const markers: MarkerQuad[] = [];

      try {
        cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
        cv.threshold(blur, thresh, 90, 255, cv.THRESH_BINARY_INV);

        cv.findContours(
          thresh,
          contours,
          hierarchy,
          cv.RETR_EXTERNAL,
          cv.CHAIN_APPROX_SIMPLE
        );

        for (let i = 0; i < contours.size(); i++) {
          const cnt = contours.get(i);
          const area = cv.contourArea(cnt);

          if (area < 300) {
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
            const width =
              (distance(ordered[0], ordered[1]) +
                distance(ordered[3], ordered[2])) /
              2;
            const height =
              (distance(ordered[0], ordered[3]) +
                distance(ordered[1], ordered[2])) /
              2;

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
          setPose({
            ...EMPTY_POSE,
            markers: topMarkers,
            mode: "detecting",
          });
          return;
        }

        const centers = topMarkers.map((m) => m.center);
        const orderedCenters = orderPoints(centers);

        const srcPts = pointsToMat(cv, orderedCenters);
        const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          1, 0,
          1, 1,
          0, 1,
        ]);

        const H = cv.getPerspectiveTransform(srcPts, dstPts);
        const HArray = homographyArrayFromMat(H);

        const cameraCenter = {
          x: src.cols / 2,
          y: src.rows / 2,
        };

        const screenPoint = applyHomographyToPoint(HArray, cameraCenter);
        const screenArea = polygonArea(orderedCenters);
        const distanceScore = screenArea / (src.cols * src.rows);
        const isNear = distanceScore > 0.08;

        const mask = buildMaskFromQuad(gray, orderedCenters);
        const corners = new cv.Mat();

        cv.goodFeaturesToTrack(
          gray,
          corners,
          60,
          0.01,
          10,
          mask,
          7,
          false,
          0.04
        );

        mask.delete();

        if (corners.rows < 8) {
          corners.delete();
          srcPts.delete();
          dstPts.delete();
          H.delete();

          setPose({
            detected: !!screenPoint,
            mode: "detecting",
            corners: orderedCenters,
            screenCornersImage: orderedCenters,
            screenPoint,
            distanceScore,
            isNear: !!screenPoint && isNear,
            markers: topMarkers,
            trackedFeatureCount: 0,
          });
          return;
        }

        if (prevGrayRef.current) prevGrayRef.current.delete();
        prevGrayRef.current = gray.clone();

        if (prevPtsRef.current) prevPtsRef.current.delete();
        prevPtsRef.current = corners.clone();

        screenCornersRef.current = orderedCenters;
        modeRef.current = "tracking";

        setPose({
          detected: !!screenPoint,
          mode: "tracking",
          corners: orderedCenters,
          screenCornersImage: orderedCenters,
          screenPoint,
          distanceScore,
          isNear: !!screenPoint && isNear,
          markers: topMarkers,
          trackedFeatureCount: corners.rows,
        });

        corners.delete();
        srcPts.delete();
        dstPts.delete();
        H.delete();
      } finally {
        blur.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();
      }
    };

    const trackScreen = (gray: any, src: any) => {
      if (
        !prevGrayRef.current ||
        !prevPtsRef.current ||
        prevPtsRef.current.rows < 6 ||
        screenCornersRef.current.length !== 4
      ) {
        cleanupTracking();
        setPose({
          ...EMPTY_POSE,
          mode: "lost",
        });
        return;
      }

      const nextPts = new cv.Mat();
      const status = new cv.Mat();
      const err = new cv.Mat();

      try {
        cv.calcOpticalFlowPyrLK(
          prevGrayRef.current,
          gray,
          prevPtsRef.current,
          nextPts,
          status,
          err
        );

        const prevGood: QuadPoint[] = [];
        const nextGood: QuadPoint[] = [];

        for (let i = 0; i < status.rows; i++) {
          if (status.data[i] === 1) {
            prevGood.push({
              x: prevPtsRef.current.data32F[i * 2],
              y: prevPtsRef.current.data32F[i * 2 + 1],
            });

            nextGood.push({
              x: nextPts.data32F[i * 2],
              y: nextPts.data32F[i * 2 + 1],
            });
          }
        }

        if (nextGood.length < 6) {
          cleanupTracking();
          setPose({
            ...EMPTY_POSE,
            mode: "lost",
          });
          return;
        }

        const prevMat = pointsToMat(cv, prevGood);
        const nextMat = pointsToMat(cv, nextGood);
        const Hdelta = cv.findHomography(prevMat, nextMat, cv.RANSAC, 3);

        if (Hdelta.empty()) {
          prevMat.delete();
          nextMat.delete();
          Hdelta.delete();
          cleanupTracking();
          setPose({
            ...EMPTY_POSE,
            mode: "lost",
          });
          return;
        }

        const cornersMat = pointsToMat(cv, screenCornersRef.current);
        const trackedCornersMat = new cv.Mat();
        cv.perspectiveTransform(cornersMat, trackedCornersMat, Hdelta);
        const trackedCorners = matToPoints(trackedCornersMat);

        const srcPts = pointsToMat(cv, trackedCorners);
        const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          1, 0,
          1, 1,
          0, 1,
        ]);

        const HimgToScreen = cv.getPerspectiveTransform(srcPts, dstPts);
        const HArray = homographyArrayFromMat(HimgToScreen);

        const cameraCenter = {
          x: src.cols / 2,
          y: src.rows / 2,
        };

        const screenPoint = applyHomographyToPoint(HArray, cameraCenter);
        const inside =
          !!screenPoint &&
          screenPoint.x >= 0 &&
          screenPoint.x <= 1 &&
          screenPoint.y >= 0 &&
          screenPoint.y <= 1;

        const screenArea = polygonArea(trackedCorners);
        const distanceScore = screenArea / (src.cols * src.rows);
        const isNear = distanceScore > 0.08;

        if (prevGrayRef.current) prevGrayRef.current.delete();
        prevGrayRef.current = gray.clone();

        if (prevPtsRef.current) prevPtsRef.current.delete();
        prevPtsRef.current = nextMat.clone();

        screenCornersRef.current = trackedCorners;

        setPose({
          detected: inside,
          mode: "tracking",
          corners: trackedCorners,
          screenCornersImage: trackedCorners,
          screenPoint: inside ? screenPoint : null,
          distanceScore,
          isNear: inside && isNear,
          markers: [],
          trackedFeatureCount: nextGood.length,
        });

        prevMat.delete();
        nextMat.delete();
        Hdelta.delete();
        cornersMat.delete();
        trackedCornersMat.delete();
        srcPts.delete();
        dstPts.delete();
        HimgToScreen.delete();
      } finally {
        nextPts.delete();
        status.delete();
        err.delete();
      }
    };

    const loop = () => {
      const video = videoRef.current;

      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const width = 640;
      const height = Math.round((video.videoHeight / video.videoWidth) * width);

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();

      try {
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        frameCountRef.current += 1;

        const forceRedetect =
          modeRef.current !== "tracking" || frameCountRef.current % 45 === 0;

        if (forceRedetect) {
          detectMarkersAndInitialize(gray, src);
        } else {
          trackScreen(gray, src);
        }
      } catch (e) {
        console.error(e);
        cleanupTracking();
        setPose({
          ...EMPTY_POSE,
          mode: "lost",
        });
      } finally {
        src.delete();
        gray.delete();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cleanupTracking();
    };
  }, [videoRef, cvReady, enabled]);

  return pose;
}