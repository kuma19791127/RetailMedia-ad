import codecs
import re

def manual_fix(filename, target_start, target_end, new_content):
    with codecs.open(filename, 'r', 'utf-8') as f:
        text = f.read()
    
    text = re.sub(r'<iframe[^>]*dummyframe[^>]*><\/iframe>\s*', '', text)
    text = re.sub(r'<form[^>]*target=[\'"]dummyframe[^>]*>', '<div>', text)
    
    idx_start = text.find(target_start)
    if idx_start == -1: return False
    idx_end = text.find(target_end, idx_start) + len(target_end)
    
    text = text[:idx_start] + new_content + text[idx_end:]
    
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(text)
    return True

# ad_dashboard.html
ad_dash_new = """<form action="javascript:void(0);" onsubmit="doLogin();" class="space-y-4">
                <input type="email" id="email" name="username" class="login-input" placeholder="メールアドレス" required autocomplete="username">
                <input type="password" id="pass" name="password" class="login-input" placeholder="パスワード" required autocomplete="current-password">
                <button type="submit" class="login-btn">ログイン</button>
            </form>"""
manual_fix('ad_dashboard.html', '<input type="email" id="email"', 'ログイン</button>', ad_dash_new)

# creator_portal.html
creator_new = """<form action="javascript:void(0);" onsubmit="doLogin();" class="space-y-4">
                <input type="email" id="email" name="username" class="login-input" placeholder="メールアドレス" required autocomplete="username">
                <input type="password" id="pass" name="password" class="login-input" placeholder="パスワード" required autocomplete="current-password">
                <button type="submit" class="login-btn">ログイン</button>
            </form>"""
manual_fix('creator_portal.html', '<input type="email" id="email"', 'ログイン</button>', creator_new)

# agency_portal.html
agency_new = """<form action="javascript:void(0);" onsubmit="doLogin();" class="space-y-4">
                <input type="email" id="email" name="username" class="login-input" placeholder="メールアドレス" required autocomplete="username">
                <input type="password" id="pass" name="password" class="login-input" placeholder="パスワード" required autocomplete="current-password">
                <button type="submit" class="login-btn">ログイン</button>
            </form>"""
manual_fix('agency_portal.html', '<input type="email" id="email"', 'ログイン</button>', agency_new)

# anywhere_retail.html
retail_new = """<form action="javascript:void(0);" onsubmit="doLogin();" style="display:flex; flex-direction:column; gap:15px; width:100%;">
            <div style="text-align:left; margin-bottom:5px; font-size:12px; color:#6B7280;">Email Address</div>
            <input type="email" id="input-email" name="username" class="login-input" placeholder="store@demo.com" required autocomplete="username">
            <div style="text-align:left; margin-bottom:5px; font-size:12px; color:#6B7280;">Password</div>
            <input type="password" id="input-pass" name="password" class="login-input" placeholder="Password" required autocomplete="current-password">
            <button type="submit" class="btn-primary">ログイン開始</button>
        </form>"""
manual_fix('anywhere_retail.html', '<div style="text-align:left; margin-bottom:5px; font-size:12px; color:#6B7280;">Email Address</div>', 'ログイン開始</button>', retail_new)

# anywhere_regi.html
regi_new = """<form action="javascript:void(0);" onsubmit="doLogin();" style="display:flex; flex-direction:column; gap:15px; width:100%;">
            <div style="text-align:left; margin-bottom:5px; font-size:12px; color:#6B7280;">Email Address</div>
            <input type="email" id="input-email" name="username" class="login-input" placeholder="store@demo.com" required autocomplete="username">
            <div style="text-align:left; margin-bottom:5px; font-size:12px; color:#6B7280;">Password</div>
            <input type="password" id="input-pass" name="password" class="login-input" placeholder="Password" required autocomplete="current-password">
            <button type="submit" class="btn-primary">ログイン開始</button>
        </form>"""
manual_fix('anywhere_regi.html', '<div style="text-align:left; margin-bottom:5px; font-size:12px; color:#6B7280;">Email Address</div>', 'ログイン開始</button>', regi_new)

print("Done patching all remaining logins")
