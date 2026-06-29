from PIL import Image, ImageDraw, ImageFont
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

output_image_path = r"C:\Users\one\Desktop\retail_media_business_vision.png"

# スケール倍率設定 (3倍にスケールアップ)
SCALE = 3

# フォントの選択
font_paths = [
    r"C:\Windows\Fonts\meiryo.ttc",
    r"C:\Windows\Fonts\msgothic.ttc",
    r"C:\Windows\Fonts\yugothm.ttc"
]
bold_font_paths = [
    r"C:\Windows\Fonts\meiryob.ttc",
    r"C:\Windows\Fonts\msgothic.ttc",
    r"C:\Windows\Fonts\yugothb.ttc"
]

font_path = None
for fp in font_paths:
    if os.path.exists(fp):
        font_path = fp
        break

bold_font_path = None
for bfp in bold_font_paths:
    if os.path.exists(bfp):
        bold_font_path = bfp
        break

# 見つからない場合のフォールバック
if not font_path:
    print("Error: No Japanese font found.")
    sys.exit(1)
if not bold_font_path:
    bold_font_path = font_path

def draw_text_center(draw, text, cx, cy, fsize, bold=False, color=(255, 255, 255, 255)):
    fpath = bold_font_path if bold else font_path
    
    index_val = 0
    if bold and "meiryob" in fpath.lower():
        index_val = 0
    
    font = ImageFont.truetype(fpath, fsize, index=index_val)
    lines = text.split('\n')
    line_spacing = fsize + (6 * SCALE) # 解像度に合わせた適切な行間
    total_h = len(lines) * line_spacing - (6 * SCALE)
    start_y = cy - total_h // 2
    
    for idx, line in enumerate(lines):
        try:
            l, t, r, b = draw.textbbox((0, 0), line, font=font)
            text_w = r - l
        except AttributeError:
            text_w, _ = draw.textsize(line, font=font)
            
        text_x = cx - text_w // 2
        text_y = start_y + idx * line_spacing
        
        if bold and fpath == font_path:
            # 擬似太字
            offset = 1 * SCALE
            for offset_x in range(-offset, offset + 1):
                for offset_y in range(-offset, offset + 1):
                    draw.text((text_x + offset_x, text_y + offset_y), line, fill=color, font=font)
        else:
            draw.text((text_x, text_y), line, fill=color, font=font)

def draw_arrow(draw, start, end, color=(148, 163, 184, 255), width=6, label=""):
    x0, y0 = start
    x1, y1 = end
    
    draw.line([x0, y0, x1, y1], fill=color, width=width)
    
    import math
    angle = math.atan2(y1 - y0, x1 - x0)
    arrow_size = 10 * SCALE # スケール追従
    
    ax0 = x1 - arrow_size * math.cos(angle - math.pi/6)
    ay0 = y1 - arrow_size * math.sin(angle - math.pi/6)
    ax1 = x1 - arrow_size * math.cos(angle + math.pi/6)
    ay1 = y1 - arrow_size * math.sin(angle + math.pi/6)
    
    draw.polygon([x1, y1, ax0, ay0, ax1, ay1], fill=color)
    
    if label:
        cx = (x0 + x1) // 2
        cy = (y0 + y1) // 2
        offset = 18 * SCALE
        if abs(x1 - x0) > abs(y1 - y0):
            cy -= offset
        else:
            cx += offset
        draw_text_center(draw, label, cx, cy, 9 * SCALE, color=(241, 245, 249, 255))

def draw_card(draw, title, desc, cx, cy, w=240 * SCALE, h=110 * SCALE, border_color=(56, 189, 248, 255), title_color=(56, 189, 248, 255)):
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = cx + w // 2
    y1 = cy + h // 2
    
    draw.rounded_rectangle([x0, y0, x1, y1], radius=8 * SCALE, fill=(15, 23, 42, 255), outline=border_color, width=2 * SCALE)
    draw_text_center(draw, title, cx, cy - (25 * SCALE), 12 * SCALE, bold=True, color=title_color)
    draw_text_center(draw, desc, cx, cy + (18 * SCALE), 9 * SCALE, color=(248, 250, 252, 255))

