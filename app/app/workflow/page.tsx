"use client";

import Link from "next/link";
import { Sparkles, ImagePlus, UsersRound, LayoutList, MessageSquare, ExternalLink } from "lucide-react";
import { WorkflowSection } from "../components/workflow/WorkflowSection";

// 画像は内容に合わせて正しいセクションに割り当て
const WORKFLOW_ITEMS = [
  {
    id: "step-url-analysis",
    title: "URL入力と分析（Step 1〜2）",
    description:
      "LP・競合サイトのURLを入力すると、AIがマーケティング分析（ビジネスタイプ・ターゲット・3C・AIDMAなど）を実行し、分析結果とインサイトを表示します。",
    image: "/workflow/image-step1-url-analysis.png",
    imageAlt: "URL入力と分析結果・3C・AIDMA",
    cta: { label: "スライド生成を始める", href: "/swipe-lp/" },
  },
  {
    id: "step-supplement",
    title: "補足情報の入力（Step 3）",
    description:
      "強調したい点やスライド枚数を指定し、「次へ: スライドテキストを作成」でスライド構成の提案に進みます。",
    image: "/workflow/image-step2-supplement.png",
    imageAlt: "Step3 スライドテキストの設定",
    cta: { label: "スライド生成を始める", href: "/swipe-lp/" },
  },
  {
    id: "step-slides",
    title: "スライド構成と編集（Step 4）",
    description:
      "AIが提案したスライド一覧をクリックして詳細を編集。デザインイメージ・メインコピー・サブコピー・追加テキスト・ナレーション原稿などを設定できます。",
    image: "/workflow/image-step3-slides.png",
    imageAlt: "Step4 スライド構成と詳細編集",
    cta: { label: "スライド生成を始める", href: "/swipe-lp/" },
  },
  {
    id: "prompt-modal",
    title: "デザインでプロンプトを生成（モーダル）",
    description:
      "ライブラリからデザインを選び、メインコピー・サブコピー・追加テキストを入力。アスペクト比や生成モード（人物あり/なし・テキストあり/なし）を選んでプロンプトを生成します。",
    image: "/workflow/image-fc9ec49d-c8fb-43e2-91dd-ed50a7c115bc.jpg",
    imageAlt: "このデザインでプロンプトを生成モーダル（入力欄）",
    cta: { label: "プロンプト生成へ", href: "/" },
  },
  {
    id: "generated-prompt",
    title: "生成されたプロンプト",
    description:
      "英語のデザインプロンプトが生成され、コピーボタンで画像AI（NanoBanana・DALL-E等）に貼り付けて使用します。",
    image: "/workflow/image-3879e6fe-d8f8-4c91-a062-4c34a9d4a318.png",
    imageAlt: "生成されたプロンプトとコピー",
    cta: { label: "プロンプト生成へ", href: "/" },
  },
  {
    id: "ad-preview",
    title: "広告プレビュー（生成結果イメージ）",
    description:
      "プロンプトを画像AIで実行した場合のイメージ。キャッチコピー・チェックリスト・人物ビジュアルが指定どおりに構成されます。",
    image: "/workflow/image-e32615e8-68f9-46ae-9e06-2b25ce9dc5a7.png",
    imageAlt: "生成された広告プレビュー",
    cta: { label: "NanoBananaで画像を生成", href: "https://gemini.google.com/app", external: true },
  },
  {
    id: "style-settings",
    title: "スタイル設定とテキストスロット",
    description:
      "テンプレートのスタイル設定（撮影・ライト・デザイン・レイアウト・タイポ・配色・装飾・ムード）とテキストスロットの説明。プレビューと連動しています。",
    image: "/workflow/image-6dcf5053-0eb1-4508-811d-cc87c6c5c824.jpg",
    imageAlt: "スタイル設定パネルとプレビュー",
    cta: { label: "プロンプト生成へ", href: "/" },
  },
  {
    id: "base-text-remove",
    title: "ベース画像生成（テキスト削除）",
    description:
      "参考画像をアップロードし、「テキストを削除する」「装飾を残す」などでテキストなしのベース画像を生成。動画オーバーレイの土台に利用できます。",
    image: "/workflow/image-6a379538-a567-4203-8e8d-33795dea55f0.png",
    imageAlt: "ベース画像生成・テキスト削除",
    cta: { label: "ベース生成へ", href: "/overlay-mode/new" },
  },
  {
    id: "base-person-change",
    title: "ベース画像生成（人物変更）",
    description:
      "「人物を変更する」でターゲット（例: 40代女性キャリア）を選択すると、同じ構図・装飾のまま人物だけ差し替えたベース画像を生成できます。",
    image: "/workflow/image-0ae627fa-0410-44a8-a5a9-a4b0eedfc12e.png",
    imageAlt: "ベース画像生成・人物変更",
    cta: { label: "ベース生成へ", href: "/overlay-mode/new" },
  },
  {
    id: "char-multipose",
    title: "キャラ生成：マルチポーズ",
    description:
      "キャラ参照画像を1枚アップロードし、生成枚数（4枚・6枚・9枚・12枚）を選ぶと、同じキャラの様々なポーズ・表情をまとめて生成できます。プロンプト不要で一括ダウンロード（ZIP）可能です。",
    image: "/workflow/image-841d78f6-d3f0-4a69-be36-af6626d9085f.png",
    imageAlt: "キャラ生成・マルチポーズ",
    cta: { label: "キャラ生成へ", href: "/character-tools" },
  },
  {
    id: "char-scene",
    title: "キャラ生成：キャラ別シーン",
    description:
      "キャラ参照画像と「シーンの説明」（どこにいるか・何をしているか・ポーズ・雰囲気など）を入力すると、そのキャラで別シーンの画像を生成できます。窓際で勉強している様子など、テキストで指定するだけです。",
    image: "/workflow/image-db0a4ae8-fc6c-4990-9022-18fc88f4ec7f.png",
    imageAlt: "キャラ生成・キャラ別シーン",
    cta: { label: "キャラ生成へ", href: "/character-tools" },
  },
];

export default function WorkflowPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 flex min-h-[52px] items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">Re:Design</h1>
            <p className="text-[10px] text-neutral-500 leading-tight">ワークフロー</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            プロンプト生成
          </Link>
          <Link
            href="/overlay-mode/new"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <ImagePlus className="w-3 h-3 shrink-0" />
            ベース生成
          </Link>
          <Link
            href="/character-tools"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <UsersRound className="w-3 h-3 shrink-0" />
            キャラ生成
          </Link>
          <Link
            href="/swipe-lp/"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <LayoutList className="w-3 h-3 shrink-0" />
            スライド生成
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            フィードバック
          </Link>
          <a
            href="https://gemini.google.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            NanoBanana
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            DALL·E 3
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">
          Re:Design ワークフロー
        </h1>
        <p className="mb-8 text-neutral-500">
          スライド生成からベース画像・キャラ生成までの主な画面です。
        </p>

        <div className="space-y-8">
          {WORKFLOW_ITEMS.map((item, i) => (
            <WorkflowSection
              key={item.id}
              id={item.id}
              index={i + 1}
              title={item.title}
              description={item.description}
              imageSrc={item.image}
              imageAlt={item.imageAlt}
              cta={item.cta}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
