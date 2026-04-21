import CameraView from "@/components/CameraView";
import OverlayUI from "@/components/OverlayUI";
import PermissionGate from "@/components/PermissionGate";

export default function ARPage() {
  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000000",
      }}
    >
      <PermissionGate>
        <CameraView />
        <OverlayUI />
      </PermissionGate>
    </main>
  );
}