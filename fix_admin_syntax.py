import codecs

with codecs.open('admin_portal.html', 'r', 'utf-8') as f:
    text = f.read()

target = "Swal.fire('登録完了', デバイス  を店舗  に紐付けました！<br>サイネージ画面が自動で切り替わります。, 'success');"
replace = "Swal.fire('登録完了', `デバイスを店舗に紐付けました！<br>サイネージ画面が自動で切り替わります。`, 'success');"

# Wait, the error message had some spaces: "デバイス  を店舗  に紐付けました！"
# I will use find and replace manually.
idx = text.find("Swal.fire('登録完了', デバイス")
if idx != -1:
    end = text.find(");", idx) + 2
    old_stmt = text[idx:end]
    print("Found:", old_stmt)
    text = text.replace(old_stmt, replace)
    with codecs.open('admin_portal.html', 'w', 'utf-8') as f:
        f.write(text)
    print("Patched admin_portal.html")
else:
    print("Target not found.")
