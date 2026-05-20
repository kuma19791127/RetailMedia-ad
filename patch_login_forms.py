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

        # Step 1: Add autocomplete="username" to email/login inputs
        text = re.sub(
            r'(<input[^>]*id=[\'"]?(?:input-email|email|admin-id)[\'"]?[^>]*?)(\/?>)',
            lambda m: m.group(1) + ' autocomplete="username" ' + m.group(2) if 'autocomplete' not in m.group(1) else m.group(0),
            text, flags=re.IGNORECASE
        )
        
        text = re.sub(
            r'(<input[^>]*type=[\'"]?(?:email|text)[\'"]?[^>]*placeholder=[\'"]?[^>]*メール[^>]*[\'"]?[^>]*?)(\/?>)',
            lambda m: m.group(1) + ' autocomplete="username" ' + m.group(2) if 'autocomplete' not in m.group(1) else m.group(0),
            text, flags=re.IGNORECASE
        )

        # Step 2: Add autocomplete="current-password" to password inputs
        text = re.sub(
            r'(<input[^>]*type=[\'"]?password[\'"]?[^>]*?)(\/?>)',
            lambda m: m.group(1) + ' autocomplete="current-password" ' + m.group(2) if 'autocomplete' not in m.group(1) else m.group(0),
            text, flags=re.IGNORECASE
        )

        # Step 3: Ensure there is a form wrapping the login section if it has an onclick handler for login
        # We find buttons that trigger login, e.g., onclick="doLogin()" or onclick="adminLogin()"
        # Then we try to wrap the nearest parent div in a form, but parsing HTML with regex is risky.
        # Alternatively, we can just replace onclick="doLogin()" with a form submit button, and wrap the fields.
        
        # In many of these files, login looks like:
        # <div id="login-modal" ...>
        #   <input ...>
        #   <input ...>
        #   <button onclick="doLogin()">...
        # </div>
        
        # A safer bet is to change the login function to intercept form submission.
        # Let's replace:
        # <div class="p-6"> or similar container inside login-modal with <form onsubmit="event.preventDefault(); doLogin();">
        
        if 'id="login-modal"' in text and '<form' not in text:
            # Wrap the content of login-modal
            # This is tricky without a real HTML parser, let's do a naive replace for doLogin/adminLogin
            text = text.replace('onclick="doLogin()"', 'type="submit"')
            text = text.replace('onclick="adminLogin()"', 'type="submit"')
            text = text.replace('<div id="login-modal"', '<form id="login-modal" onsubmit="event.preventDefault(); if(typeof doLogin === \'function\') doLogin(); else if(typeof adminLogin === \'function\') adminLogin();"')
            text = text.replace('</div>\n    <!-- Login -->', '</form>\n    <!-- Login -->')
            text = text.replace('</div>\n</div>\n\n<!-- Sidebar -->', '</form>\n</div>\n\n<!-- Sidebar -->')
            
            # Change any <div ... class="login-box"> to <form ... class="login-box" onsubmit="...">
            text = re.sub(
                r'<div([^>]*id=[\'"]login-modal[\'"][^>]*)>',
                r'<form\1 onsubmit="event.preventDefault(); if(typeof doLogin === \'function\') doLogin(); else if(typeof adminLogin === \'function\') adminLogin();">',
                text
            )
            
            # We need to make sure the closing tag is also changed to </form>
            # It's better to just write a simple script that wraps the inputs and button.

        with codecs.open(file, 'w', 'utf-8') as f:
            f.write(text)
            
        print(f"Patched {file}")
    except Exception as e:
        print(f"Failed {file}: {e}")
