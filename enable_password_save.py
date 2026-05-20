with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target_form = '''<form id="login-form" onsubmit="handleLogin(event)">'''
replacement_form = '''<iframe name="dummyframe" id="dummyframe" style="display:none;"></iframe>
            <form id="login-form" target="dummyframe" action="about:blank" method="POST" onsubmit="setTimeout(handleLogin, 10); return true;">'''

text = text.replace(target_form, replacement_form)

target_script = '''        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;'''

replacement_script = '''        async function handleLogin() {
            const email = document.getElementById('login-email').value;'''

text = text.replace(target_script, replacement_script)

# Also let's pre-fill the form on load if the browser didn't do it, from the local storage
target_body = '''    <!-- Sidebar -->'''
replacement_body = '''    <!-- Sidebar -->
    <script>
        // Load email if saved previously
        window.addEventListener('DOMContentLoaded', () => {
            const savedEmail = localStorage.getItem('retailer_email');
            if(savedEmail) {
                document.getElementById('login-email').value = savedEmail;
            }
        });
    </script>'''
text = text.replace(target_body, replacement_body)


with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)
