from PIL import Image, ImageDraw, ImageFont
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

output_image_path = r"C:\Users\one\Desktop\retail_media_business_vision.png"

# フォントの選択
font_paths = [
    r"C:\Windows\Fonts\meiryo.ttc",
    r"C:\Windows\Fonts\msgothic.ttc",
    r"C:\Windows\Fonts\yugothm.ttc"
]
font_path = None
for fp in font_paths:
    if os.path.exists(fp):
        font_path = fp
        break

if not font_path:
    print("Error: No Japanese font found.")
    sys.exit(1)

def draw_text_center(draw, text, cx, cy, fsize, bold=False, color=(243, 244, 246, 255)):
    font = ImageFont.truetype(font_path, fsize)
    lines = text.split('\n')
    line_spacing = fsize + 6
    total_h = len(lines) * line_spacing - 6
    start_y = cy - total_h // 2
    
    for idx, line in enumerate(lines):
        try:
            l, t, r, b = draw.textbbox((0, 0), line, font=font)
            text_w = r - l
        except AttributeError:
            text_w, _ = draw.textsize(line, font=font)
            
        text_x = cx - text_w // 2
        text_y = start_y + idx * line_spacing
        
        if bold:
            for offset_x in [-1, 0, 1]:
                for offset_y in [-1, 0, 1]:
                    draw.text((text_x + offset_x, text_y + offset_y), line, fill=color, font=font)
        else:
            draw.text((text_x, text_y), line, fill=color, font=font)

def draw_arrow(draw, start, end, color=(100, 116, 139, 255), width=2, label=""):
    x0, y0 = start
    x1, y1 = end
    
    draw.line([x0, y0, x1, y1], fill=color, width=width)
    
    import math
    angle = math.atan2(y1 - y0, x1 - x0)
    arrow_size = 10
    
    ax0 = x1 - arrow_size * math.cos(angle - math.pi/6)
    ay0 = y1 - arrow_size * math.sin(angle - math.pi/6)
    ax1 = x1 - arrow_size * math.cos(angle + math.pi/6)
    ay1 = y1 - arrow_size * math.sin(angle + math.pi/6)
    
    draw.polygon([x1, y1, ax0, ay0, ax1, ay1], fill=color)
    
    if label:
        cx = (x0 + x1) // 2
        cy = (y0 + y1) // 2
        if abs(x1 - x0) > abs(y1 - y0):
            cy -= 18
        else:
            cx += 18
        draw_text_center(draw, label, cx, cy, 9, color=(148, 163, 184, 255))

def draw_card(draw, title, desc, cx, cy, w=240, h=110, border_color=(56, 189, 248, 255), title_color=(56, 189, 248, 255)):
    x0 = cx - w // 2
    y0 = cy - h // 2
    x1 = cx + w // 2
    y1 = cy + h // 2
    
    draw.rounded_rectangle([x0, y0, x1, y1], radius=12, fill=(30, 41, 59, 255), outline=border_color, width=2)
    draw_text_center(draw, title, cx, cy - 25, 12, bold=True, color=title_color)
    draw_text_center(draw, desc, cx, cy + 18, 9, color=(148, 163, 184, 255))

def main():
    print("Generating business vision diagram...")
    img = Image.new("RGBA", (960, 720), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # 1. 接続線 (アロー) の描画
    # 左上 ➡ 中央上 (ビジネスモデル変革)
    draw_arrow(draw, (300, 200), (330, 200), color=(59, 130, 246, 255), label="共同運営で解決")
    
    # 中央上 ➡ 右上 (壁①解決へ)
    draw_arrow(draw, (570, 200), (620, 200), color=(16, 185, 129, 255), label="メディア化ソリューション")
    
    # 中央上 ➡ 右下 (壁②解決へ)
    draw_arrow(draw, (450, 255), (600, 480), color=(245, 158, 11, 255), label="エコシステム構築")

    # 右上 ➡ 左下 (顧客体験への還元)
    draw_arrow(draw, (720, 255), (180, 425), color=(6, 182, 212, 255), label="購入場所での価値")

    # 右下 ➡ 中下 (高利益率の広告収益)
    draw_arrow(draw, (720, 425), (450, 425), color=(139, 92, 246, 255), label="広告収益 ➡ 店舗へ")

    # 中下 ➡ 左上 (経営改善ループ完了)
    draw_arrow(draw, (330, 480), (180, 255), color=(239, 68, 68, 255), label="経営圧迫を劇的に緩和")

    # 2. 各カードの描画
    # 左上: 業界の背景・課題 (赤)
    draw_card(draw, 
              "小売りを圧迫する経営環境", 
              "・構造的な「低利益率」\n・売上に対する高い人件費比率\n・昨今の物価高・建築費高騰", 
              180, 200, 
              border_color=(239, 68, 68, 255), 
              title_color=(239, 68, 68, 255))
    
    # 中央上: リテアドの解決策 (青)
    draw_card(draw, 
              "広告事業の共同運営モデル", 
              "・複数スーパーによる広告NW構成\n・窓口一本化でメーカー広告誘致\n・経営資源がなくても即開始可能", 
              450, 200, 
              border_color=(59, 130, 246, 255), 
              title_color=(59, 130, 246, 255))
    
    # 右上: 課題・壁① (緑)
    draw_card(draw, 
              "壁①：顧客の注目を集める", 
              "・購入直前の顧客へ売場で直接訴求\n・AI店内アナウンス等と音声同期\n・お得・有益な情報で数秒を楽しむ", 
              720, 200, 
              border_color=(16, 185, 129, 255), 
              title_color=(16, 185, 129, 255))
    
    # 右下: 課題・壁② (黄)
    draw_card(draw, 
              "壁②：投稿・配信エコシステム", 
              "・広告主/クリエイターが直接投稿\n・Geminiによる自動モデレーション\n・再生統計に基づき収益を公正分配", 
              720, 480, 
              border_color=(245, 158, 11, 255), 
              title_color=(245, 158, 11, 255))

    # 中下: 生み出されるDX・粗利 (紫)
    draw_card(draw, 
              "高収益の創出 ＆ 店舗DX", 
              "・商品粗利以外の高粗利広告収入\n・店内マニュアル・シフト等のDX化\n・店舗を「利益を生むメディア」へ", 
              450, 480, 
              border_color=(139, 92, 246, 255), 
              title_color=(139, 92, 246, 255))

    # 左下: 顧客体験の深化 (水色)
    draw_card(draw, 
              "来店顧客への体験価値向上", 
              "・売場近くでの魅力的な料理レシピ\n・地元の有益情報、特売の即時表示\n・買い物中に楽しさを提供する売場", 
              180, 480, 
              border_color=(6, 182, 212, 255), 
              title_color=(6, 182, 212, 255))

    # メインタイトル
    draw_text_center(draw, "リテアド：小売りサイネージ広告共同運営モデルと課題解決ビジョン", 480, 35, 18, bold=True, color=(255, 255, 255, 255))
    
    img.save(output_image_path)
    print(f"Success: Business vision diagram saved to {output_image_path}")

if __name__ == "__main__":
    main()
