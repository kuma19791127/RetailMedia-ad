import codecs
import re

files_to_patch = [
    'admin_portal.html',
    'retailer_portal.html',
    'review.html',
    'creator_portal.html',
    'agency_portal.html',
    'ad_dashboard.html',
    'anywhere_retail.html',
    'anywhere_regi.html'
]

for file in files_to_patch:
    try:
        with codecs.open(file, 'r', 'utf-8') as f:
            text = f.read()

        # Regex to inject <form onsubmit="..."> before the email input
        # and </form> after the login button.
        
        # 1. Add autocomplete to email inputs
        text = re.sub(r'(<input[^>]*id=[\'"](?:input-email|admin-id|email)[\'"][^>]*?)(/?>)', 
                      lambda m: m.group(1) + ' autocomplete="username" ' + m.group(2) if 'autocomplete' not in m.group(1) else m.group(0), 
                      text)
        
        # 2. Add autocomplete to password inputs
        text = re.sub(r'(<input[^>]*type=[\'"]password[\'"][^>]*?)(/?>)', 
                      lambda m: m.group(1) + ' autocomplete="current-password" ' + m.group(2) if 'autocomplete' not in m.group(1) else m.group(0), 
                      text)

        # 3. Wrap in form. We look for a common container, like a div with class "space-y-4" or similar that holds the inputs.
        # A simple hack: just wrap the entire body content that looks like a login box, OR just inject a dummy hidden submit button.
        # Actually, if we just wrap the inputs with <form onsubmit="event.preventDefault();">, it works.
        # It's safer to just change the login <div> to <form> manually for known patterns.
        
        if file == 'admin_portal.html':
            text = text.replace('<div class="space-y-4">', '<form onsubmit="event.preventDefault(); adminLogin();" class="space-y-4">')
            text = text.replace('onclick="adminLogin()"', 'type="submit"')
            text = text.replace('ログイン</button>', 'ログイン</button></form>')
            
        elif file == 'review.html':
            text = text.replace('<div style="display:flex; flex-direction:column; gap:15px;">', '<form onsubmit="event.preventDefault(); doLogin();" style="display:flex; flex-direction:column; gap:15px;">')
            text = text.replace('onclick="doLogin()"', 'type="submit"')
            text = text.replace('ログイン</button>', 'ログイン</button></form>')
            
        elif file in ['retailer_portal.html', 'creator_portal.html', 'agency_portal.html', 'ad_dashboard.html', 'anywhere_retail.html', 'anywhere_regi.html']:
            text = text.replace('<div class="space-y-4">', '<form onsubmit="event.preventDefault(); if(typeof doLogin !== \'undefined\') doLogin();" class="space-y-4">')
            text = text.replace('onclick="doLogin()"', 'type="submit"')
            # To avoid adding </form> multiple times if there are multiple buttons
            text = re.sub(r'(>ログイン<\/button>\s*<\/div>)', r'>ログイン</button></form></div>', text, count=1)
            text = re.sub(r'(>ログイン<\/button>\s*<div)', r'>ログイン</button></form><div', text, count=1)
            # Some files might not have </div> immediately after button.
            if 'ログイン</button>' in text and '</form>' not in text:
                text = text.replace('ログイン</button>', 'ログイン</button></form>')

        with codecs.open(file, 'w', 'utf-8') as f:
            f.write(text)
            
        print(f"Patched {file}")
    except Exception as e:
        print(f"Failed {file}: {e}")
