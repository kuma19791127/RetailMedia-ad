
      if (location.protocol !== 'file:') {
          const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json'; document.head.appendChild(l);
          if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js').catch(e=>console.log(e))); }
      }
    