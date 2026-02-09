import { createAdminClient } from './supabase/admin';

/**
 * companyEmailでapp_usersテーブルからユーザーを検索
 */
export async function getUserByCompanyEmail(
  companyEmail: string
): Promise<{ id: string; employee_number: string; name: string; email: string; auth_user_id: string | null } | null> {
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
