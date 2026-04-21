declare global {
  interface Window {
    cv: any;
    onOpenCvReady?: () => void;
  }
}

export {};