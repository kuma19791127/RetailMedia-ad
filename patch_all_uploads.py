import codecs
import re

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

# 1. Fix /api/campaigns
target_camp = "if (ad_email && (ad_email.includes('demo') || ad_email.includes('admin') || ad_email.includes('test')))"
replace_camp = "if (!ad_email || ad_email.includes('demo') || ad_email.includes('admin') || ad_email.includes('test') || ad_email === 'client@example.com' || ad_email === 'Guest' || ad_email === 'Unknown')"
text = text.replace(target_camp, replace_camp)

# 2. Fix /api/creator/upload
target_creator = "const { title, src, format, isAd } = req.body;"
replace_creator = """const { title, src, format, isAd, email } = req.body;
    
    // --- Demo Account Restriction ---
    const creatorEmail = email || 'Guest';
    if (creatorEmail.includes('demo') || creatorEmail.includes('admin') || creatorEmail.includes('test') || creatorEmail === 'client@example.com' || creatorEmail === 'Guest' || creatorEmail === 'Unknown') {
        console.log(`[API /api/creator/upload] Upload rejected: Demo account (${creatorEmail}) cannot upload to production.`);
        return res.status(403).json({ error: "【デモ制限】デモアカウント（テスト用）では実際の動画アップロード・配信はできません。本番アカウントを登録してください。" });
    }

    // --- 3-Strike Check ---
    accountStrikes[creatorEmail] = accountStrikes[creatorEmail] || 0;
    if (accountStrikes[creatorEmail] >= 3) {
        console.log(`[API /api/creator/upload] Upload rejected: Account ${creatorEmail} is BANNED (3 strikes).`);
        return res.status(403).json({ error: "【アカウント凍結】重大な規約違反を繰り返したため、アカウントが凍結されています。画面下部からロック解除申請を行ってください。", isBanned: true });
    }"""
text = text.replace(target_creator, replace_creator)

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)

print('Patched ALL endpoints in server_retail_dist.js')
