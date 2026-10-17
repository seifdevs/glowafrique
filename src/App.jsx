import React, { useEffect, useState } from 'react';

function loadClassicScript(path) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-store-script="${path}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      }
      return;
    }
    const script = document.createElement('script');
    script.src = path;
    script.dataset.storeScript = path;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => reject(new Error(`Could not load ${path}`));
    document.body.appendChild(script);
  });
}

export default function App() {
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function startStorefront() {
      try {
        window.GlowAfriqueCurrency = await import('../lib/currency.js');
        await loadClassicScript('/js/i18n.js');
        await loadClassicScript('/js/content.js');
        await loadClassicScript('/js/products.js');
        await import('/js/main.js');
      } catch (loadError) {
        console.error('GlowAfrique could not start:', loadError && loadError.message);
        if (active) setError('The shop could not load. Please refresh the page.');
      }
    }
    startStorefront();
    return () => { active = false; };
  }, []);

  return (
    <div className="react-storefront" data-react-app="glowafrique">
      <div id="site-header" />
      <main id="page-content" aria-live="polite">
        {error ? <section className="not-found"><h1>{error}</h1></section> : null}
      </main>
      <div id="site-footer" />
    </div>
  );
}
