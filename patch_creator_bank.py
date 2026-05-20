import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

target1 = """preConfirm: () => {
                    return {
                        bankName: document.getElementById('bank-name').value,
                        branchName: document.getElementById('bank-branch').value,
                        accountNum: document.getElementById('bank-account').value,
                        holderName: document.getElementById('bank-holder').value,
                        email: document.getElementById('bank-email').value
                    }
                }"""

# We must use a Promise to read the file as base64
replace1 = """preConfirm: () => {
                    const fileInput = document.getElementById('bank-id-image');
                    const file = fileInput.files[0];
                    if (!file) {
                        Swal.showValidationMessage('本人確認書類の画像を選択してください');
                        return false;
                    }
                    
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                bankName: document.getElementById('bank-name').value,
                                branchName: document.getElementById('bank-branch').value,
                                accountNum: document.getElementById('bank-account').value,
                                holderName: document.getElementById('bank-holder').value,
                                email: document.getElementById('bank-email').value,
                                idFileName: file.name,
                                idFileType: file.type,
                                idFileBase64: e.target.result
                            });
                        };
                        reader.readAsDataURL(file);
                    });
                }"""

text = text.replace(target1, replace1)


target2 = """fetch(`${API_BASE}/api/creator/bank`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    }).then(() => {
                        Swal.fire('保存しました', '口座情報が更新されました。', 'success');"""

replace2 = """// 先にKYC(本人確認) APIへ送信
                    fetch(`${API_BASE}/api/kyc`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userEmail: data.email,
                            personName: data.holderName,
                            documents: [{
                                name: data.idFileName,
                                type: data.idFileType,
                                data: data.idFileBase64
                            }]
                        })
                    }).then(res => res.json())
                    .then(kycRes => {
                        if (kycRes.aiScore < 50) {
                            Swal.fire('エラー', '本人確認書類と口座名義が一致しないか、不鮮明です。', 'error');
                            return;
                        }
                        
                        // KYCが通れば銀行口座情報を保存
                        return fetch(`${API_BASE}/api/creator/bank`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).then(() => {
                            Swal.fire('保存しました', '口座情報と本人確認書類が送信・更新されました。', 'success');
                        });
                    }).catch(err => {
                        Swal.fire('エラー', '通信に失敗しました。', 'error');
                    });"""

text = text.replace(target2, replace2)

with codecs.open('creator_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched creator_portal.html for KYC upload")
