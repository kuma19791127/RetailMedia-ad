const PptxGenJS = require('pptxgenjs');
const docx = require('docx');
const fs = require('fs');

async function createDocs() {
    // Create a new Presentation
    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Slide 1: Title
    let slide1 = pptx.addSlide();
    slide1.background = { color: 'ffffff' };
    slide1.addText('次世代リテールメディアシステム\n(retail-ad / Connect)', { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 44, bold: true, color: 'f43f5e', align: 'center' });
    slide1.addText('次世代ビジネスモデル＆事業計画資料', { x: 0.5, y: 3.5, w: 9, h: 1, fontSize: 24, color: '334155', align: 'center' });

    // Slide 2: Problem
    let slide2 = pptx.addSlide();
    slide2.addText('現在のリテールメディア・通信インフラの課題と限界', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 24, bold: true, color: '334155', fill: { color: "f1f5f9" } });
    slide2.addText([
        { text: '1. 既存サイネージの効果が不透明\n', options: { fontSize: 18, bullet: true, bold: true } },
        { text: '（誰がいつ見ているか、さらには実際の「POS売上」に直結しているかが不明）\n\n', options: { fontSize: 14, color: '64748b' } },
        { text: '2. コンテンツ不足と鮮度の低下\n', options: { fontSize: 18, bullet: true, bold: true } },
        { text: '（店舗側でイチから動画を作る費用負担が高く、同じ動画が数ヶ月流れ続ける陳腐化）\n\n', options: { fontSize: 14, color: '64748b' } },
        { text: '3. Webクリエイターの新たな「収益源」の不足\n', options: { fontSize: 18, bullet: true, bold: true } },
        { text: '（YouTubeやTikTokなど既存SNSでのアルゴリズム変更による再生減等のリスクの分散・オフライン活用枠の欠如）\n', options: { fontSize: 14, color: '64748b' } }
    ], { x: 0.5, y: 1.5, w: 9, h: 4 });

    // Slide 3: Solution
    let slide3 = pptx.addSlide();
    slide3.addText('解決策: AI搭載・クリエイター統合による革新エコシステム', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 24, bold: true, color: '334155', fill: { color: "f1f5f9" } });
    slide3.addText([
        { text: '・コンテンツはYouTuber・TikTokerが完全供給 (CGM型)\n', options: { fontSize: 18, bold: true } },
        { text: '  事前にAI(Amazon Rekognition等)審査を実施し、公序良俗・ポリシー違反を排除してテスト配信。\n\n', options: { fontSize: 14, color: '64748b' } },
        { text: '・店舗AIカメラによる「完全成果主義 / 最適化エンジン」\n', options: { fontSize: 18, bold: true } },
        { text: '  注視率(Attention)と離脱率(Skip)を計測し、見られない動画はシステムが自動「BAN（配信停止）」を実施。\n\n', options: { fontSize: 14, color: '64748b' } },
        { text: '・POSデータ連動による「Sales Uplift分析」とプログラマティック買付\n', options: { fontSize: 18, bold: true } },
        { text: '  動画直後の放映商品の実売上増加を測定し、広告主がDSP(RTB)オークションで枠を効果的に落札。', options: { fontSize: 14, color: '64748b' } }
    ], { x: 0.5, y: 1.6, w: 9, h: 3.8 });

    // Slide 4: Business Model
    let slide4 = pptx.addSlide();
    slide4.addText('ビジネスモデルと収益循環モデル (Rev. Share)', { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 24, bold: true, color: '334155', fill: { color: "f1f5f9" } });
    slide4.addText([
        { text: '◆ 広告主や代理店からの出稿予算を中心として、関わる3者全てに分配・還元する枠組みを構築:\n\n', options: { fontSize: 18, bold: true } },
        { text: ' 💰 クリエイター (Creator)\n', options: { fontSize: 16, bold: true } },
        { text: '   「集客でき、見られる動画」を提供した再生数と成果の対価として報酬分配（月末締め翌月末等自動処理）。\n\n', options: { fontSize: 14, color: '64748b' } },
        { text: ' 🏪 店舗 / 小売企業 (Retailer)\n', options: { fontSize: 16, bold: true } },
        { text: '   広告の放映枠(場所・サイネージ機材)を提供した対価。集客+商品の実売上もUPするWin-Win。\n\n', options: { fontSize: 14, color: '64748b' } },
        { text: ' ⚙️ プラットフォーマー (retail-ad Owner)\n', options: { fontSize: 16, bold: true } },
        { text: '   システム利用料、AI分析手数料（DSPマージン含む）としてシステム全体からプラットフォーム利益を獲得。', options: { fontSize: 14, color: '64748b' } }
    ], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

    await pptx.writeFile({ fileName: 'retail-ad_BusinessModel_Presentation.pptx' });
    console.log('[Success] PowerPoint (retail-ad_BusinessModel_Presentation.pptx) generated!');

    // Word Document
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "次世代リテールメディアシステム (retail-ad / Connect)",
                    heading: HeadingLevel.TITLE,
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: "事業計画・システムモデル仕様＆ビジネスサマリー",
                    heading: HeadingLevel.HEADING_2,
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 600 }
                }),

                new Paragraph({ text: "1. プロジェクト・サービスの概要", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                new Paragraph({
                    children: [
                        new TextRun("本システムは、実店舗のデジタルサイネージ（放映端末）、クリエイター（コンテンツ生成）、および広告主のデータ分析・出稿システムを統合した革新的な「AI駆動型リテールメディア」プラットフォームです。"),
                    ],
                    spacing: { after: 200 }
                }),

                new Paragraph({ text: "2. コア機能とシステム構成", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                new Paragraph({ text: "① クリエイターポータル (Creator Portal)", heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: "SNSなどで活躍するクリエイターが、独自コンテンツをアップロードする専用画面。Amazon Rekognition等の画像解析AIを繋ぎ、事前審査（コンプライアンス等）を経てテスト配信を行います。「シナジースコア（注視・維持・売上相関）」に連動した広告収益を獲得・管理（銀行振込情報の設定や通知受取など）を自動化します。" }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "② 広告主ダッシュボード (Advertiser Hub)", heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: "広告代理店や企業が店舗でのインプレッション（AI顔認識ベース）や視認時間（Attention）、およびPOSデータと連動した「Sales Uplift（実際の売上寄与）」をリアルタイム可視化します。DSP(RTB)での自動オークション入札や、モーメント配信(天候・気温等に連動)キャンペーンの構築が数クリックで可能です。" }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "③ 店舗用サイネージ(Signage Player) とAI分析", heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: "カメラデバイスを通じて年齢・性別を推定し、視聴者の「注視率」と「離脱率」をシステム側でリアルタイムに解析。成績の悪い（親和性や魅力が低い）動画を「Auto BAN最適化エンジン」により自動的に配信ローテーションから排除します。" }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "④ 管理者・経理ポータル (Admin Platform)", heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: "広告主からの請求額、クリエイターへの分配額、店舗へのマージンをシステムが集約・自動計算し、確定や一括支払メール通知（ペイアウト）などをボタン1つで統合管理します。" }),

                new Paragraph({ text: "3. 独自のビジネスモデル・マネタイズ構造", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                new Paragraph({
                    children: [
                        new TextRun("店舗への手厚い集客・販売促進サポートと同時に、YouTuber等クリエイターの新しい「オフライン収益源」を生み出します。広告主（および代理店経由等）から発生する広告投下予算はシステムを通り、店舗（場所代）・クリエイター（コンテンツ代）、そしてシステムのプラットフォーム利用料（手数料・DSPマージン）の3方向へレベニューシェアされる構造となっており、関係者すべてにメリットがある安定した収益循環を作ります。"),
                    ]
                }),
            ],
        }],
    });

    const b64string = await Packer.toBuffer(doc);
    fs.writeFileSync('retail-ad_BusinessModel_Document.docx', b64string);
    console.log('[Success] Word Document (retail-ad_BusinessModel_Document.docx) generated!');
}

createDocs().catch(err => {
    console.error(err);
});
