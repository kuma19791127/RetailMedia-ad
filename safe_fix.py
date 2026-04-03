import re
import io

def fix_store_portal():
    with io.open('store_portal.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # store_portal has a bottom navigation or sidebar.
    # We want to add the link after AIボイススタジオ. Let's find AIボイススタジオ and its closing </a> tag
    original = r'(<a[^>]*.*?AIボイススタジオ.*?</a>)'
    replacement = r'\1\n        <a href="anywhere_lp.html" class="nav-item" target="_blank">\n            <i class="fa-solid fa-cash-register"></i><span>どこでもレジ (LP)</span>\n        </a>'
    
    # Actually, store_portal.html has <i>✨</i><span>AIボイススタジオ</span>
    # We'll just replace literal for exact match.
    content = re.sub(r'(<i>✨</i><span>AIボイススタジオ</span>\s*</a>)', 
                     r'\1\n        <a href="anywhere_lp.html" class="nav-item" target="_blank">\n            <i class="fa-solid fa-cash-register"></i><span>どこでもレジ (LP)</span>\n        </a>', 
                     content)

    with io.open('store_portal.html', 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

def fix_css_overflow(filename):
    with io.open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'overflow-x: hidden' not in content:
        content = re.sub(r'body\s*\{', 'body {\n            overflow-x: hidden;\n            max-width: 100vw;\n            box-sizing: border-box;', content, count=1)
        
    with io.open(filename, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

def fix_shift_manager_lp():
    with io.open('shift_manager_lp.html', 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = [
        ('<span class="nw">コピーして、AIがスタッフの希望チャットを読み取り、</span>', '<span class="nw">コピーして、AIがスタッフの</span><br class="mobile-br">\n            <span class="nw">希望チャットを読み取り、</span>'),
        ('<span class="nw">そのまま管理画面からアップロードするだけで、</span>', '<span class="nw">そのまま管理画面から</span><br class="mobile-br">\n<span class="nw">アップロードするだけで、</span>'),
        ('<span class="nw">AIが自動解析しWebシステムに完全移行させます。</span>', '<span class="nw">AIが自動解析しWebシステムに</span><br class="mobile-br">\n<span class="nw">完全移行させます。</span>'),
        ('<span class="nw">まるで店長にLINEを送るような感覚で</span>\s*<br class="mobile-br">\s*<span class="nw">希望を伝えるだけ。</span>', '<span class="nw">まるで店長にLINEを送るような</span><br class="mobile-br">\n                    <span class="nw">感覚でチャットで希望を</span><br class="mobile-br">\n                    <span class="nw">伝えるだけ。</span>'),
        ('<span class="nw">シフト表に「休み\(休\)」や「時短\(15:00-\)」として</span>', '<span class="nw">シフト表に</span><br class="mobile-br">\n                    <span class="nw">「休み(休)」や「時短(15:00-)」として</span>')
    ]
    
    for old, new in replacements:
        content = re.sub(old, new, content)

    with io.open('shift_manager_lp.html', 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

fix_store_portal()
fix_css_overflow('manualhelp.html')
fix_css_overflow('shift_manager.html')
fix_shift_manager_lp()

print("done")
