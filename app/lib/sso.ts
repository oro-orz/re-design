import { createAdminClient } from './supabase/admin';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * companyEmailでapp_usersテーブルからユーザーを検索
 */
export async function getUserByCompanyEmail(
  companyEmail: string
): Promise<{ id: string; employee_number: string; name: string; email: string; auth_user_id: string } | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_users')
      .select('id, employee_number, name, email, auth_user_id')
      .eq('email', companyEmail)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // ユーザーが見つからない
        return null;
      }
      console.error('ユーザー検索エラー:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getUserByCompanyEmail エラー:', error);
    throw error;
  }
}

/**
 * Supabaseセッションを作成
 * ユーザーのメールアドレスを使用してマジックリンクを生成し、セッション作成用のトークンを返す
 */
export async function createSupabaseSession(
  userEmail: string
): Promise<{ hashed_token: string } | null> {
  try {
    const supabase = createAdminClient();

    // Supabase Admin APIを使用してマジックリンクを生成
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (error) {
      console.error('マジックリンク生成エラー:', error);
      throw error;
    }

    if (!data?.properties?.hashed_token) {
      console.error('マジックリンクトークンが生成されませんでした');
      return null;
    }

    return {
      hashed_token: data.properties.hashed_token,
    };
  } catch (error) {
    console.error('セッション作成エラー:', error);
    throw error;
  }
}

/**
 * Firebase ログイン後に Supabase セッションを発行する。
 * メールに対応する auth.users がなければ作成してからマジックリンクトークンを返す。
 */
export async function createSupabaseSessionForFirebaseEmail(
  userEmail: string
): Promise<{ hashed_token: string } | null> {
  const supabase = createAdminClient();
  const email = userEmail.toLowerCase().trim();

  // 既存ユーザーを検索（generateLink は既存ユーザーが前提のため、いなければ作成）
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!existing) {
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
    });
    if (createError) {
      console.error('Supabase createUser エラー:', createError);
      return null;
    }
  }

  return createSupabaseSession(email);
}