def main():
    print(f"Generating ultra-high-resolution business vision diagram (SCALE = {SCALE})...")
    # キャンバスサイズを元の 960x720 の3倍である 2880x2160 にスケールアップ
    img = Image.new("RGBA", (960 * SCALE, 720 * SCALE), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # 各座標をスケール
    x_left = 180 * SCALE
    x_center = 450 * SCALE
    x_right = 720 * SCALE
    
    y_top = 200 * SCALE
    y_bottom = 480 * SCALE
    
    # 1. 接続線 (アロー) の描画 (背面に配置)
    draw_arrow(draw, (x_left + 120 * SCALE, y_top), (x_center - 120 * SCALE, y_top), color=(59, 130, 246, 255), label="共同運営で解決")
    draw_arrow(draw, (x_center + 120 * SCALE, y_top), (x_right - 120 * SCALE, y_top), color=(16, 185, 129, 255), label="メディア化ソリューション")
    draw_arrow(draw, (x_center, y_top + 55 * SCALE), (x_right - 100 * SCALE, y_bottom), color=(245, 158, 11, 255), label="エコシステム構築")
    draw_arrow(draw, (x_right, y_top + 55 * SCALE), (x_left, y_bottom - 55 * SCALE), color=(6, 182, 212, 255), label="購入場所での価値")
    draw_arrow(draw, (x_right, y_bottom - 55 * SCALE), (x_center, y_bottom - 55 * SCALE), color=(139, 92, 246, 255), label="広告収益 ➡ 店舗へ")
    draw_arrow(draw, (x_center - 120 * SCALE, y_bottom), (x_left, y_top + 55 * SCALE), color=(239, 68, 68, 255), label="経営圧迫を劇的に緩和")

    # 2. 各カードの描画 (前面に配置、すべてスケール対応)
    draw_card(draw, 
              "小売りを圧迫する経営環境", 
              "・構造的な「低利益率」\n・売上に対する高い人件費比率\n・昨今の物価高・建築費高騰", 
              x_left, y_top, 
              border_color=(239, 68, 68, 255), 
              title_color=(239, 68, 68, 255))
    
    draw_card(draw, 
              "広告事業 of 共同運営モデル", 
              "・複数スーパーによる広告NW構成\n・窓口一本化でメーカー広告誘致\n・経営資源がなくても即開始可能", 
              x_center, y_top, 
              border_color=(59, 130, 246, 255), 
              title_color=(59, 130, 246, 255))
    
    draw_card(draw, 
              "壁①：顧客の注目を集める", 
              "・購入直前の顧客へ売場で直接訴求\n・AI店内アナウンス等と音声同期\n・お得・有益な情報で数秒を楽しむ", 
              x_right, y_top, 
              border_color=(16, 185, 129, 255), 
              title_color=(16, 185, 129, 255))
    
    draw_card(draw, 
              "壁②：投稿・配信エコシステム", 
              "・広告主/クリエイターが直接投稿\n・Geminiによる自動モデレーション\n・再生統計に基づき収益を公正分配", 
              x_right, y_bottom, 
              border_color=(245, 158, 11, 255), 
              title_color=(245, 158, 11, 255))

    draw_card(draw, 
              "高収益の創出 ＆ 店舗DX", 
              "・商品粗利以外の高粗利広告収入\n・店内マニュアル・シフト等のDX化\n・店舗を「利益を生むメディア」へ", 
              x_center, y_bottom, 
              border_color=(139, 92, 246, 255), 
              title_color=(139, 92, 246, 255))

    draw_card(draw, 
              "来店顧客への体験価値向上", 
              "・売場近くでの魅力的な料理レシピ\n・地元の有益情報、特売の即時表示\n・買い物中に楽しさを提供する売場", 
              x_left, y_bottom, 
              border_color=(6, 182, 212, 255), 
              title_color=(6, 182, 212, 255))

    # メインタイトル (3倍スケール)
    draw_text_center(draw, "リテアド：小売りサイネージ広告共同運営モデルと課題解決ビジョン", 480 * SCALE, 35 * SCALE, 18 * SCALE, bold=True, color=(255, 255, 255, 255))
    
    img.save(output_image_path)
    print(f"Success: Ultra-high-resolution business vision diagram saved to {output_image_path}")

if __name__ == "__main__":
    main()
