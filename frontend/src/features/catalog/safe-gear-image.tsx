"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type SafeGearImageProps = ImageProps & {
  fallbackSrc?: string;
};

export function SafeGearImage({
  src,
  alt,
  fallbackSrc = "/gear-placeholder.svg",
  onError,
  ...props
}: SafeGearImageProps) {
  const [failed, setFailed] = useState(false);
  const sourceKey = typeof src === "string" ? src : JSON.stringify(src);

  useEffect(() => {
    setFailed(false);
  }, [sourceKey]);

  const displayedSrc = failed ? fallbackSrc : src;

  return (
    <Image
      {...props}
      src={displayedSrc}
      alt={alt}
      onError={(event) => {
        onError?.(event);
        if (!failed && displayedSrc !== fallbackSrc) {
          setFailed(true);
        }
      }}
    />
  );
}
