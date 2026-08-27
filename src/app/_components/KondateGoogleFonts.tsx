// 献立ページ専用フォント（Mochiy Pop One / Zen Maru Gothic）の読み込み。
// この2書体はnext/font/googleの自動セルフホスティングだと英数字サブセットしか
// 生成されず日本語グリフが欠落するため、通常の<link>で読み込む。
// Reactが<link>をページ内のどこに書いても自動的に<head>へ集約・重複排除してくれるので、
// 献立ページ（一覧表示・月表示の両方）から個別に呼び出しても二重読み込みにはならない。
export function KondateGoogleFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router未対応の旧ルールによる誤検知。
          next/fontの自動セルフホスティングでは日本語グリフが欠落するため、意図的に通常の<link>を使っている。 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Zen+Maru+Gothic:wght@500;700;900&display=swap"
      />
    </>
  );
}
