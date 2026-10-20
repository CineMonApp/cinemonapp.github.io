// Hextra's search loader supplies FlexSearch and renders this index URL.
{{ $data := resources.Get "json/search-data.json" | resources.ExecuteAsTemplate (printf "%s.search-data.json" .Language.Lang) . }}
{{ if hugo.IsProduction }}
  {{ $data = $data | minify }}
{{ end }}
{{ $data = $data | fingerprint }}
(() => {
 const input = document.querySelector('#cm-search-input');
 if (!input) return;
 const panel = document.querySelector('.cm-search-panel');
 const list = document.querySelector('#cm-search-results');
 const status = document.querySelector('.cm-search-status');
 const kbd = document.querySelector('.cm-search kbd');
 kbd.textContent = /Mac|iPad|iPhone/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
 let pendingIndex, generation = 0;
 function close() { generation++; panel.hidden = true; input.setAttribute('aria-expanded','false'); }
 function open() { panel.hidden = false; input.setAttribute('aria-expanded','true'); }
 function loadIndex() {
  if (!pendingIndex) pendingIndex = (async () => {
   const response = await fetch("{{ $data.RelPermalink }}");
   if (!response.ok) throw new Error('Search index unavailable');
   const data = await response.json();
   const index = new FlexSearch.Document({tokenize:'forward', document:{id:'id',index:['title','content'],store:true}});
   let id = 0;
   for (const [url,page] of Object.entries(data)) {
    for (const [heading,content] of Object.entries(page.data)) {
     const split = heading.indexOf('#');
     const anchor = split < 0 ? '' : heading.slice(0,split);
     const title = (split < 0 ? page.title : heading.slice(split+1) || page.title)
      .replace(/HAHAHUGOSHORTCODE\S*?HBHB/g, '').trim();
     index.add({id:id++, title, content, url:url+(anchor?'#'+anchor:''), area:page.area, pageTitle:page.title});
    }
   }
   return index;
  })().catch(error => { pendingIndex = null; throw error; });
  return pendingIndex;
 }
 function textElement(tag,cls,text) { const node = document.createElement(tag); node.className=cls; node.textContent=text; return node; }
 async function search() {
  const current = ++generation, query = input.value.trim();
  list.replaceChildren();
  if (!query) { close(); return; }
  open(); status.textContent = 'Searching…';
  try {
   const index = await loadIndex();
   if (current !== generation) return;
   const groups = index.search(query,{enrich:true,limit:20});
   const found = new Map();
   for (const group of groups) for (const result of group.result) {
    if (!found.has(result.doc.url)) found.set(result.doc.url,result.doc);
   }
   const results = [...found.values()].slice(0,12);
   status.textContent = results.length ? `${results.length} results across the site` : 'No results found. Try another search.';
   for (const doc of results) {
    const li=document.createElement('li'), a=document.createElement('a'); a.href=doc.url;
    a.append(textElement('span','cm-result-area',doc.area+(doc.title!==doc.pageTitle?' · '+doc.pageTitle:'')));
    a.append(textElement('span','cm-result-title',doc.title));
    const plain=doc.content.replace(/\s+/g,' ').trim();
    const start=Math.max(0,plain.toLowerCase().indexOf(query.toLowerCase())-50);
    a.append(textElement('span','cm-result-excerpt',(start?'…':'')+plain.slice(start,start+170)+(plain.length>start+170?'…':'')));
    li.append(a); list.append(li);
   }
  } catch (error) {
   if (current === generation) status.textContent='Search is unavailable. Check your connection and try again.';
  }
 }
 input.addEventListener('input',search);
 input.addEventListener('focus', () => { if (input.value.trim()) search(); else loadIndex().catch(()=>{}); });
 input.addEventListener('keydown',e => {
  if (e.key==='ArrowDown') { const first=list.querySelector('a'); if (first && !panel.hidden) { e.preventDefault(); first.focus(); } }
  if (e.key==='Escape') { close(); e.stopPropagation(); }
 });
 list.addEventListener('keydown',e => {
  const links=[...list.querySelectorAll('a')], i=links.indexOf(document.activeElement);
  if (e.key==='ArrowDown' || e.key==='ArrowUp') { e.preventDefault(); const next=i+(e.key==='ArrowDown'?1:-1); if(next<0) input.focus(); else links[Math.min(next,links.length-1)]?.focus(); }
  if(e.key==='Escape') { input.focus(); close(); }
 });
 document.addEventListener('keydown',e => { if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k') { e.preventDefault(); input.focus(); input.select(); } });
 document.addEventListener('click',e => { if (!e.target.closest('.cm-search')) close(); });
 const searchRoot = document.querySelector('.cm-search');
 let pointerInside = false;
 // On macOS, clicking a link can blur the input without focusing the link.
 // Keep results mounted until the browser completes the native link click.
 searchRoot.addEventListener('pointerdown', () => { pointerInside = true; });
 document.addEventListener('pointerup', () => { pointerInside = false; });
 document.addEventListener('pointercancel', () => { pointerInside = false; });
 searchRoot.addEventListener('focusout',e => {
  if (!pointerInside && !e.currentTarget.contains(e.relatedTarget)) close();
 });
 list.addEventListener('click',e => { if (e.target.closest('a')) close(); });
})();
