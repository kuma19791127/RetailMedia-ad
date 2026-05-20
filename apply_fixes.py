# -*- coding: utf-8 -*-
import codecs

# Fix admin_portal.html
with codecs.open('admin_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target_admin = '''<form id="form-login" onsubmit="event.preventDefault(); handleLogin();" autocomplete="on">
                <input type="text" id="admin-user" name="username" class="login-input" placeholder="Admin ID"
                    autocomplete="username">
                <input type="password" id="admin-pass" name="password" class="login-input" placeholder="Password"
                    autocomplete="current-password">
                <button type="button" class="login-btn" onclick="handleLogin()">Login</button>
            </form>'''

replacement_admin = '''<iframe name="dummyframe_admin" id="dummyframe_admin" style="display:none;"></iframe>
            <form id="form-login" target="dummyframe_admin" action="about:blank" method="POST" onsubmit="setTimeout(handleLogin, 10); return true;" autocomplete="on">
                <input type="text" id="admin-user" name="username" class="login-input" placeholder="Admin ID"
                    autocomplete="username">
                <input type="password" id="admin-pass" name="password" class="login-input" placeholder="Password"
                    autocomplete="current-password">
                <button type="submit" class="login-btn">Login</button>
            </form>'''

text = text.replace(target_admin, replacement_admin)

with codecs.open('admin_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)

# Fix shift_manager.html
with codecs.open('shift_manager.html', 'r', encoding='utf-8') as f:
    text2 = f.read()

target_shift = '''        <div class="login-box" id="login-box">
            <h2>シフト管理システム ログイン</h2>
            <input type="text" id="login-org" placeholder="組織コードを入力 (例: non-logi.inc)" value="non-logi.inc" required>
            <input type="text" id="login-name" placeholder="氏名を入力 (例: Aさん)" required>
            <select id="login-dept">
                <option value="meat">🥩 畜産</option>
                <option value="fresh">🐟 生鮮</option>
                <option value="grocery">🥫 食品</option>
                <option value="deli">🍱 惣菜</option>
                <option value="bakery">🍞 ベーカリー</option>
            </select>
            <input type="email" id="login-email" placeholder="メールアドレス" value="staff@demo.com">
            <button onclick="doLogin()">ログインして進む</button>
            <div style="margin-top: 15px; font-size: 0.9rem;">
                <a href="shift_manager_lp.html" style="color: var(--primary); text-decoration: none; font-weight: bold;">← 案内ページ(LP)に戻る</a>
            </div>
        </div>'''

replacement_shift = '''        <div class="login-box" id="login-box">
            <h2>シフト管理システム ログイン</h2>
            <iframe name="dummyframe_shift" id="dummyframe_shift" style="display:none;"></iframe>
            <form target="dummyframe_shift" action="about:blank" method="POST" onsubmit="setTimeout(doLogin, 10); return true;">
                <input type="text" id="login-org" placeholder="組織コードを入力 (例: non-logi.inc)" value="non-logi.inc" required autocomplete="organization">
                <input type="text" id="login-name" placeholder="氏名を入力 (例: Aさん)" required autocomplete="username">
                <select id="login-dept">
                    <option value="meat">🥩 畜産</option>
                    <option value="fresh">🐟 生鮮</option>
                    <option value="grocery">🥫 食品</option>
                    <option value="deli">🍱 惣菜</option>
                    <option value="bakery">🍞 ベーカリー</option>
                </select>
                <input type="email" id="login-email" placeholder="メールアドレス" value="staff@demo.com" autocomplete="email">
                <input type="password" id="login-password" placeholder="パスワード" required autocomplete="current-password" value="password123">
                <button type="submit">ログインして進む</button>
            </form>
            <div style="margin-top: 15px; font-size: 0.9rem;">
                <a href="shift_manager_lp.html" style="color: var(--primary); text-decoration: none; font-weight: bold;">← 案内ページ(LP)に戻る</a>
            </div>
        </div>'''

text2 = text2.replace(target_shift, replacement_shift)

with codecs.open('shift_manager.html', 'w', encoding='utf-8') as f:
    f.write(text2)


# Fix store_portal.html garbled title
with codecs.open('store_portal.html', 'r', encoding='utf-8', errors='ignore') as f:
    text3 = f.read()

text3 = text3.replace('eAh', 'リテアド')

with codecs.open('store_portal.html', 'w', encoding='utf-8') as f:
    f.write(text3)

