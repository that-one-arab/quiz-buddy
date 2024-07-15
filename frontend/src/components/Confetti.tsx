import React, { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";

export default function Confetti({ duration = 3000 }: { duration?: number }) {
  const { width, height } = useWindowSize();
  const [isConfettiActive, setIsConfettiActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConfettiActive(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration]);

  if (!width || !height) {
    return null;
  }

  return (
    <ReactConfetti
      width={width}
      height={height}
      gravity={0.4}
      numberOfPieces={isConfettiActive ? 200 : 0}
    />
  );
}
