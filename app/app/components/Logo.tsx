"use client";

import { fjallaOne } from "@/lib/fonts";

type LogoProps = {
  className?: string;
  as?: "h1" | "span";
};

export function Logo({ className = "", as: Component = "span" }: LogoProps) {
  return (
    <Component className={`${fjallaOne.className} ${className}`.trim()}>
      <span className="font-bold">Re:</span>
      <span className="font-light">Design</span>
    </Component>
  );
}
