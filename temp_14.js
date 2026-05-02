// Feature Parity: Sidebar features in one menu
        function showFullMenu() {
            Swal.fire({
                title: 'その他メニュー',
                html: `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; text-align:center;">
                        <button onclick="scrollToCampaign(); Swal.close();" class="swal2-confirm swal2-styled" style="width:100%; margin:0; background:#3498db;">📢 新規配信作成</button>
                        <button onclick="editProfile();" class="swal2-confirm swal2-styled" style="width:100%; margin:0; background:#95a5a6;">👤 My Brand編集</button>
                    </div>
                    <div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                        <p style="font-size:12px; color:#999; margin-bottom:5px;">サポート</p>
                        <button onclick="handleSupport(); Swal.close();" class="swal2-confirm swal2-styled" style="width:100%; margin:0; background:#8e44ad;">📞 お問い合わせ</button>
                    </div>
                    <div style="margin-top:15px;">
                         <button onclick="location.href='login_portal.html';" class="swal2-cancel swal2-styled" style="background:#555;">🚪 ログアウト</button>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: true
            });
        }

        function handlePayment() {
            // Clone the form from hidden sidebar
            const originalForm = document.getElementById('card-form');
            if (!originalForm) {
                Swal.fire('Error', 'Payment form not found', 'error');
                return;
            }
            const formClone = originalForm.cloneNode(true);
            formClone.style.display = 'block';

            Swal.fire({
                title: 'お支払い設定 (Payment)',
                html: formClone,
                showConfirmButton: true,
                confirmButtonText: '保存 (Save)',
                didOpen: () => {
                    // Logic to handle inputs if needed
                }
            }).then(async (res) => {
                if (res.isConfirmed) {
                    Swal.fire({
                        title: '接続中...',
                        text: 'GMOペイメントゲートウェイに接続しています。',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    try {
                        Swal.fire({
                            title: '決済情報の登録',
                            html: `
                                <div id="sq-payment-form" style="display:flex; flex-direction:column; gap:10px; width: 300px; margin: 0 auto;">
                                    <div id="apple-pay-button" style="margin-bottom:10px;"></div>
                                    <div id="google-pay-button"></div>
                                    <div id="sq-card-container"></div>
                                    <button id="sq-creditcard" style="padding:10px; background:#10B981; color:white; border-radius:5px; border:none; cursor:pointer;">クレジットカードで登録</button>
                                    <div id="sq-status" style="color:#ef4444; font-weight:bold; font-size:12px; margin-top:5px;"></div>
                                </div>
                            `,
                            showConfirmButton: false,
                            showCancelButton: true,
                            didOpen: () => {
                                initializeSquarePayment(100, 'sq-card-container', () => {
                                    Swal.fire('成功', '支払い情報の登録が完了し、システムに連携されました。', 'success');
                                });
                            }
                        });
                    } catch (e) {
                        Swal.fire('エラー', '決済機能の呼び出しに失敗しました', 'error');
                    }
                }
            });
        }