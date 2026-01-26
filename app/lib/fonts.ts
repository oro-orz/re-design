import { Fjalla_One, Noto_Sans_JP } from "next/font/google";

export const fjallaOne = Fjalla_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const notoSans = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
