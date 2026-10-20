(() => {
 const toggle = document.querySelector('.cm-site-toggle');
 const menu = document.querySelector('.cm-site-links');
 if (!toggle || !menu) return;
 const product = menu.querySelector('.cm-product-menu');
 const disclosure = product?.querySelector('details');
 const summary = disclosure?.querySelector('summary');
 const hover = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1100px)');
 let openTimer, closeTimer;
 function cancelTimers() { clearTimeout(openTimer); clearTimeout(closeTimer); }
 function closeProduct(restore = false) {
  cancelTimers();
  if (disclosure) disclosure.open = false;
  if (restore) summary?.focus();
 }
 function close(restore = false) {
  closeProduct();
  menu.classList.remove('cm-open');
  toggle.setAttribute('aria-expanded','false');
  if (restore) toggle.focus();
 }
 product?.addEventListener('pointerenter', e => {
  if (!hover.matches || e.pointerType !== 'mouse') return;
  cancelTimers();
  openTimer = setTimeout(() => { disclosure.open = true; }, 180);
 });
 product?.addEventListener('pointerleave', e => {
  if (!hover.matches || e.pointerType !== 'mouse') return;
  cancelTimers();
  closeTimer = setTimeout(() => {
   if (!product.contains(document.activeElement)) closeProduct();
  }, 250);
 });
 // Native summary handles click, Enter, and Space. Cancel pending hover work
 // so it cannot reopen a menu the visitor has just deliberately closed.
 summary?.addEventListener('click', cancelTimers);
 hover.addEventListener('change', () => closeProduct());
 toggle.addEventListener('click', () => {
  if (menu.classList.contains('cm-open')) close();
  else { menu.classList.add('cm-open'); toggle.setAttribute('aria-expanded','true'); }
 });
 menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
 document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (disclosure?.open) { closeProduct(true); e.preventDefault(); }
  else if (menu.classList.contains('cm-open')) { close(true); e.preventDefault(); }
 });
 document.addEventListener('click', e => {
  if (product && !product.contains(e.target)) closeProduct();
  if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
 });
 // Close when keyboard focus leaves the disclosure, but never hide a link
 // on pointer blur before its native click can navigate (notably on macOS).
 product?.addEventListener('focusout', e => {
  if (e.relatedTarget && !product.contains(e.relatedTarget)) closeProduct();
 });
 document.querySelector('.cm-search input')?.addEventListener('focus', () => close());
 document.querySelector('.cm-contents-toggle')?.addEventListener('click', () => close());
 matchMedia('(min-width: 1100px)').addEventListener('change', () => close());
})();
