import "@/lib/polyfill-file";
import { getV3Project } from "@/actions/swipe-lp-v3";
import { notFound, redirect } from "next/navigation";
import SwipeLPv3View from "../v3/[id]/SwipeLPv3View";

type Props = { params: Promise<{ id: string }> };

export default async function SwipeLPProjectPage({ params }: Props) {
  const { id } = await params;
  const { project, error, isOwner } = await getV3Project(id);

  if (error === "認証が必要です") {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/swipe-lp/${id}`)}`);
  }

  if (error || !project) {
    notFound();
  }

  return <SwipeLPv3View project={project} readOnly={!isOwner} />;
}
