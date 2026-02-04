import { redirect } from "next/navigation";

/** /swipe-lp/new を /swipe-lp/ へリダイレクト */
export default function NewSwipeLPRedirect() {
  redirect("/swipe-lp/");
}
