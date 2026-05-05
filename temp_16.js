let uploadedKycFile = null;
    function handleKycUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        uploadedKycFile = file;
        
        const zone = document.getElementById('kyc-upload-zone');
        const textArea = document.getElementById('kyc-upload-text');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update the zone to show the preview
            zone.innerHTML = '<img src="' + e.target.result + '" style="max-height:150px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1);"><br><span style="color:#10b981; font-weight:bold; display:block; margin-top:10px;">✅ ' + file.name + '</span>';
            
            // Show fake AI scan loader
            const aiZone = document.getElementById('ai-kyc-check');
            aiZone.style.display = 'block';
            aiZone.style.background = '#fef2f2';
            aiZone.style.color = '#991b1b';
            aiZone.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> アップロードされた画像を読み込み中...';
            
            setTimeout(() => {
                aiZone.style.background = '#f0fdf4';
                aiZone.style.color = '#166534';
                aiZone.innerHTML = '<i class="fa-solid fa-check-circle"></i> 画像が正常に読み込まれました。提出できます。';
            }, 1000);
        };
        reader.readAsDataURL(file);
    }

    function openAdvertiserProfileModal() {
        document.getElementById('advertiser-profile-modal').style.display = 'flex';
    }
    function closeAdvertiserProfileModal() {
        document.getElementById('advertiser-profile-modal').style.display = 'none';
        
        // Optional: Ensure the background scrolls or stops scrolling
    }