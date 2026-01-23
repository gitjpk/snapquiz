"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface JoinQrCodeProps {
  joinUrl: string;
  size?: number;
}

export function JoinQrCode({ joinUrl, size = 200 }: JoinQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (err) => {
          if (err) {
            console.error("QR Code generation failed:", err);
            setError(true);
          }
        }
      );
    }
  }, [joinUrl, size]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-white"
        style={{ width: size, height: size }}
      >
        <p className="text-sm text-slate-500">QR Code unavailable</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg"
      style={{ width: size, height: size }}
    />
  );
}
