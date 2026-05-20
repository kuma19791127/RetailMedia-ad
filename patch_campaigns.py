import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

# Chunk 1
target1 = r'const { name, start, end, budget, plan, trigger, target_imp, file_url, url, youtube_url, format, ad_email, ytUrl, fileUrl } = req\.body;\s*console\.log\(`\[API\] Creating Campaign: \$\{name\} \(\$\{plan\}\) \| Advertiser: \$\{ad_email\}\`\);'

replace1 = r'''const { name, start, end, budget, plan, trigger, target_imp, file_url, url, youtube_url, format, ad_email, ytUrl, fileUrl } = req.body;

        // --- Demo Account Restriction ---
        if (ad_email && (ad_email.includes('demo') || ad_email.includes('admin') || ad_email.includes('test'))) {
            console.log(`[API /api/campaigns] Upload rejected: Demo account (${ad_email}) cannot upload to production.`);
            return res.status(403).json({ error: "【デモ制限】デモアカウント（テスト用）では実際の動画アップロード・配信はできません。本番アカウントを登録してください。" });
        }

        // --- 3-Strike Check ---
        if (ad_email) {
            accountStrikes[ad_email] = accountStrikes[ad_email] || 0;
            if (accountStrikes[ad_email] >= 3) {
                console.log(`[API /api/campaigns] Upload rejected: Account ${ad_email} is BANNED (3 strikes).`);
                return res.status(403).json({ error: "【アカウント凍結】重大な規約違反を繰り返したため、アカウントが凍結されています。画面下部からロック解除申請を行ってください。", isBanned: true });
            }
        }

        console.log(`[API] Creating Campaign: ${name} (${plan}) | Advertiser: ${ad_email}`);'''

text = re.sub(target1, replace1, text)

# Chunk 2
target2 = r"if \(text\.includes\('FAIL'\)\) \{ adStatus = 'rejected'; \} else \{ adStatus = 'active'; \}"

replace2 = r'''if (text.includes('FAIL')) { 
                            adStatus = 'rejected'; 
                            if (ad_email) {
                                accountStrikes[ad_email] = (accountStrikes[ad_email] || 0) + 1;
                                console.log(`[Strike] Account ${ad_email} received a strike! Total: ${accountStrikes[ad_email]}`);
                            }
                        } else { 
                            adStatus = 'active'; 
                        }'''

text = re.sub(target2, replace2, text)

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)

print('Patched server_retail_dist.js')
