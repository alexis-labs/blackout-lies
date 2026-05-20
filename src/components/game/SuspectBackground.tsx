import type { CSSProperties } from "react";

type SuspectBackgroundProps = {
  backgroundUrl?: string;
};

export function SuspectBackground({ backgroundUrl }: SuspectBackgroundProps) {
  return (
    <div
      className="suspect-background"
      aria-hidden="true"
      style={
        {
          "--suspect-background-image": backgroundUrl
            ? `url("${backgroundUrl}")`
            : "none",
        } as CSSProperties
      }
    />
  );
}
