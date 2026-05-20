with open('store_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'function addStoreInput() {'
replacement = '''function sendDownloadLink() {
            Swal.fire({
                title: 'メールアドレスを入力',
                input: 'email',
                inputPlaceholder: '店舗のメールアドレス',
                showCancelButton: true,
                confirmButtonText: '送信する',
                cancelButtonText: 'キャンセル'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('送信完了', result.value + ' 宛にアプリのダウンロードリンクを送信しました。', 'success');
                }
            });
        }

        function addStoreInput() {'''

text = text.replace(target, replacement)

with open('store_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)
