const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * HTML を取得する。直接取得を試し、失敗時は外部プロキシを順に試行する。
 */
export async function fetchHtml(url: string): Promise<string> {
  try {
    const direct = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    });
    if (direct.ok) {
      const text = await direct.text();
      if (text?.length) return text;
    }
  } catch {
    // 直接取得失敗時はプロキシへ
  }

  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const res = await fetch(PROXIES[i](url), {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text?.length) continue;
      return text;
    } catch {
      continue;
    }
  }

  throw new Error("ページの取得に失敗しました（直接取得・プロキシとも利用できません）");
}
