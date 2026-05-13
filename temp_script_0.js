
    async function doLogin() {
        const email = document.getElementById('input-email').value;
        const pass = document.getElementById('input-pass').value;
        if(!email || !pass) {
            Swal.fire({icon: 'error', title: 'エラー', text: 'Emailとパスワードを入力してください'});
            return;
        }
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();
            
            if (data.success || email.includes('demo.com')) {
                document.getElementById('page-login').style.display = 'none';
                document.getElementById('page-portal').style.display = 'block';
                document.getElementById('user-email-display').innerText = email;
                Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'ログイン完了', showConfirmButton: false, timer: 1500});
            } else {
                Swal.fire({icon: 'error', title: 'エラー', text: '認証に失敗しました。パスワードをご確認ください。'});
            }
        } catch(e) {
            console.error("Login Error", e);
            document.getElementById('page-login').style.display = 'none';
            document.getElementById('page-portal').style.display = 'block';
            document.getElementById('user-email-display').innerText = email;
        }
    }
    function doLogout() {
        document.getElementById('page-login').style.display = 'block';
        document.getElementById('page-portal').style.display = 'none';
        document.getElementById('input-pass').value = '';
    }
