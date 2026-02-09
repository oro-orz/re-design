import { redirect } from "next/navigation";

/** /swipe-lp/v3/new を /swipe-lp/ へリダイレクト（旧URL互換） */
export default function SwipeLPv3NewRedirect() {
  redirect("/swipe-lp/");
}
