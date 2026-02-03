import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** 旧形式の /swipe-lp/[id] を v3 へリダイレクト */
export default async function OldSwipeLPProjectRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/swipe-lp/v3/${id}`);
}
