import codecs
import re

# 1. anywhere_regi.html
try:
    with codecs.open('anywhere_regi.html', 'r', 'utf-8') as f: text = f.read()
    # Remove the broken nested form tag
    text = text.replace('<form onsubmit="event.preventDefault(); handleLogin();" style="width:100%; margin:0; padding:0;">\n            <form action="javascript:void(0);" onsubmit="doLogin();"', '<iframe name="dummyframe_login" style="display:none;"></iframe>\n            <form action="about:blank" target="dummyframe_login" method="POST" onsubmit="setTimeout(doLogin, 10); return true;"')
    text = text.replace('</form>>', '</form>')
    with codecs.open('anywhere_regi.html', 'w', 'utf-8') as f: f.write(text)
    print('anywhere_regi.html updated')
except Exception as e: print(e)

# 2. shift_manager.html (add name attributes)
try:
    with codecs.open('shift_manager.html', 'r', 'utf-8') as f: text = f.read()
    text = text.replace('id="login-email" placeholder', 'id="login-email" name="email" placeholder')
    text = text.replace('id="login-password" placeholder', 'id="login-password" name="password" placeholder')
    with codecs.open('shift_manager.html', 'w', 'utf-8') as f: f.write(text)
    print('shift_manager.html updated')
except Exception as e: print(e)

# 3. index.html
try:
    with codecs.open('index.html', 'r', 'utf-8') as f: text = f.read()
    text = text.replace('<form id="loginForm" method="dialog" onsubmit="handleLogin(event)">', '<iframe name="dummyframe_login" style="display:none;"></iframe>\n            <form id="loginForm" action="about:blank" target="dummyframe_login" method="POST" onsubmit="setTimeout(function(){ handleLogin(new Event(\'submit\')); }, 10); return true;">')
    with codecs.open('index.html', 'w', 'utf-8') as f: f.write(text)
    print('index.html updated')
except Exception as e: print(e)

# 4. manualhelp.html
try:
    with codecs.open('manualhelp.html', 'r', 'utf-8') as f: text = f.read()
    text = text.replace('<form id="login-form" onsubmit="event.preventDefault(); doLogin();"', '<iframe name="dummyframe_login" style="display:none;"></iframe>\n            <form id="login-form" action="about:blank" target="dummyframe_login" method="POST" onsubmit="setTimeout(doLogin, 10); return true;"')
    text = text.replace('id="login-email" placeholder', 'id="login-email" name="email" placeholder')
    text = text.replace('id="login-pass" placeholder', 'id="login-pass" name="password" placeholder')
    with codecs.open('manualhelp.html', 'w', 'utf-8') as f: f.write(text)
    print('manualhelp.html updated')
except Exception as e: print(e)

# 5. login_portal.html
try:
    with codecs.open('login_portal.html', 'r', 'utf-8') as f: text = f.read()
    text = text.replace('<form id="loginForm" onsubmit="handleLogin(event)">', '<iframe name="dummyframe_login" style="display:none;"></iframe>\n        <form id="loginForm" action="about:blank" target="dummyframe_login" method="POST" onsubmit="setTimeout(function(){ handleLogin(new Event(\'submit\')); }, 10); return true;">')
    text = text.replace('id="email" placeholder', 'id="email" name="email" placeholder')
    text = text.replace('id="password" placeholder', 'id="password" name="password" placeholder')
    with codecs.open('login_portal.html', 'w', 'utf-8') as f: f.write(text)
    print('login_portal.html updated')
except Exception as e: print(e)

# 6. retailer_portal.html
try:
    with codecs.open('retailer_portal.html', 'r', 'utf-8') as f: text = f.read()
    text = text.replace('<form action="javascript:void(0);" onsubmit="handleLogin();"', '<iframe name="dummyframe_login" style="display:none;"></iframe>\n                <form action="about:blank" target="dummyframe_login" method="POST" onsubmit="setTimeout(handleLogin, 10); return true;"')
    with codecs.open('retailer_portal.html', 'w', 'utf-8') as f: f.write(text)
    print('retailer_portal.html updated')
except Exception as e: print(e)
