"""Check static routes, fragment links, metadata and local asset references."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parent.parent/'dist'
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__(convert_charrefs=True); self.path=path; self.ids=set(); self.refs=[]; self.stack=[]; self.h1=0; self.title=False; self.description=False
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag not in VOID:self.stack.append(tag)
  if tag=='h1':self.h1+=1
  if tag=='title':self.title=True
  if tag=='meta' and d.get('name')=='description':self.description=bool(d.get('content'))
  if 'id' in d:
   assert d['id'] not in self.ids, f'Duplicate id {d["id"]}: {self.path}'
   self.ids.add(d['id'])
  if tag=='img':assert d.get('alt') is not None,f'Missing alt: {self.path}'
  for key in ('src','href'):
   if d.get(key):self.refs.append(d[key])
 def handle_endtag(self,tag):
  if tag in VOID:return
  assert self.stack and self.stack[-1]==tag, f'Unbalanced {tag}, stack={self.stack}: {self.path}'
  self.stack.pop()
pages={}
for path in ROOT.rglob('*.html'):
 p=Page(path.relative_to(ROOT));p.feed(path.read_text());assert not p.stack,(path,p.stack)
 assert p.h1==1, f'{path}: expected one h1, got {p.h1}'
 assert p.title and p.description,f'Missing metadata: {path}'
 pages[path.resolve()]=p
for path,p in pages.items():
 for ref in p.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc:continue
  target=(ROOT/u.path.lstrip('/')) if u.path.startswith('/') else (path.parent/u.path if u.path else path)
  if target.is_dir():target=target/'index.html'
  target=target.resolve()
  assert target.is_file(),f'Broken link in {p.path}: {ref}'
  if u.fragment and target in pages:assert unquote(u.fragment) in pages[target].ids,f'Missing fragment in {p.path}: {ref}'
print(f'PASS: {len(pages)} HTML documents: structure, unique IDs, titles, descriptions, images, routes and anchors.')
