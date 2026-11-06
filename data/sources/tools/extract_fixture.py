#!/usr/bin/env python3
"""Small deterministic HTML extraction experiment, limited to authored fixtures.

Not a production crawler/PDF extractor. Keeps table cells, captions and footnotes
in source order rather than turning conditions into unqualified numeric chunks.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urlsplit

BLOCKS = {'h1','h2','h3','h4','h5','h6','p','li','caption','th','td'}
SKIP = {'script','style','nav','footer','header'}


class FixtureParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = []
        self.active = None
        self.buffer = []
        self.heading = {}
        self.blocks = []
        self.table = None
        self.row = None

    def handle_starttag(self,tag,attrs):
        if tag in SKIP:
            self.skip.append(tag)
        if self.skip:
            return
        if tag == 'table':
            if self.table is not None:
                raise ValueError('Nested tables need a specialised extractor')
            self.table = {'kind':'table','section_path':self.section(),'caption':None,'rows':[]}
        elif tag == 'tr':
            self.row = []
        elif tag in BLOCKS:
            if self.active is not None:
                raise ValueError('Nested block markup is outside this fixture extractor')
            self.active = tag
            self.buffer = []
        elif tag == 'br' and self.active:
            self.buffer.append(' ')

    def handle_data(self,data):
        if self.active and not self.skip:
            self.buffer.append(data)

    def section(self):
        return [v for _,v in sorted(self.heading.items())]

    def handle_endtag(self,tag):
        if self.skip:
            if tag == self.skip[-1]:
                self.skip.pop()
            return
        if tag == self.active:
            text = ' '.join(''.join(self.buffer).split())
            if tag.startswith('h') and tag[1:].isdigit():
                level = int(tag[1])
                self.heading = {k:v for k,v in self.heading.items() if k < level}
                self.heading[level] = text
            elif tag == 'caption' and self.table is not None:
                self.table['caption'] = text
            elif tag in ('th','td') and self.row is not None:
                self.row.append({'text':text,'header':tag=='th'})
            elif text:
                self.blocks.append({'kind':'list_item' if tag=='li' else 'paragraph',
                                    'section_path':self.section(),'text':text})
            self.active = None
            self.buffer = []
        elif tag == 'tr' and self.table is not None:
            self.table['rows'].append(self.row or [])
            self.row = None
        elif tag == 'table' and self.table is not None:
            self.blocks.append(self.table)
            self.table = None


def extract(html,source_url):
    if not (urlsplit(source_url).hostname or '').endswith('.invalid'):
        raise ValueError('Only fictional .invalid fixture URLs are accepted')
    parser = FixtureParser()
    parser.feed(html)
    parser.close()
    if parser.active or parser.table is not None or parser.skip:
        raise ValueError('Incomplete fixture HTML')
    return {'extraction_version':'fixture-html/1','source_url':source_url,
            'raw_content_sha256':hashlib.sha256(html.encode()).hexdigest(),
            'blocks':parser.blocks}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('html',type=Path)
    p.add_argument('--source-url',required=True)
    args = p.parse_args()
    print(json.dumps(extract(args.html.read_text(),args.source_url),indent=2,ensure_ascii=False))

if __name__ == '__main__':
    main()
