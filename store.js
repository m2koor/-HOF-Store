(() => {
  'use strict';

  const c = window.HOF_CONFIG || {};
  // GOOGLE ANALYTICS: WHATSAPP CLICK TRACKING
document.addEventListener('click', event => {
  const link = event.target.closest('a[href*="wa.me/"]');

  if (!link) return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'whatsapp_click', {
      event_category: 'engagement',
      event_label: link.href,
      transport_type: 'beacon'
    });
  }
});
  const $ = id => document.getElementById(id);

  const grid = $('product-grid');
  const status = $('catalogue-status');

  if (!grid || !status) {
    console.error('HOF: Required catalogue elements were not found.');
    return;
  }

  let rows = [];
  let category = 'All';
  let zoomLevel = 1;
  let currentImages = [];
  let currentImageIndex = 0;
  let currentProductName = '';
  let lastFocusedElement = null;
  let lightboxPreviousFocus = null;

  if ($('year')) {
    $('year').textContent = new Date().getFullYear();
  }

  if (
    !window.supabase ||
    !c.SUPABASE_URL ||
    !c.SUPABASE_PUBLISHABLE_KEY
  ) {
    status.textContent = 'Catalogue connection is not configured.';
    return;
  }

  let db;

  try {
    db = window.supabase.createClient(
      c.SUPABASE_URL,
      c.SUPABASE_PUBLISHABLE_KEY
    );
  } catch (error) {
    console.error('HOF Supabase initialization error:', error);
    status.textContent = 'Unable to connect to our catalogue.';
    return;
  }

  const naira = n =>
    '₦' + Number(n || 0).toLocaleString('en-NG');

  // IMAGE FALLBACK

  function createImageFallback(message = 'HOME OF FABRIC') {
    const placeholder = document.createElement('div');

    placeholder.className = 'hof-image-fallback';
    placeholder.textContent = message;
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', message);

    return placeholder;
  }

  function showImageFallback(image, message = 'IMAGE UNAVAILABLE') {
    if (!image || !image.parentNode) return;

    const placeholder = createImageFallback(message);
    image.replaceWith(placeholder);

    return placeholder;
  }

  // MODAL AND IMAGE VIEWER STYLES

  const modalStyle = document.createElement('style');

  modalStyle.textContent = `
    .hof-image-fallback {
      width: 100%;
      min-height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eee;
      color: #777;
      font-size: 11px;
      letter-spacing: 2px;
      text-align: center;
      padding: 20px;
    }

    .hof-modal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,.86);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow-y: auto;
      backdrop-filter: blur(5px);
    }

    .hof-modal.open { display: flex; }

    .hof-modal-box {
      background: #fff;
      color: #111;
      width: 100%;
      max-width: 820px;
      max-height: 94vh;
      overflow-y: auto;
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: stretch;
    }

    .hof-modal-close {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 5;
      width: 42px;
      height: 42px;
      border: 0;
      background: #111;
      color: white;
      font-size: 25px;
      cursor: pointer;
    }

    .hof-modal-gallery {
      background: #f5f5f5;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .hof-modal-main-image {
      width: 100%;
      height: 500px;
      max-height: 65vh;
      object-fit: contain;
      display: block;
      cursor: zoom-in;
    }

    .hof-modal-thumbs {
      display: flex;
      gap: 8px;
      padding: 12px 14px 16px;
      overflow-x: auto;
    }

    .hof-modal-thumbs button {
      padding: 0;
      border: 2px solid #ddd;
      background: white;
      cursor: pointer;
      flex: 0 0 62px;
      height: 62px;
      opacity: .6;
      transition: .2s ease;
    }

    .hof-modal-thumbs button.active {
      border: 2px solid #111;
      opacity: 1;
    }

    .hof-modal-thumbs img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hof-modal-content {
      padding: 55px 30px 30px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }

    .hof-modal-brand {
      font-size: 10px;
      letter-spacing: 3px;
      font-weight: 700;
      margin: 0 0 22px;
      color: #777;
    }

    .hof-modal-category {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #777;
      margin: 0 0 10px;
    }

    .hof-modal-content h2 {
      font-family: 'Playfair Display', serif;
      font-size: 30px;
      line-height: 1.25;
      margin: 0 0 16px;
      overflow-wrap: anywhere;
    }

    .hof-modal-price {
      font-size: 23px;
      font-weight: 700;
      margin: 0 0 18px;
    }

    .hof-modal-availability {
      display: inline-block;
      align-self: flex-start;
      padding: 8px 12px;
      margin: 0 0 20px;
      border: 1px solid #111;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
    }

    .hof-modal-availability.is-available {
      background: #111;
      color: #fff;
    }

    .hof-modal-availability.is-unavailable {
      background: #eee;
      color: #666;
      border-color: #bbb;
    }

    .hof-modal-divider {
      width: 45px;
      height: 1px;
      background: #111;
      margin: 0 0 20px;
    }

    .hof-modal-description {
      line-height: 1.8;
      color: #555;
      font-size: 13px;
      white-space: pre-wrap;
      margin: 0;
    }

    .hof-modal-order {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #111;
      color: white;
      padding: 17px 18px;
      text-decoration: none;
      margin-top: 28px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-align: center;
      transition: .2s ease;
    }

    .hof-modal-order:hover {
      background: #333;
    }

    .hof-modal-order.disabled {
      opacity: .45;
      cursor: not-allowed;
      pointer-events: none;
    }

    .hof-modal-note {
      font-size: 10px;
      color: #888;
      line-height: 1.6;
      margin-top: 13px;
    }

    .product-card { cursor: pointer; }

    .product-card:focus-visible,
    .hof-modal-close:focus-visible,
    .hof-lightbox button:focus-visible,
    .hof-modal-thumbs button:focus-visible {
      outline: 2px solid #777;
      outline-offset: 3px;
    }

    /* FULL-SCREEN IMAGE VIEWER */

    .hof-lightbox {
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(0,0,0,.96);
      display: none;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 65px 12px 20px;
      touch-action: pan-y;
    }

    .hof-lightbox.open { display: flex; }

    .hof-lightbox-image {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      transform: scale(1);
      transform-origin: center;
      transition: transform .2s ease;
      cursor: zoom-in;
      user-select: none;
      -webkit-user-drag: none;
    }

    .hof-lightbox-close {
      position: absolute;
      top: 14px;
      right: 15px;
      width: 44px;
      height: 44px;
      border: 1px solid #777;
      color: white;
      background: #222;
      font-size: 27px;
      cursor: pointer;
    }

    .hof-lightbox-controls {
      position: absolute;
      top: 14px;
      left: 15px;
      display: flex;
      gap: 7px;
      align-items: center;
    }

    .hof-lightbox-controls button,
    .hof-lightbox-nav {
      min-width: 44px;
      height: 44px;
      padding: 0 12px;
      border: 1px solid #777;
      color: white;
      background: #222;
      font-size: 18px;
      cursor: pointer;
    }

    .hof-zoom-level {
      color: white;
      font-size: 12px;
      align-self: center;
      min-width: 45px;
      text-align: center;
    }

    .hof-lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      width: 46px;
      height: 54px;
      font-size: 25px;
      background: rgba(35,35,35,.85);
    }

    .hof-lightbox-prev { left: 12px; }
    .hof-lightbox-next { right: 12px; }

    .hof-lightbox-counter {
      position: absolute;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 13px;
      letter-spacing: 1px;
      background: rgba(0,0,0,.55);
      padding: 8px 14px;
    }

    @media(max-width:600px) {
      .hof-modal {
        padding: 10px;
        align-items: center;
      }

      .hof-modal-box {
        max-width: 440px;
        max-height: 94vh;
        display: block;
      }

      .hof-modal-main-image {
        height: 38vh;
        max-height: 340px;
      }

      .hof-modal-content {
        padding: 24px 20px 25px;
      }

      .hof-modal-brand {
        margin-bottom: 13px;
      }

      .hof-modal-content h2 {
        font-size: 25px;
      }

      .hof-modal-price {
        font-size: 21px;
      }

      .hof-modal-order {
        margin-top: 22px;
      }

      .hof-lightbox {
        padding: 70px 8px 15px;
      }

      .hof-lightbox-nav {
        width: 38px;
        height: 46px;
      }

      .hof-lightbox-prev { left: 5px; }
      .hof-lightbox-next { right: 5px; }

      .hof-lightbox-controls {
        left: 8px;
        gap: 4px;
      }

      .hof-lightbox-controls button {
        min-width: 38px;
        padding: 0 8px;
      }

      .hof-zoom-level { min-width: 38px; }
    }
  `;

  document.head.append(modalStyle);

  // PRODUCT DETAILS MODAL

  const modal = document.createElement('div');

  modal.className = 'hof-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Product details');
  modal.setAttribute('aria-hidden', 'true');

  modal.innerHTML = `
    <div class="hof-modal-box">
      <button class="hof-modal-close" type="button" aria-label="Close">
        &times;
      </button>

      <div class="hof-modal-gallery">
        <img class="hof-modal-main-image" alt="" title="Tap to enlarge image">
        <div class="hof-modal-thumbs"></div>
      </div>

      <div class="hof-modal-content">
        <p class="hof-modal-brand">HOME OF FABRIC</p>
        <p class="hof-modal-category"></p>
        <h2></h2>
        <p class="hof-modal-price"></p>
        <p class="hof-modal-availability"></p>
        <div class="hof-modal-divider"></div>
        <p class="hof-modal-description"></p>

        <a class="hof-modal-order" target="_blank" rel="noopener">
          ORDER ON WHATSAPP ↗
        </a>

        <p class="hof-modal-note">
          Luxury in Every Thread. Contact us for availability and ordering details.
        </p>
      </div>
    </div>
  `;

  document.body.append(modal);

  // FULL-SCREEN IMAGE VIEWER

  const lightbox = document.createElement('div');

  lightbox.className = 'hof-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Product image viewer');
  lightbox.setAttribute('aria-hidden', 'true');

  lightbox.innerHTML = `
    <div class="hof-lightbox-controls">
      <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
      <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
      <button type="button" data-zoom="reset">FIT</button>
      <span class="hof-zoom-level">100%</span>
    </div>

    <button class="hof-lightbox-close" type="button" aria-label="Close image">
      &times;
    </button>

    <button class="hof-lightbox-nav hof-lightbox-prev"
      type="button" aria-label="Previous image">‹</button>

    <button class="hof-lightbox-nav hof-lightbox-next"
      type="button" aria-label="Next image">›</button>

    <img class="hof-lightbox-image" alt="">

    <span class="hof-lightbox-counter"></span>
  `;

  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector('.hof-lightbox-image');
  const zoomText = lightbox.querySelector('.hof-zoom-level');
  const counter = lightbox.querySelector('.hof-lightbox-counter');
  const previousButton = lightbox.querySelector('.hof-lightbox-prev');
  const nextButton = lightbox.querySelector('.hof-lightbox-next');

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    )).filter(element =>
      element.offsetWidth > 0 ||
      element.offsetHeight > 0 ||
      element === document.activeElement
    );
  }

  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;

    const focusable = getFocusable(container);

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateZoom() {
    lightboxImage.style.transform = `scale(${zoomLevel})`;
    lightboxImage.style.cursor =
      zoomLevel > 1 ? 'zoom-out' : 'zoom-in';

    zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  function setZoom(value) {
    zoomLevel = Math.max(1, Math.min(4, value));
    updateZoom();
  }

  function updateLightboxImage() {
    if (!currentImages.length) return;

    lightboxImage.onerror = () => {
      lightboxImage.alt = 'Image unavailable';
      lightboxImage.removeAttribute('src');
      counter.textContent = 'IMAGE UNAVAILABLE';
    };

    lightboxImage.src = currentImages[currentImageIndex];
    lightboxImage.alt =
      `${currentProductName} image ${currentImageIndex + 1}`;

    counter.textContent =
      `${currentImageIndex + 1} / ${currentImages.length}`;

    const multiple = currentImages.length > 1;

    previousButton.style.display = multiple ? 'block' : 'none';
    nextButton.style.display = multiple ? 'block' : 'none';

    setZoom(1);
  }

  function openLightbox() {
    if (!currentImages.length) return;

    lightboxPreviousFocus = document.activeElement;

    updateLightboxImage();

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';

    lightbox.querySelector('.hof-lightbox-close').focus();
  }

  function closeLightbox() {
    if (!lightbox.classList.contains('open')) return;

    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');

    lightboxImage.removeAttribute('src');

    document.body.style.overflow =
      modal.classList.contains('open') ? 'hidden' : '';

    if (lightboxPreviousFocus &&
        lightboxPreviousFocus.isConnected) {
      lightboxPreviousFocus.focus();
    }

    lightboxPreviousFocus = null;
  }

  function showImage(index) {
    if (!currentImages.length) return;

    currentImageIndex =
      (index + currentImages.length) % currentImages.length;

    const mainImage = modal.querySelector('.hof-modal-main-image');
    const thumbnails = modal.querySelectorAll(
      '.hof-modal-thumbs button'
    );

    const oldFallback = modal.querySelector(
      '.hof-modal-gallery .hof-image-fallback'
    );

    if (oldFallback) oldFallback.remove();

    mainImage.style.display = 'block';
    mainImage.onerror = () => {
      showImageFallback(mainImage);
    };

    mainImage.src = currentImages[currentImageIndex];
    mainImage.alt =
      `${currentProductName} image ${currentImageIndex + 1}`;

    thumbnails.forEach((button, i) => {
      button.classList.toggle('active', i === currentImageIndex);

      if (i === currentImageIndex) {
        button.setAttribute('aria-current', 'true');

        button.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      } else {
        button.removeAttribute('aria-current');
      }
    });

    if (lightbox.classList.contains('open')) {
      updateLightboxImage();
    }
  }

  function previousImage() {
    if (currentImages.length > 1) {
      showImage(currentImageIndex - 1);
    }
  }

  function nextImage() {
    if (currentImages.length > 1) {
      showImage(currentImageIndex + 1);
    }
  }

  // ZOOM CONTROLS

  lightbox.querySelector('[data-zoom="in"]')
    .addEventListener('click', () => {
      setZoom(zoomLevel + 0.5);
    });

  lightbox.querySelector('[data-zoom="out"]')
    .addEventListener('click', () => {
      setZoom(zoomLevel - 0.5);
    });

  lightbox.querySelector('[data-zoom="reset"]')
    .addEventListener('click', () => {
      setZoom(1);
    });

  lightbox.querySelector('.hof-lightbox-close')
    .addEventListener('click', closeLightbox);

  previousButton.addEventListener('click', previousImage);
  nextButton.addEventListener('click', nextImage);

  lightboxImage.addEventListener('click', () => {
    setZoom(zoomLevel > 1 ? 1 : 2);
  });

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  // MOBILE SWIPE NAVIGATION

  let touchStartX = 0;
  let touchStartY = 0;

  lightbox.addEventListener('touchstart', event => {
    if (!event.touches.length) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', event => {
    if (!event.changedTouches.length || zoomLevel > 1) return;

    const differenceX =
      event.changedTouches[0].clientX - touchStartX;

    const differenceY =
      event.changedTouches[0].clientY - touchStartY;

    if (
      Math.abs(differenceX) < 50 ||
      Math.abs(differenceX) < Math.abs(differenceY)
    ) {
      return;
    }

    if (differenceX < 0) {
      nextImage();
    } else {
      previousImage();
    }
  }, { passive: true });

  // PRODUCT MODAL CONTROLS

  function closeModal() {
    if (!modal.classList.contains('open')) return;

    if (lightbox.classList.contains('open')) {
      closeLightbox();
    }

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';

    if (lastFocusedElement &&
        lastFocusedElement.isConnected) {
      lastFocusedElement.focus();
    }

    lastFocusedElement = null;
  }

  modal.querySelector('.hof-modal-close')
    .addEventListener('click', closeModal);

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', event => {
    if (lightbox.classList.contains('open')) {
      trapFocus(lightbox, event);

      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousImage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextImage();
      }

      return;
    }

    if (modal.classList.contains('open')) {
      trapFocus(modal, event);

      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    }
  });

  // OPEN PRODUCT DETAILS

  function openProduct(p) {
    lastFocusedElement = document.activeElement;

    currentImages = Array.isArray(p.images)
      ? p.images.filter(src =>
          typeof src === 'string' && src.trim()
        )
      : [];

    currentImageIndex = 0;
    currentProductName = p.name || 'HOF product';

    const mainImage = modal.querySelector('.hof-modal-main-image');
    const thumbs = modal.querySelector('.hof-modal-thumbs');

    const oldFallback = modal.querySelector(
      '.hof-modal-gallery .hof-image-fallback'
    );

    if (oldFallback) oldFallback.remove();

    mainImage.style.display = currentImages.length ? 'block' : 'none';
    mainImage.removeAttribute('src');
    mainImage.alt = currentProductName;
    mainImage.onclick = openLightbox;

    thumbs.replaceChildren();

    currentImages.forEach((src, index) => {
      const button = document.createElement('button');
      const image = document.createElement('img');

      image.src = src;
      image.alt = `${currentProductName} image ${index + 1}`;
      image.loading = 'lazy';

      image.addEventListener('error', () => {
        image.style.opacity = '.2';
        image.alt = 'Thumbnail unavailable';
      });

      button.type = 'button';
      button.setAttribute(
        'aria-label',
        `View image ${index + 1}`
      );

      button.append(image);

      button.addEventListener('click', () => {
        showImage(index);
      });

      thumbs.append(button);
    });

    thumbs.style.display =
      currentImages.length > 1 ? 'flex' : 'none';

    if (currentImages.length) {
      showImage(0);
    } else {
      const gallery = modal.querySelector('.hof-modal-gallery');
      gallery.append(createImageFallback());
    }

    modal.querySelector('.hof-modal-category').textContent =
      p.category || 'HOF COLLECTION';

    modal.querySelector('.hof-modal-content h2').textContent =
      p.name || 'HOF Collection';

    modal.querySelector('.hof-modal-price').textContent =
      `${naira(p.price)} / ${p.unit || 'item'}`;

    // AVAILABILITY

    const availability =
      modal.querySelector('.hof-modal-availability');

    const isAvailable = p.is_available === true;

    availability.textContent =
      isAvailable ? 'AVAILABLE' : 'OUT OF STOCK';

    availability.className =
      'hof-modal-availability ' +
      (isAvailable ? 'is-available' : 'is-unavailable');

    modal.querySelector('.hof-modal-description').textContent =
      p.description ||
      'Premium-quality fabric with a smooth, elegant finish — perfect for stylish native outfits.';

    // WHATSAPP ORDERING

    const number = (c.WHATSAPP_NUMBER || '2348087674813')
      .replace(/\D/g, '');

    const message =
      `Hello HOF, I am interested in ${p.name}. Please share availability and ordering details.`;

    const order = modal.querySelector('.hof-modal-order');

    order.href =
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    order.classList.toggle('disabled', !isAvailable);

    order.setAttribute(
      'aria-disabled',
      String(!isAvailable)
    );

    if (isAvailable) {
      order.textContent = 'ORDER ON WHATSAPP ↗';
      order.removeAttribute('tabindex');
    } else {
      order.textContent = 'CURRENTLY UNAVAILABLE';
      order.setAttribute('tabindex', '-1');
      order.removeAttribute('href');
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';

    modal.querySelector('.hof-modal-close').focus();
  }

  // CATEGORY FILTERS

  function renderCats() {
    const box = $('category-chips');

    if (!box) return;

    box.replaceChildren();

    const categories = [
      'All',
      ...new Set(rows.map(p => p.category).filter(Boolean))
    ];

    categories.forEach(value => {
      const button = document.createElement('button');

      button.type = 'button';
      button.className =
        'chip' + (category === value ? ' active' : '');

      button.textContent = value;

      if (category === value) {
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.setAttribute('aria-pressed', 'false');
      }

      button.addEventListener('click', () => {
        category = value;
        renderCats();
        render();
      });

      box.append(button);
    });
  }

  // PRODUCT CATALOGUE

  function render() {
    const search = $('search');
    const q = search ? search.value.trim().toLowerCase() : '';

    const items = rows.filter(p =>
      (category === 'All' || p.category === category) &&
      `${p.name || ''} ${p.category || ''} ${p.description || ''}`
        .toLowerCase()
        .includes(q)
    );

    grid.replaceChildren();

    status.textContent = items.length
      ? `${items.length} product(s) in the collection`
      : (rows.length
          ? 'No products match your search.'
          : 'Our collection is being prepared. Please check back soon.');

    items.forEach(p => {
      const card = document.createElement('article');

      card.className = 'product-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');

      card.setAttribute(
        'aria-label',
        `View details for ${p.name || 'HOF product'}`
      );

      const media = document.createElement('div');
      media.className = 'product-image';

      if (p.images?.[0]) {
        const image = document.createElement('img');

        image.src = p.images[0];
        image.alt = p.name || 'HOF product';
        image.loading = 'lazy';

        image.addEventListener('error', () => {
          showImageFallback(image);
        });

        media.append(image);
      } else {
        media.append(createImageFallback());
      }

      if (p.is_new_arrival) {
        const badge = document.createElement('span');

        badge.className = 'badge';
        badge.textContent = 'NEW ARRIVAL';

        media.append(badge);
      }

      const body = document.createElement('div');
      body.className = 'product-info';

      const cat = document.createElement('p');
      cat.className = 'product-category';
      cat.textContent = p.category || 'HOF COLLECTION';

      const title = document.createElement('h3');
      title.textContent = p.name || 'HOF Collection';

      const desc = document.createElement('p');
      desc.className = 'product-description';

      desc.textContent =
        p.description ||
        'Premium-quality fabric with an elegant finish.';

      const price = document.createElement('p');
      price.className = 'product-price';

      price.textContent =
        `${naira(p.price)} / ${p.unit || 'item'}`;

      const link = document.createElement('span');
      link.className = 'text-link';
      link.textContent = 'VIEW PRODUCT DETAILS ↗';

      body.append(cat, title, desc, price, link);
      card.append(media, body);

      card.addEventListener('click', () => {
        openProduct(p);
      });

      card.addEventListener('keydown', event => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          openProduct(p);
        }
      });

      grid.append(card);
    });
  }

  // SEARCH

  if ($('search')) {
    $('search').addEventListener('input', render);
  }

  // LOAD PRODUCTS FROM SUPABASE

  async function loadProducts() {
    status.textContent = 'Loading our collection...';

    try {
      const { data, error } = await db
        .from('products')
        .select(
          'id,name,price,category,unit,description,images,is_available,is_new_arrival,created_at'
        )
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      rows = data || [];

      renderCats();
      render();

    } catch (error) {
      console.error('HOF catalogue loading error:', error);

      status.textContent =
        'Unable to load the collection. Please check your internet connection and try again.';

      grid.replaceChildren();
    }
  }

  loadProducts();

})();
