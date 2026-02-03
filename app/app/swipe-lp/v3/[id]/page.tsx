import "@/lib/polyfill-file";
import { getV3Project } from "@/actions/swipe-lp-v3";
import { notFound } from "next/navigation";
import SwipeLPv3View from "./SwipeLPv3View";

type Props = { params: Promise<{ id: string }> };

export default async function SwipeLPv3ProjectPage({ params }: Props) {
  const { id } = await params;
  const { project, error } = await getV3Project(id);

  if (error || !project) {
    notFound();
  }

  return <SwipeLPv3View project={project} />;
}
