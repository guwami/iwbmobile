"use client";

type PermissionGateProps = {
  children: React.ReactNode;
};

export default function PermissionGate({ children }: PermissionGateProps) {
  return <>{children}</>;
}