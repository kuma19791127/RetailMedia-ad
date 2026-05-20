import codecs
import re

files = ['admin_portal.html', 'retailer_portal.html', 'review.html', 'creator_portal.html', 'agency_portal.html']

for file in files:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()
            
        # 1. Clean up old <form> attempts if any
        text = text.replace('<form onsubmit="event.preventDefault(); adminLogin();" class="space-y-4">', '<div class="space-y-4">')
        text = text.replace('<form id="form-login" target="dummyframe_admin" action="about:blank" method="POST" onsubmit="setTimeout(handleLogin, 10); return true;" autocomplete="on">', '<div>')
        text = text.replace('<form id="login-form" target="dummyframe" action="about:blank" method="POST" onsubmit="setTimeout(handleLogin, 10); return true;">', '<div>')
        
        # 2. Add autocomplete="username" to ID/Email fields, ensure they have name="username"
        text = re.sub(
            r'<input([^>]*id=[\'"]?(?:admin-id|admin-user|login-email|email|prof-email|g-prof-email|input-email)[\'"]?[^>]*)>',
            lambda m: '<input' + m.group(1).replace('autocomplete="username"', '') + ' name="username" autocomplete="username">',
            text
        )
        
        # 3. Add autocomplete="current-password" to Password fields, ensure they have name="password"
        text = re.sub(
            r'<input([^>]*type=[\'"]password[\'"][^>]*id=[\'"]?(?:admin-pass|login-password|pass|prof-pass|g-prof-pass|input-pass)[\'"]?[^>]*)>',
            lambda m: '<input' + m.group(1).replace('autocomplete="current-password"', '').replace('autocomplete="new-password"', '') + ' name="password" autocomplete="current-password">',
            text
        )
        
        # 4. Wrap the login area in a standard form. We will find the login button and wrap its parent.
        # Find the login function name.
        func_name = "doLogin"
        if file == 'admin_portal.html': func_name = "handleLogin"
        
        # We find the button: <button ... onclick="...()">ログイン</button> or similar.
        # Let's just use regex to replace the button's onclick with a submit type.
        text = re.sub(r'<button[^>]*onclick=[\'"](?:doLogin|handleLogin|adminLogin)\(\)[\'"][^>]*>(.*?)<\/button>', 
                      r'<button type="submit" class="login-btn">\1</button>', 
                      text)
                      
        # Then we wrap the inputs in a form. Since we don't know the exact structure, we can put the <form> right around the inputs.
        # Let's find the first username input in the login section.
        # It's much easier to just find `<div class="login-box">` or `<div id="login-modal">` and wrap its inner content.
        
        # Actually, let's just write a custom replace for each file to be 100% safe.
    except Exception as e:
        print(e)
