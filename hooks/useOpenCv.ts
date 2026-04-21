"use client";

import { useEffect, useState } from "react";

export function useOpenCv() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.cv) {
      setReady(true);
      return;
    }

    const existing = document.getElementById("opencv-script");
    if (existing) {
      const check = setInterval(() => {
        if (window.cv) {
          clearInterval(check);
          setReady(true);
        }
      }, 300);
      return () => clearInterval(check);
    }

    const script = document.createElement("script");
    script.id = "opencv-script";
    script.async = true;
    script.src = "/opencv/opencv.js";

    script.onload = () => {
      const check = setInterval(() => {
        if (window.cv) {
          clearInterval(check);
          setReady(true);
        }
      }, 300);

      setTimeout(() => {
        if (!window.cv) {
          clearInterval(check);
          setError("OpenCV.js の読み込みに失敗しました。");
        }
      }, 10000);
    };

    script.onerror = () => {
      setError("OpenCV.js の script 読み込みに失敗しました。");
    };

    document.body.appendChild(script);
  }, []);

  return { ready, error };
}