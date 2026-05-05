
                function createAdvertiserAccount() {
                    const name = document.getElementById('adv-name').value;
                    const email = document.getElementById('adv-email').value;
                    const budget = document.getElementById('adv-budget').value;
                    const ccEmail = document.getElementById('adv-agency-email').value;
                    
                    if (!name || !email || !budget) {
                        return Swal.fire('エラー', 'すべての項目を入力してください', 'error');
                    }

                    Swal.fire({
                        title: 'アカウント発行確認',
                        html: `<div style="text-align:left; font-size:14px; background:#f8fafc; padding:15px; border-radius:8px;">
                            対象企業: <b>${name}</b> 様<br>
                            CC宛先: <b>${ccEmail || "なし"}</b><br>
                            アドレス: <b>${email}</b><br>
                            チャージ: <b style="color:#e74c3c; font-size:18px;">¥${Number(budget).toLocaleString()}</b>
                            </div><br>上記の内容でアカウントを作成し、システム利用開始の案内メールを自動送信します。<br>よろしいですか？`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#f39c12',
                        confirmButtonText: '発行してメール送信',
                        cancelButtonText: 'キャンセル'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            // Dummy processing delay to simulate backend account creation & email
                            Swal.fire({ title: '処理中...', html: 'API連携中...<br>・新規ID/PASS生成中<br>・予算データの登録中<br>・ご案内メール送信中', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                            
                            setTimeout(() => {
                                // Add to demo history table
                                const tbody = document.getElementById('adv-history-body');
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td style="padding:10px;">${new Date().toLocaleString('ja-JP')}</td>
                                    <td style="padding:10px;">${name}</td>
                                    <td style="padding:10px;">${email}</td>
                                    <td style="padding:10px; color:#27ae60; font-weight:bold;">¥${Number(budget).toLocaleString()}</td>
                                    <td style="padding:10px;"><span class="badge badge-sent">発行済・送信済</span></td>
                                `;
                                tbody.prepend(tr);
                                
                                // Reset form
                                document.getElementById('adv-name').value = '';
                                document.getElementById('adv-email').value = '';
                                document.getElementById('adv-budget').value = '';
                                document.getElementById('adv-agency-email').value = '';

                                Swal.fire('成功', 'アカウント発行・予算チャージが完了し、企業様（および代理店様）へのご案内メールが送信されました！', 'success');
                            }, 2000);
                        }
                    });
                }
            