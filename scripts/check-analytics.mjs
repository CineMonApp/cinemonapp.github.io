import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/analytics.js', import.meta.url), 'utf8');

// Exercise the transport and delegated click handler without sending real hits.
function page({ local = false, debug = false, embedded = false, enabled = true, area = 'home', path = '/' } = {}) {
  const listeners = new Map(), scripts = [], logs = [];
  const window = {};
  const location = new URL(`${local ? 'http://localhost:18766' : 'https://www.cinemon.app'}${path}${debug ? '?analytics_debug=1' : ''}`);
  const document = {
    currentScript: { dataset: { enabled: String(enabled), gtmId: 'GTM-W5RFBKS9', measurementId: 'G-RGTY2K7NEZ', pageArea: area } },
    documentElement: { classList: { contains: () => embedded } },
    head: { appendChild: element => scripts.push(element) },
    createElement: () => ({}),
    addEventListener: (name, handler) => listeners.set(name, handler),
    querySelectorAll: () => [],
  };
  const context = vm.createContext({ window, document, location, URL, URLSearchParams, Date,
    sessionStorage: { getItem: () => embedded ? '1' : null },
    console: { info: (...args) => logs.push(args) },
  });
  vm.runInContext(source, context);
  return {
    window, scripts, logs, context,
    events: () => (window.dataLayer || []).filter(item => item[0] === 'event'),
    click(href, { placement = 'content', download = false, preview = false, prevented = false, search = false, imageAlt = '' } = {}) {
      const link = {
        href: new URL(href, location).href, textContent: imageAlt ? '  ' : 'Read more',
        classList: { contains: name => name === 'press-image-link' && preview },
        getAttribute: name => name === 'href' ? href : null,
        hasAttribute: name => name === 'download' && download,
        querySelector: selector => selector === 'img' && imageAlt ? { alt: imageAlt } : null,
        closest: selector => {
          if (selector === 'a[href]') return link;
          if (selector === '#mainNav' && placement === 'header') return {};
          if (selector === '.cm-hero-actions' && placement === 'hero') return {};
          if (selector === '#download' && placement === 'download_section') return {};
          if (selector === '#cm-search-results' && search) return {};
          return null;
        },
      };
      listeners.get('click')?.({ target: link, button: 0, defaultPrevented: prevented });
    },
  };
}

test('one GTM loader, no duplicate GA config or manual page view', () => {
  const p = page();
  vm.runInContext(source, p.context);
  assert.equal(p.scripts.length, 1);
  assert.equal(p.scripts[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-W5RFBKS9');
  assert.equal(p.events().length, 0);
  assert.equal(p.window.dataLayer.filter(item => item[0] === 'config').length, 0);
  assert.equal(p.window.dataLayer[0][1].content_group, 'home');
});

test('App Store clicks distinguish placement and omit campaign query strings', () => {
  const p = page();
  for (const placement of ['header', 'hero', 'download_section']) {
    p.click('https://apps.apple.com/us/app/cinemon/id6504142777?itsct=campaign', { placement, imageAlt: 'Download on the App Store' });
  }
  assert.equal(p.events().length, 3);
  p.events().forEach(([command, name, params], index) => {
    assert.equal(name, 'app_store_click');
    assert.equal(params.interaction_location, ['header', 'hero', 'download_section'][index]);
    assert.equal(params.link_url, 'https://apps.apple.com/us/app/cinemon/id6504142777');
    assert.equal(params.link_text, 'Download on the App Store');
    assert.equal(params.send_to, 'G-RGTY2K7NEZ');
  });
});

test('press downloads and image previews are distinct, single events', () => {
  const p = page({ area: 'press' });
  p.click('/press/downloads/cinemon-2.0-press-kit.zip', { download: true });
  p.click('/press/downloads/screenshots/cinemon-2.0-monitoring-mac.jpg', { preview: true });
  p.click('/press/downloads/screenshots/cinemon-2.0-monitoring-mac.jpg', { download: true });
  assert.equal(p.events().length, 3);
  assert.equal(p.events()[0][1], 'press_download');
  assert.equal(p.events()[0][2].asset_type, 'press_kit');
  assert.equal(p.events()[1][1], 'image_enlarge');
  assert.equal(p.events()[2][1], 'press_download');
  assert.equal(p.events()[2][2].asset_type, 'screenshot');
});

test('docs navigation and search selection do not double-count a click', () => {
  const p = page({ area: 'docs' });
  p.click('/docs/monitoring/video/?private=not-sent#tools');
  p.click('/docs/monitoring/audio/', { search: true });
  assert.equal(p.events().length, 2);
  assert.equal(p.events()[0][1], 'docs_link_click');
  assert.equal(p.events()[0][2].destination_path, '/docs/monitoring/video/');
  assert.equal(p.events()[1][1], 'search_result_click');
  assert.equal(p.events()[1][2].content_group, 'docs');
  assert.ok(!JSON.stringify(p.events()).includes('not-sent'));
});

test('prevented image clicks are handled only by the gallery', () => {
  const p = page();
  p.click('/images/home/framing-crops-2400.webp', { prevented: true });
  assert.equal(p.events().length, 0);
});

test('docs table-of-contents anchors are section clicks, not page visits', () => {
  const p = page({ area: 'docs', path: '/docs/monitoring/video/sources/' });
  p.click('#platform-differences');
  assert.equal(p.events().length, 1);
  assert.equal(p.events()[0][1], 'section_link_click');
  assert.equal(p.events()[0][2].destination_section, 'platform-differences');
});

test('local previews and embedded app help never load GTM or send events', () => {
  for (const options of [{ local: true }, { embedded: true }, { enabled: false }]) {
    const p = page(options);
    p.window.cmAnalytics.track('image_enlarge', { image_id: 'test' });
    assert.equal(p.scripts.length, 0);
    assert.equal(p.events().length, 0);
  }
});

test('explicit localhost debug mode logs events without sending them', () => {
  const p = page({ local: true, debug: true });
  p.click('/docs/');
  assert.equal(p.scripts.length, 0);
  assert.equal(p.events().length, 0);
  assert.equal(p.logs.length, 1);
  assert.equal(p.logs[0][1], 'docs_link_click');
});
