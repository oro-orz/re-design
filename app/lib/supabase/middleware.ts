import { NextResponse, type NextRequest } from "next/server";

/**
 * 認証は各 page / API で getCurrentUserFromSession() または Firebase にて実施。
 * Supabase Auth は廃止したため、ここではリダイレクト等は行わない。
 */
export async function updateSession(_request: NextRequest) {
  return NextResponse.next();
}
