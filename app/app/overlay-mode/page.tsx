import { redirect } from "next/navigation";

/** /overlay-mode は /overlay-mode/new へリダイレクト */
export default function OverlayModePage() {
  redirect("/overlay-mode/new");
}
