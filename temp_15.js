function showAdPolicy() {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '配信・広告審査基準 (AI Moderation)',
                    html: '<div style="text-align:left; font-size:0.95rem; line-height:1.6; color:#333;">以下に該当する不適切なコンテンツが含まれている配信・広告は、AIによって自動的に拒絶される可能性があります。<br><br><b>1:</b> 過度な暴力、性的描写、ヘイトスピーチ等の公序良俗に反する内容。<br><b>2:</b> 「必ず儲かる」「投資で稼ぐ」といった投資詐欺・誇大広告。<br><b>3:</b> 「続きはLINEで」「LINE登録はこちら」などのLINEや外部SNSへ誘導し情報商材を売るようなスパム・詐欺的誘導。</div>',
                    icon: 'info',
                    confirmButtonText: '確認しました'
                });
            } else {
                alert("以下に該当する不適切なコンテンツが含まれている配信・広告は、AIに拒否されます。\n\n1: 暴力、性的描写、ヘイトスピーチ等\n2: 投資詐欺・誇大広告\n3: LINE等への詐欺的誘導");
            }
        }