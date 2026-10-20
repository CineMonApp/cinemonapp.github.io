/* Shared GA4 events. GTM owns configuration and automatic page views; this
   script sends interactions to that existing destination, never a second config.
   Local previews only log events when ?analytics_debug=1 is explicitly set. */
(() => {
  const script = document.currentScript;
  if (!script || window.cmAnalytics) return;
  const { enabled, gtmId, measurementId, pageArea } = script.dataset;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const debug = local && new URLSearchParams(location.search).get('analytics_debug') === '1';
  let embedded = document.documentElement.classList.contains('cm-embedded');
  try { embedded ||= sessionStorage.getItem('cm-embedded') === '1'; } catch (_) { /* Storage may be unavailable. */ }
  const send = enabled === 'true' && !local && !embedded && Boolean(gtmId && measurementId);
  const active = !embedded && (send || debug);
  const text = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 100);

  function track(name, parameters = {}) {
    if (!active) return;
    const params = { content_group: pageArea, page_path: location.pathname, ...parameters };
    if (debug) console.info('[CineMon analytics]', name, JSON.stringify(params));
    if (send) window.gtag('event', name, { ...params, send_to: measurementId });
  }
  window.cmAnalytics = { track };
  if (!active) return;

  if (send) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('set', { content_group: pageArea });
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.appendChild(tag);
  }

  function context(element) {
    const section = element.closest('section[id], header[id]');
    let placement = 'content';
    if (element.closest('#mainNav')) placement = 'header';
    else if (element.closest('#footer')) placement = 'footer';
    else if (element.closest('.cm-hero-actions')) placement = 'hero';
    else if (element.closest('#download')) placement = 'download_section';
    else if (element.closest('.hextra-sidebar-container')) placement = 'docs_sidebar';
    else if (element.closest('.hextra-toc')) placement = 'docs_contents';
    else if (element.closest('.cm-feature-card, .cm-showcase-lead')) placement = 'feature_card';
    else if (element.closest('.cm-highlight')) placement = 'whats_new_card';
    return { interaction_location: placement, section_id: section?.id || pageArea };
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button > 0) return;
    const raw = link.getAttribute('href');
    const base = context(link);
    const linkText = text(link.querySelector('h3')?.textContent || link.getAttribute('aria-label') || link.textContent) || text(link.querySelector('img')?.alt);
    if (raw.startsWith('mailto:')) {
      track('contact_click', { ...base, contact_type: raw.includes('press@') ? 'press' : 'general' });
      return;
    }
    const url = new URL(link.href, location.href);
    if (!['https:', 'http:'].includes(url.protocol)) return;
    const destination = url.origin + url.pathname;
    if (url.hostname === 'apps.apple.com') {
      track('app_store_click', { ...base, link_url: destination, link_text: linkText });
    } else if (url.origin === location.origin && url.pathname.startsWith('/press/downloads/')) {
      const filename = url.pathname.split('/').pop();
      if (!link.hasAttribute('download') && link.classList.contains('press-image-link')) {
        track('image_enlarge', { ...base, image_id: filename, image_title: text(link.closest('figure')?.querySelector('h3')?.textContent), interaction_method: 'open_file' });
      } else {
        let kind = 'artwork';
        if (filename.endsWith('.zip')) kind = 'press_kit';
        else if (filename.includes('press-release')) kind = 'press_release';
        else if (filename.includes('fact-sheet')) kind = 'fact_sheet';
        else if (filename.endsWith('.csv')) kind = 'image_captions';
        else if (url.pathname.includes('/screenshots/')) kind = 'screenshot';
        track('press_download', { ...base, asset_type: kind, file_name: filename, file_extension: filename.split('.').pop() });
      }
    } else if (link.closest('#cm-search-results')) {
      track('search_result_click', { ...base, destination_path: url.pathname, result_title: text(link.querySelector('.cm-result-title')?.textContent) });
    } else if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
      track('section_link_click', { ...base, destination_section: text(url.hash.slice(1)), link_text: linkText });
    } else if (url.origin === location.origin && url.pathname.startsWith('/docs/')) {
      track('docs_link_click', { ...base, destination_path: url.pathname, link_text: linkText });
    } else if (url.origin !== location.origin) {
      track('outbound_link_click', { ...base, link_url: destination, link_text: linkText });
    }
  });

  /* Measure actual zoom openings if a docs page enables Hextra's image zoom. */
  document.addEventListener('medium-zoom:opened', event => {
    const image = event.target;
    track('image_enlarge', { image_id: new URL(image.src, location.href).pathname.split('/').pop(), image_title: text(image.alt), interaction_location: 'docs_image', interaction_method: 'zoom' });
  }, true);

  /* Observe headings, not entire tall sections: the latter never reach a useful
     visibility ratio on small screens. One event per section per page load. */
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target.closest('section[id]');
        track('section_view', { section_id: section.id, section_title: text(entry.target.textContent) });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.5 });
    document.querySelectorAll('body.cm-home section[id] h2').forEach(heading => observer.observe(heading));
  }
})();
