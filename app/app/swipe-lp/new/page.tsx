import { redirect } from "next/navigation";

/** 旧 /swipe-lp/new を v3 へリダイレクト */
export default function NewSwipeLPRedirect() {
  redirect("/swipe-lp/v3/new");
}
