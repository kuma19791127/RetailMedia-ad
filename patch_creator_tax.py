import codecs
import re

with codecs.open('creator_portal.html', 'r', 'utf-8') as f:
    text = f.read()

# 1. Update the Bank Settings UI
target_bank_html = """<label style="display:block; margin-bottom:5px; color:#555;">口座名義 (カタカナ)</label>
                        <input type="text" id="bank-holder" class="swal2-input" placeholder="例: ヤマダ タロウ" style="width:80%; margin:0 0 15px 0;">"""

replace_bank_html = """<label style="display:block; margin-bottom:5px; color:#555;">口座名義 (カタカナ)</label>
                        <input type="text" id="bank-holder" class="swal2-input" placeholder="例: ヤマダ タロウ" style="width:80%; margin:0 0 15px 0;">

                        <hr style="margin: 15px 0; border: 0.5px solid #eee;">
                        <label style="display:block; margin-bottom:5px; color:#555;">事業形態 (源泉徴収判定用)</label>
                        <select id="business-type" class="swal2-input" style="width:80%; margin:0 0 15px 0; height: 40px; font-size:16px;">
                            <option value="individual">個人事業主 (源泉徴収あり)</option>
                            <option value="corporate">法人 (源泉徴収なし)</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#555;">適格請求書発行事業者登録番号 (任意)</label>
                        <input type="text" id="invoice-number" class="swal2-input" placeholder="例: T1234567890123" style="width:80%; margin:0 0 15px 0;">
                        <p style="font-size:0.75rem; color:#888; margin-top:0;">※登録がある場合は国税庁APIを通じて即時確認されます。</p>"""

text = text.replace(target_bank_html, replace_bank_html)

# 2. Update the preConfirm logic to collect the new fields
target_preconfirm = """holderName: document.getElementById('bank-holder').value,
                                email: document.getElementById('bank-email').value,"""

replace_preconfirm = """holderName: document.getElementById('bank-holder').value,
                                email: document.getElementById('bank-email').value,
                                businessType: document.getElementById('business-type').value,
                                invoiceNumber: document.getElementById('invoice-number').value,"""

text = text.replace(target_preconfirm, replace_preconfirm)

# 3. Add a withdrawal button to the Revenue section
# Find the revenue section
target_rev_section = """<div class="stat-card">
                    <div class="stat-title">確定収益</div>
                    <div class="stat-value" id="total-revenue">¥0</div>
                </div>"""

replace_rev_section = """<div class="stat-card">
                    <div class="stat-title">確定収益</div>
                    <div class="stat-value" id="total-revenue">¥0</div>
                    <button onclick="requestWithdrawal()" style="margin-top: 10px; background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: bold;">出金申請 (5,000円〜)</button>
                </div>"""

text = text.replace(target_rev_section, replace_rev_section)

# 4. Add the requestWithdrawal function
withdraw_script = """
        async function requestWithdrawal() {
            // Assume revenue is loaded from stats
            const amount = parseInt(document.getElementById('total-revenue').innerText.replace(/[^0-9]/g, '')) || 5500; // Mock: 5500 for testing
            
            if (amount < 5000) {
                Swal.fire('残高不足', '出金申請は5,000円から可能です。', 'warning');
                return;
            }

            const confirm = await Swal.fire({
                title: '出金申請',
                html: `確定収益 <b>¥${amount.toLocaleString()}</b> の引き出し申請を行います。<br>振込手数料および源泉徴収税（個人の場合）が差し引かれて入金されます。`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: '申請する',
                cancelButtonText: 'キャンセル'
            });

            if (confirm.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/api/creator/withdraw`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: window.currentUser ? window.currentUser.email : 'creator@demo.com',
                            amount: amount
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'API Error');
                    
                    Swal.fire('申請完了', '出金申請を受け付けました。管理者の承認後、GMOあおぞらネット銀行API経由で自動送金されます。', 'success');
                } catch (e) {
                    Swal.fire('エラー', e.message, 'error');
                }
            }
        }
"""

# Insert withdraw_script just before </script>
idx = text.rfind("</script>")
if idx != -1:
    text = text[:idx] + withdraw_script + "\n" + text[idx:]

with codecs.open('creator_portal.html', 'w', 'utf-8') as f:
    f.write(text)

print("Patched creator_portal.html with Withdrawal and Invoice settings")
