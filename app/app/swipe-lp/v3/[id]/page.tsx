import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** /swipe-lp/v3/[id] を /swipe-lp/[id] へリダイレクト（旧URL互換） */
export default async function SwipeLPv3ProjectRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/swipe-lp/${id}`);
}
