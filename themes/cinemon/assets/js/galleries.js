/* Small, user-controlled galleries with a shared lightbox. No timer or
   dependency; without JavaScript every slide stays stacked with its caption and
   each image links to its full-size file. New images only need a
   data/homepage.json edit. */
export function initGalleries() {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const lightbox = createLightbox();

  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const slides = [...gallery.querySelectorAll('[data-slide]')];
    const bar = gallery.querySelector('[data-gallery-bar]');
    if (!slides.length || !bar) return;
    const selectors = [...gallery.querySelectorAll('[data-go]')];
    const label = gallery.querySelector('[data-gallery-label]');
    const status = gallery.querySelector('[data-gallery-status]');
    const enlarge = gallery.querySelector('[data-enlarge]');
    const multiple = slides.length > 1;
    let current = 0;
    let animation;

    function details(index = current) {
      return {
        gallery_id: gallery.dataset.galleryId,
        image_id: slides[index].dataset.imageId,
        image_title: slides[index].dataset.title,
        slide_index: index + 1,
        slide_count: slides.length,
        section_id: gallery.closest('section[id]')?.id,
      };
    }

    function show(index, announce = true, method = 'keyboard') {
      const previous = current;
      current = (index + slides.length) % slides.length;
      animation?.cancel();
      slides.forEach((slide, i) => { slide.hidden = i !== current; });
      selectors.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
      label.textContent = slides[current].dataset.title;
      enlarge.hidden = !slides[current].querySelector('[data-zoom]');
      if (announce) {
        if (status) status.textContent = `Screenshot ${current + 1} of ${slides.length}: ${slides[current].dataset.title}`;
        if (!motion.matches) animation = slides[current].animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180 });
        if (current !== previous) window.cmAnalytics?.track('gallery_change', { ...details(), interaction_method: method, interaction_location: 'feature_gallery' });
      }
    }

    function open(method) {
      const images = slides.map((slide, index) => {
        const image = slide.querySelector('[data-zoom] img');
        return image && { srcset: image.srcset, src: image.src, alt: image.alt, title: slide.dataset.title, caption: slide.dataset.caption, analytics: details(index) };
      });
      if (images[current]) lightbox?.open(images, current, show, method);
    }

    if (multiple) {
      gallery.setAttribute('aria-roledescription', 'carousel');
      slides.forEach((slide, i) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${i + 1} of ${slides.length}: ${slide.dataset.title}`);
      });
      gallery.querySelector('[data-prev]').addEventListener('click', () => show(current - 1, true, 'previous_button'));
      gallery.querySelector('[data-next]').addEventListener('click', () => show(current + 1, true, 'next_button'));
      selectors.forEach(button => button.addEventListener('click', () => show(Number(button.dataset.go), true, 'pagination')));
      bar.addEventListener('keydown', event => {
        const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        show(next);
      });
    }

    /* A horizontal swipe changes the slide; a tap or click enlarges it. */
    const media = gallery.querySelector('.cm-gallery-slides');
    let start;
    let swiped = false;
    media.addEventListener('pointerdown', event => {
      swiped = false;
      start = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null;
    });
    media.addEventListener('pointerup', event => {
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      swiped = true;
      if (multiple) show(current + (dx < 0 ? 1 : -1), true, 'swipe');
    });
    media.addEventListener('pointercancel', () => { start = null; });
    media.addEventListener('click', event => {
      if (!event.target.closest('[data-zoom]') || !lightbox) return;
      event.preventDefault();
      if (!swiped) open('image_click');
    });
    enlarge.addEventListener('click', () => open('enlarge_button'));

    gallery.dataset.enhanced = '';
    bar.hidden = false;
    show(0, false);
  });
}

function createLightbox() {
  const dialog = document.getElementById('cm-lightbox');
  if (!dialog?.showModal) return null;
  const image = dialog.querySelector('[data-lightbox-image]');
  const title = dialog.querySelector('[data-lightbox-title]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const nav = dialog.querySelector('[data-lightbox-nav]');
  let images = [];
  let index = 0;
  let sync;

  function render() {
    const item = images[index];
    image.sizes = '96vw';
    image.srcset = item.srcset;
    image.src = item.src;
    image.alt = item.alt;
    title.textContent = item.title;
    caption.textContent = item.caption;
  }

  /* Step to the next slide that has an image, keeping the gallery in sync. */
  function step(direction, method = 'lightbox_button') {
    let next = index;
    do { next = (next + direction + images.length) % images.length; } while (!images[next]);
    index = next;
    render();
    sync(index, false);
    window.cmAnalytics?.track('gallery_change', { ...images[index].analytics, interaction_method: method, interaction_location: 'lightbox' });
    recordImage(method);
  }

  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => step(-1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => step(1));
  dialog.addEventListener('keydown', event => {
    if (nav.hidden || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1, 'lightbox_keyboard');
  });

  function recordImage(method) {
    window.cmAnalytics?.track('image_enlarge', { ...images[index].analytics, interaction_method: method, interaction_location: 'lightbox' });
  }

  return {
    open(items, start, onChange, method) {
      images = items;
      index = start;
      sync = onChange;
      nav.hidden = items.filter(Boolean).length < 2;
      render();
      dialog.showModal();
      recordImage(method);
    },
  };
}
