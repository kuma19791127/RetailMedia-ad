import codecs
import re

def fix_file(filename, login_func):
    try:
        with codecs.open(filename, 'r', 'utf-8') as f:
            text = f.read()

        # Step 1: Clean up any existing broken form wraps from previous attempts
        text = re.sub(r'<form[^>]*onsubmit=[\'"]event\.preventDefault\(\)[^\'"]*[\'"][^>]*>', '<div>', text)
        text = text.replace('</form>', '</div>')
        text = re.sub(r'<iframe[^>]*dummyframe[^>]*><\/iframe>', '', text)
        text = re.sub(r'<form[^>]*target=[\'"]dummyframe[^>]*>', '<div>', text)

        # Step 2: Inject a proper clean form wrap around the inputs
        # Find the block containing the email input, password input, and login button.
        # We'll just replace the button with a submit button, and wrap the parent in a form.
        # Instead of wrapping the parent, let's just create a neat form block that replaces the inputs.
        
        # A simpler way: Find `<input type="email"...>` or `<input type="text"...>` meant for login
        # and `<button...onclick="login_func()"...>`
        
        # We will use regex to find the button and change it to type="submit".
        text = re.sub(fr'<button[^>]*onclick=[\'"]{login_func}\(\)[\'"][^>]*>(.*?)<\/button>', 
                      r'<button type="submit" class="login-btn">\1</button>', text)
                      
        # We wrap the entire modal body or the inputs container in <form>.
        # Let's find `<div id="login-modal"` or similar and replace its inner structure if possible.
        # Since each file has a slightly different layout, let's just do a manual string replace.
    except Exception as e:
        print(f"Error {filename}: {e}")

# Manual fixes for each file:
def manual_fix(filename, target_start, target_end, new_content):
    with codecs.open(filename, 'r', 'utf-8') as f:
        text = f.read()
    
    # Remove previous dummyframes and old forms just in case
    text = re.sub(r'<iframe[^>]*dummyframe[^>]*><\/iframe>\s*', '', text)
    text = re.sub(r'<form[^>]*target=[\'"]dummyframe[^>]*>', '<div>', text)
    
    idx_start = text.find(target_start)
    if idx_start == -1: return False
    idx_end = text.find(target_end, idx_start) + len(target_end)
    
    text = text[:idx_start] + new_content + text[idx_end:]
    
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(text)
    return True

# admin_portal.html
admin_target = '<div class="space-y-4">'
admin_end = 'ログイン</button>'
admin_new = """<form action="javascript:void(0);" onsubmit="handleLogin();" class="space-y-4">
                <input type="text" id="admin-user" name="username" class="login-input" placeholder="Admin ID" required autocomplete="username">
                <input type="password" id="admin-pass" name="password" class="login-input" placeholder="Password" required autocomplete="current-password">
                <button type="submit" class="login-btn">ログイン</button>
            </form>"""
manual_fix('admin_portal.html', '<input type="text" id="admin-user"', 'ログイン</button>', admin_new)

# retailer_portal.html
retailer_new = """<form action="javascript:void(0);" onsubmit="handleLogin();" style="display:flex; flex-direction:column; gap:15px;">
                <input type="email" id="login-email" name="username" class="login-input" placeholder="メールアドレス (店舗ID)" required autocomplete="username">
                <input type="password" id="login-password" name="password" class="login-input" placeholder="パスワード" required autocomplete="current-password">
                <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
                    <a href="#" style="color: #4CAF50; text-decoration: none;">パスワードをお忘れですか？</a>
                </div>
                <button type="submit" class="login-btn">ログイン</button>
            </form>"""
manual_fix('retailer_portal.html', '<input type="email" id="login-email"', 'ログイン</button>', retailer_new)

# review.html
review_new = """<form action="javascript:void(0);" onsubmit="doLogin();" style="display:flex; flex-direction:column; gap:15px;">
                <input type="text" id="admin-id" name="username" placeholder="Reviewer ID" style="padding:10px; border:1px solid #ddd; border-radius:4px;" required autocomplete="username">
                <input type="password" id="admin-pass" name="password" placeholder="Password" style="padding:10px; border:1px solid #ddd; border-radius:4px;" required autocomplete="current-password">
                <button type="submit" style="padding:10px; background:#4CAF50; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">ログイン</button>
            </form>"""
manual_fix('review.html', '<input type="text" id="admin-id"', 'ログイン</button>', review_new)

print("Done patching specific logins")
