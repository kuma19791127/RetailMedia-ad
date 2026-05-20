import codecs

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    text = f.read()

# Update loadFinanceDB
target_load = """if (data.kycRequests) kycRequests = data.kycRequests;
            console.log(`[Finance DB] Loaded ${withdrawalRequests.length} withdrawals, ${Object.keys(creatorBanks).length} banks, ${kycRequests.length} KYCs.`);"""
replace_load = """if (data.kycRequests) kycRequests = data.kycRequests;
            if (data.agencyReferrals) agencyReferrals = data.agencyReferrals;
            console.log(`[Finance DB] Loaded ${withdrawalRequests.length} withdrawals, ${Object.keys(creatorBanks).length} banks, ${kycRequests.length} KYCs, ${agencyReferrals.length} Agency Referrals.`);"""
if target_load in text:
    text = text.replace(target_load, replace_load)

# Update saveFinanceDB
target_save = """withdrawalRequests,
            creatorBanks,
            kycRequests
        };"""
replace_save = """withdrawalRequests,
            creatorBanks,
            kycRequests,
            agencyReferrals
        };"""
if target_save in text:
    text = text.replace(target_save, replace_save)

# Inject saveFinanceDB() where agencyReferrals is modified
target_push = "agencyReferrals.push({"
replace_push = "setTimeout(saveFinanceDB, 100);\n    agencyReferrals.push({"
if target_push in text:
    text = text.replace(target_push, replace_push)

target_status = "ref.status = status;"
replace_status = "ref.status = status;\n        saveFinanceDB();"
if target_status in text:
    text = text.replace(target_status, replace_status)

with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
    f.write(text)

print("Patched server_retail_dist.js to save agency data")
