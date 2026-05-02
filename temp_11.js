// API Configuration for Local Execution
        const API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
            ? 'http://localhost:3000'
            : '';

        // --- Data Handling ---
        // Panel Switching Logic
        function showPanel(panelId) {
            // Hide all panels
            document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
            // Show target
            document.getElementById('panel-' + panelId).style.display = 'block';

            // Update Sidebar Active State
            const items = document.querySelectorAll('.nav-item');
            items.forEach(i => i.classList.remove('active')); // Use class classList logic if possible, or manual style reset

            // Manual Reset for inline styles (from previous code)
            items.forEach(i => {
                i.style.background = 'transparent';
                i.style.color = '#bdc3c7';
            });

            // Highlight Logic
            let activeIndex = 0;
            if (panelId === 'dashboard') activeIndex = 0;
            if (panelId === 'api') activeIndex = 1;
            if (panelId === 'support') activeIndex = 2; // New

            if (items[activeIndex]) {
                items[activeIndex].style.background = 'rgba(255,255,255,0.1)';
                items[activeIndex].style.color = 'white';
            }
        }

        function sendSupportEmail() {
            const subject = document.getElementById('contact-subject').value;
            const body = document.getElementById('contact-message').value;
            const targetEmail = "buzzkun0807@gmail.com";

            if (!subject || !body) {
                Swal.fire('Error', '件名と本文を入力してください。', 'warning');
                return;
            }

            // Create Mailto Link
            const mailtoLink = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            // Open
            window.location.href = mailtoLink;
        }