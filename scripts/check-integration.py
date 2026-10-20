#!/usr/bin/env python3
"""Check the marketing/docs template boundary in a generated unified site."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import argparse
import json

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.styles, self.scripts, self.links, self.ids = [], [], [], set()
        self.title, self.in_title = [], False
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.add(attrs['id'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet': self.styles.append(attrs['href'])
        if tag == 'script' and attrs.get('src'): self.scripts.append(attrs['src'])
        if tag == 'a' and attrs.get('href'): self.links.append(attrs['href'])
        if tag == 'h1': self.in_title = True
    def handle_endtag(self, tag):
        if tag == 'h1': self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title.append(data)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    root = parser.parse_args().directory
    errors = []
    for route, docs in [('index.html',False),('partners/index.html',False),('press/index.html',False),('press/cinemon-2-0/index.html',False),('app/privacy.html',False),('app/terms.html',False),('docs/index.html',True),('docs/monitoring/video/sources/index.html',True)]:
        path = root / route
        if not path.exists():
            errors.append(f'Missing page: {route}')
            continue
        page = Page(path)
        analytics = [u for u in page.scripts if '/js/analytics.' in u]
        if len(analytics) != 1:
            errors.append(f'Expected one shared analytics script: {route}')
        if any('/css/compiled/' in u for u in page.styles) != docs:
            errors.append(f'Wrong stylesheet family: {route}')
        if not any('flexsearch' in u for u in page.scripts):
            errors.append(f'Wrong search script loading: {route}')
        if not any('/css/brand.' in u for u in page.styles):
            errors.append(f'Missing shared brand tokens: {route}')
        if docs and any('/js/marketing/' in u for u in page.scripts):
            errors.append(f'Marketing scripts leaked into docs: {route}')
        if not docs and not any('/js/marketing/main.' in u for u in page.scripts):
            errors.append(f'Missing isolated marketing script: {route}')
        if 'mainNav' not in page.ids or 'cm-search-input' not in page.ids:
            errors.append(f'Missing shared header or search: {route}')
        for url in page.styles + page.scripts:
            parsed = urlsplit(url)
            if not parsed.netloc and not (root / parsed.path.lstrip('/')).is_file():
                errors.append(f'Missing asset: {route}: {url}')
        if any('docs.cinemon.app' in u for u in page.links):
            errors.append(f'Old docs domain: {route}')
    indexes = list(root.glob('en.search-data*.json'))
    if len(indexes) != 1:
        errors.append(f'Expected one English search index, found {len(indexes)}')
        print('\n'.join(errors))
        return True
    index = json.loads(indexes[0].read_text())
    if '/docs/start-here/getting-started/' not in index:
        errors.append('Getting started missing from search')
    for route in ['/', '/partners/', '/press/', '/press/cinemon-2-0/', '/app/privacy.html', '/app/terms.html']:
        if route not in index or not index[route].get('data'):
            errors.append(f'Missing website search content: {route}')
    for route,data in index.items():
        target = root / route.lstrip('/')
        if target.is_dir(): target /= 'index.html'
        if not target.is_file():
            errors.append(f'Missing search destination: {route}')
            continue
        page = Page(target)
        if route.startswith('/docs/'):
            title = ' '.join(''.join(page.title).split())
            if title != data['title']:
                errors.append(f'Search title differs from page: {route}: {data["title"]!r} != {title!r}')
        ids = page.ids
        for heading in data['data']:
            anchor = heading.split('#',1)[0] if '#' in heading else ''
            if anchor and anchor not in ids:
                errors.append(f'Missing search anchor: {route}#{anchor}')
    if (root/'print.html').exists():
        errors.append('Print export must not be published by the normal build')
    print('\n'.join(errors) if errors else 'Unified site integration checks passed.')
    return bool(errors)

if __name__ == '__main__':
    raise SystemExit(main())
