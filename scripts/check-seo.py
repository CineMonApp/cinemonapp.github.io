#!/usr/bin/env python3
"""Validate rendered metadata, social assets, JSON-LD, and crawl discovery.
Usage: python3 scripts/check-seo.py BUILD_DIRECTORY [--preview]
"""
import argparse
import json
import re
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

class Head(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.inside = False
        self.meta = defaultdict(list)
        self.canonicals, self.icons, self.titles, self.schemas = [], [], [], []
        self.capture = None
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'head': self.inside = True
        if not self.inside: return
        if tag == 'meta': self.meta[attrs.get('name', attrs.get('property', attrs.get('http-equiv', '').lower()))].append(attrs.get('content', ''))
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonicals.append(attrs.get('href'))
        if tag == 'link' and attrs.get('rel') == 'icon': self.icons.append(attrs.get('href'))
        if tag == 'title': self.titles.append(''); self.capture = self.titles
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.schemas.append(''); self.capture = self.schemas
    def handle_endtag(self, tag):
        if tag in ('title', 'script'): self.capture = None
        if tag == 'head': self.inside = False
    def handle_data(self, data):
        if self.capture is not None: self.capture[-1] += data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    root = args.directory
    base = 'https://www.cinemon.app'
    errors, urls, titles = [], set(), {}
    keys = ['description', 'robots', 'og:title', 'og:description', 'og:type', 'og:url', 'og:site_name', 'og:locale', 'og:image', 'og:image:alt', 'og:image:width', 'og:image:height', 'twitter:card', 'twitter:site', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']
    count, redirects = 0, 0
    for path in root.rglob('*.html'):
        if path.name == 'print.html': continue
        rel = path.relative_to(root).as_posix()
        page = Head(path)
        def require(test, message):
            if not test: errors.append(f'{rel}: {message}')
        if page.meta['refresh']:
            redirects += 1
            require(len(page.meta['refresh']) == 1, 'duplicate redirect')
            redirect = re.fullmatch(r'0;\s*url=(.+)', page.meta['refresh'][0], re.IGNORECASE)
            require(bool(redirect), 'expected an immediate redirect')
            if redirect:
                destination = redirect.group(1)
                require(page.canonicals == [destination], 'redirect canonical differs from destination')
                target_url = urlsplit(destination)
                target = root / target_url.path.lstrip('/')
                if target.is_dir(): target /= 'index.html'
                require(target_url.netloc == urlsplit(base).netloc, 'redirect destination is outside the site')
                require(target.is_file() and target != path, 'redirect destination is missing or points to itself')
            continue
        count += 1
        require(len(page.titles) == 1 and bool(page.titles[0].strip()), 'missing/duplicate title')
        for key in keys: require(len(page.meta[key]) == 1 and bool(page.meta[key][0].strip()), f'missing/duplicate {key}')
        # The app section uses Hugo's uglyURLs and retains its index filename.
        route = rel if rel.startswith('app/') else rel.removesuffix('index.html')
        expected = base + '/' + route
        require(page.canonicals == [expected], 'incorrect canonical')
        require(page.meta['og:url'] == [expected], 'OG URL differs from canonical')
        require(page.meta['og:title'] == page.titles == page.meta['twitter:title'], 'inconsistent titles')
        require(page.meta['description'] == page.meta['og:description'] == page.meta['twitter:description'], 'inconsistent descriptions')
        noindex = args.preview or rel == '404.html'
        require(('noindex' in ''.join(page.meta['robots'])) == noindex, 'incorrect indexing policy')
        if not noindex: urls.add(expected)
        if rel != '404.html':
            if page.titles and page.titles[0] in titles: errors.append(f'{rel}: duplicate page title with {titles[page.titles[0]]}')
            if page.titles: titles[page.titles[0]] = rel
            require(len(page.schemas) == 1, 'missing/duplicate JSON-LD')
            for schema in page.schemas:
                try:
                    graph = json.loads(schema)['@graph']
                    types = {node['@type'] for node in graph}
                    require({'WebSite', 'WebPage', 'Organization'} <= types, 'incomplete graph')
                    require(('SoftwareApplication' if rel == 'index.html' else 'BreadcrumbList') in types, 'missing application/breadcrumb data')
                    require('localhost' not in schema, 'preview URL leaked into graph')
                except (ValueError, KeyError, TypeError): errors.append(f'{rel}: invalid JSON-LD')
        for image in page.meta['og:image'] + page.meta['twitter:image']:
            require(image.startswith(base + '/'), 'social image is not absolute production URL')
            require((root / urlsplit(image).path.lstrip('/')).is_file(), 'missing social image')
        require(bool(page.icons), 'missing favicon')
        for icon in page.icons: require((root / icon.lstrip('/')).is_file(), 'missing favicon file')
    robots = (root / 'robots.txt').read_text()
    if args.preview:
        if 'Disallow: /' not in robots: errors.append('Preview robots must disallow crawling')
    else:
        if f'Sitemap: {base}/sitemap.xml' not in robots: errors.append('Missing production sitemap in robots.txt')
        sitemap = ET.parse(root/'sitemap.xml')
        listed = {node.text for node in sitemap.findall('.//{*}loc')}
        if listed != urls: errors.append(f'Sitemap mismatch: missing {urls-listed}, extra {listed-urls}')
    print('\n'.join(errors) if errors else f'SEO checks passed for {count} rendered pages and {redirects} redirects.')
    return bool(errors)

if __name__ == '__main__':
    raise SystemExit(main())
