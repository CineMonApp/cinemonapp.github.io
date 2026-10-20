#!/usr/bin/env python3
"""Validate local links, fragments, and image assets in a generated Hugo site.

Usage: python3 scripts/check-docs.py /tmp/cinemon-docs-build
External URLs are intentionally not requested.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import argparse
import re
import sys


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.links = []
        self.ids = set()
        self.duplicates = set()
        source = path.read_text(encoding="utf-8")
        self.shortcode_placeholders = re.findall(r"HAHAHUGOSHORTCODE[^\s<>\"]*?HBHB", source, re.IGNORECASE)
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if identifier := attrs.get("id"):
            if identifier in self.ids:
                self.duplicates.add(identifier)
            self.ids.add(identifier)
        key = "href" if tag == "a" else "src" if tag == "img" else None
        if key and attrs.get(key):
            self.links.append((tag, attrs[key]))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    root = args.directory.resolve()
    if not (root / "docs/index.html").is_file() and not (root / "print.html").is_file():
        parser.error("Expected a built documentation site or print.html")
    pages = {path: Page(path) for path in root.rglob("*.html")}
    errors = set()
    checked = 0
    for path, page in pages.items():
        relative = path.relative_to(root).as_posix()
        if not relative.startswith("docs/") and relative != "print.html":
            continue
        checked += 1
        for placeholder in page.shortcode_placeholders:
            errors.add((relative, "unresolved shortcode", placeholder))
        for identifier in page.duplicates:
            errors.add((relative, "duplicate ID", identifier))
        base = "https://www.cinemon.app/" + relative.removesuffix("index.html")
        for tag, link in page.links:
            url = urlsplit(urljoin(base, link))
            if url.scheme not in ("http", "https") or url.netloc != "www.cinemon.app":
                continue
            destination = root / unquote(url.path).lstrip("/")
            if destination.is_dir():
                destination /= "index.html"
            if not destination.exists():
                errors.add((relative, "missing target", link))
            elif tag == "a" and url.fragment and destination in pages:
                if unquote(url.fragment) not in pages[destination].ids:
                    errors.add((relative, "missing anchor", link))
    for error in sorted(errors):
        print(" | ".join(error))
    print(f"Checked {checked} documentation pages: {len(errors)} issue(s).")
    return bool(errors)


if __name__ == "__main__":
    sys.exit(main())
