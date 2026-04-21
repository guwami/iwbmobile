"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = {
  isStarting: boolean;
  isReady: boolean;
  error: string | null;
};

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    isStarting: false,
    isReady: false,
    error: null,
  });

  const startCamera = useCallback(async () => {
    try {
      setState({
        isStarting: true,
        isReady: false,
        error: null,
      });

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("このブラウザではカメラに対応していません。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("video要素が見つかりません。");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setState({
        isStarting: false,
        isReady: true,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "カメラの起動に失敗しました。";

      setState({
        isStarting: false,
        isReady: false,
        error: message,
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setState({
      isStarting: false,
      isReady: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    startCamera,
    stopCamera,
    ...state,
  };
}