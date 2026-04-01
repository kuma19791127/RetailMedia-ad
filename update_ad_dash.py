import sys

with open('advertiser_dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

nav_item_active_css = '''        .nav-item.active {
            color: var(--primary);
            font-weight: bold;
        }

        .nav-icon { font-size: 1.2rem; }
        .nav-text { font-size: 1rem; }

        /* Main Content */'''

old_nav_active = '''        .nav-item.active {
            color: var(--primary);
            font-weight: bold;
        }

        /* Main Content */'''

content = content.replace(old_nav_active, nav_item_active_css)

responsive_media = '''        /* Responsive */
        @media(max-width: 768px) {
            body { flex-direction: column; height: auto; }
            .sidebar { 
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%; 
                padding: 5px; 
                flex-direction: row; 
                justify-content: space-between; 
                align-items: center;
                z-index: 1000;
                height: 70px;
                box-sizing: border-box;
                border-top: 1px solid rgba(255,255,255,0.1);
                background: var(--dark);
            }
            .nav-item { 
                flex-direction: column; 
                margin-bottom: 0; 
                padding: 4px; 
                font-size: 0.6rem;
                gap: 4px;
            }
            .nav-item[style*="margin-top:auto"] { margin-top: 0 !important; }
            .nav-icon { font-size: 1.3rem; }
            .nav-text { font-size: 0.55rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
            .logo { display: none; }
            
            .mobile-header {
                display: flex !important;
                background: var(--dark);
                color: white;
                padding: 15px;
                font-size: 1.5rem;
                font-weight: 800;
                justify-content: center;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 1000;
                box-sizing: border-box;
            }
            
            .main { padding: 90px 15px 90px 15px; overflow-y: auto; height: 100vh; box-sizing: border-box; width: 100%; }
            .header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .grid { grid-template-columns: 1fr !important; }
        }
        .mobile-header { display: none; }
    </style>'''

old_responsive = '''        /* Responsive */
        @media(max-width: 768px) {
            body { flex-direction: column; height: auto; }
            .sidebar { width: 100%; padding: 15px; flex-direction: row; flex-wrap: wrap; justify-content: center; }
            .nav-item { margin-bottom: 5px; font-size: 0.9rem; padding: 10px; }
            .logo { width: 100%; text-align: center; margin-bottom: 15px; }
            .main { padding: 15px; overflow-y: visible; }
            .header { flex-direction: column; align-items: flex-start; gap: 15px; }
            .grid { grid-template-columns: 1fr !important; }
        }
    </style>'''

content = content.replace(old_responsive, responsive_media)

sidebar_html = '''    <div class="sidebar">
        <div class="logo">Advertiser<span style="color:var(--primary)">.Hub</span></div>
        <div class="nav-item active" onclick="showSection('analytics')">
            <span class="nav-icon">📊</span><span class="nav-text" style="line-height:1.2;">ｱﾅﾘﾃｨｸｽ</span>
        </div>
        <div class="nav-item" onclick="showSection('campaigns')">
            <span class="nav-icon">📢</span><span class="nav-text" style="line-height:1.2;">ｷｬﾝﾍﾟｰﾝ</span>
        </div>
        <div class="nav-item" onclick="showSection('specs')">
            <span class="nav-icon">🖥️</span><span class="nav-text" style="line-height:1.2;">配信端末</span>
        </div>
        <div class="nav-item" onclick="window.open('/advertiser_lp.html', '_blank')">
            <span class="nav-icon">📖</span><span class="nav-text" style="line-height:1.2;">LP</span>
        </div>
        <div class="nav-item" onclick="registerCreditCard()">
            <span class="nav-icon">💳</span><span class="nav-text" style="line-height:1.2;">ｸﾚｼﾞｯﾄ</span>
        </div>
        <div class="nav-item" style="margin-top:auto" onclick="location.href='/login_portal.html'">
            <span class="nav-icon">🚪</span><span class="nav-text" style="line-height:1.2;">ﾛｸﾞｱｳﾄ</span>
        </div>
    </div>

    <div class="mobile-header">Advertiser<span style="color:var(--primary)">.Hub</span></div>'''

import re
old_sidebar_regex = r'    <div class="sidebar">.*?</div>\n    </div>'
content = re.sub(old_sidebar_regex, sidebar_html, content, flags=re.DOTALL)

with open('advertiser_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully.')
