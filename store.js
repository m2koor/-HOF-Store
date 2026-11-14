(() => {
  const c = window.HOF_CONFIG || {};
  const $ = id => document.getElementById(id);
  const grid = $('product-grid');
  const status = $('catalogue-status');

  let rows = [];
  let category = 'All';
  let zoomLevel = 1;

  $('year').textContent = new Date().getFullYear();

  if (!window.supabase || !c.SUPABASE_URL || !c.SUPABASE_PUBLISHABLE_KEY) {
    status.textContent = 'Catalogue connection is not configured.';
    return;
  }

  const db = window.supabase.createClient(
    c.SUPABASE_URL,
    c.SUPABASE_PUBLISHABLE_KEY
  );

  const naira = n => '₦' + Number(n || 0).toLocaleString('en-NG');

  // PRODUCT AND IMAGE VIEWER STYLES
  const modalStyle = document.createElement('style');

  modalStyle.textContent = `
    .hof-modal {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,.82);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      overflow-y: auto;
    }

    .hof-modal.open { display: flex; }

    .hof-modal-box {
      background: #fff;
      color: #111;
      width: 100%;
      max-width: 760px;
      max-height: 92vh;
      overflow-y: auto;
      position: relative;
    }

    .hof-modal-close {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 2;
      width: 42px;
      height: 42px;
      border: 0;
      background: #111;
      color: white;
      font-size: 25px;
      cursor: pointer;
    }

    .hof-modal-main-image {
      width: 100%;
      height: 65vh;
      max-height: 650px;
      object-fit: contain;
      display: block;
      background: #f5f5f5;
      cursor: zoom-in;
    }

    .hof-modal-thumbs {
      display: flex;
      gap: 8px;
      padding: 12px 20px 0;
      overflow-x: auto;
    }

    .hof-modal-thumbs button {
      padding: 0;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      flex: 0 0 65px;
      height: 65px;
    }

    .hof-modal-thumbs img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hof-modal-content { padding: 24px; }

    .hof-modal-content h2 {
      font-family: 'Playfair Display', serif;
      font-size: 30px;
      margin: 8px 0;
    }

    .hof-modal-category {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .hof-modal-price {
      font-size: 21px;
      font-weight: 700;
      margin: 18px 0;
    }

    .hof-modal-description {
      line-height: 1.8;
      color: #555;
      white-space: pre-wrap;
    }

    .hof-modal-order {
      display: inline-block;
      background: #111;
      color: white;
      padding: 15px 22px;
      text-decoration: none;
      margin-top: 18px;
      font-size: 12px;
      letter-spacing: 1px;
    }

    .product-card { cursor: pointer; }

    .product-card:focus-visible {
      outline: 2px solid #111;
      outline-offset: 4px;
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
    }

    .hof-lightbox-controls button {
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

    @media(max-width:600px) {
      .hof-modal-main-image {
        height: 55vh;
        max-height: 480px;
      }

      .hof-modal-content h2 { font-size: 25px; }

      .hof-lightbox {
        padding: 70px 8px 15px;
      }
    }
  `;

  document.head.append(modalStyle);

  // PRODUCT DETAILS MODAL

  const modal = document.createElement('div');

  modal.className = 'hof-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Product details');

  modal.innerHTML = `
    <div class="hof-modal-box">
      <button class="hof-modal-close" type="button" aria-label="Close">&times;</button>

      <img class="hof-modal-main-image" alt="" title="Tap to enlarge image">

      <div class="hof-modal-thumbs"></div>

      <div class="hof-modal-content">
        <p class="hof-modal-category"></p>
        <h2></h2>
        <p class="hof-modal-price"></p>
        <p class="hof-modal-description"></p>
        <a class="hof-modal-order" target="_blank" rel="noopener">
          ORDER ON WHATSAPP ↗
        </a>
      </div>
    </div>
  `;

  document.body.append(modal);

  // FULL-SCREEN IMAGE VIEWER

  const lightbox = document.createElement('div');

  lightbox.className = 'hof-lightbox';

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

    <img class="hof-lightbox-image" alt="">
  `;

  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector('.hof-lightbox-image');
  const zoomText = lightbox.querySelector('.hof-zoom-level');

  function updateZoom() {
    lightboxImage.style.transform = `scale(${zoomLevel})`;
    lightboxImage.style.cursor = zoomLevel > 1 ? 'zoom-out' : 'zoom-in';
    zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  function setZoom(value) {
    zoomLevel = Math.max(1, Math.min(4, value));
    updateZoom();
  }

  function openLightbox(src, alt) {
    if (!src) return;

    lightboxImage.src = src;
    lightboxImage.alt = alt || 'HOF product image';

    setZoom(1);

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxImage.removeAttribute('src');
    document.body.style.overflow = modal.classList.contains('open') ? 'hidden' : '';
  }

  lightbox.querySelector('[data-zoom="in"]').addEventListener('click', () => {
    setZoom(zoomLevel + 0.5);
  });

  lightbox.querySelector('[data-zoom="out"]').addEventListener('click', () => {
    setZoom(zoomLevel - 0.5);
  });

  lightbox.querySelector('[data-zoom="reset"]').addEventListener('click', () => {
    setZoom(1);
  });

  lightbox.querySelector('.hof-lightbox-close').addEventListener('click', closeLightbox);

  lightboxImage.addEventListener('click', () => {
    setZoom(zoomLevel > 1 ? 1 : 2);
  });

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  // PRODUCT MODAL CONTROLS

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  modal.querySelector('.hof-modal-close').addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (lightbox.classList.contains('open')) {
        closeLightbox();
      } else if (modal.classList.contains('open')) {
        closeModal();
      }
    }
  });

  // OPEN PRODUCT DETAILS

  function openProduct(p) {
    const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

    const mainImage = modal.querySelector('.hof-modal-main-image');
    const thumbs = modal.querySelector('.hof-modal-thumbs');

    mainImage.style.display = images.length ? 'block' : 'none';
    mainImage.src = images[0] || '';
    mainImage.alt = p.name || 'HOF product';

    mainImage.onclick = () => {
      openLightbox(mainImage.src, mainImage.alt);
    };

    thumbs.replaceChildren();

    images.forEach((src, index) => {
      const button = document.createElement('button');
      const image = document.createElement('img');

      image.src = src;
      image.alt = `${p.name} image ${index + 1}`;
      image.loading = 'lazy';

      button.setAttribute('aria-label', `View image ${index + 1}`);

      button.append(image);

      button.addEventListener('click', () => {
        mainImage.src = src;
      });

      thumbs.append(button);
    });

    modal.querySelector('.hof-modal-category').textContent =
      p.category || 'HOF COLLECTION';

    modal.querySelector('.hof-modal-content h2').textContent = p.name || '';

    modal.querySelector('.hof-modal-price').textContent =
      `${naira(p.price)} / ${p.unit || 'item'}`;

    modal.querySelector('.hof-modal-description').textContent =
      p.description || 'Premium-quality fabric with an elegant finish.';

    const number = (c.WHATSAPP_NUMBER || '2348087674813').replace(/\D/g, '');

    const message =
      `Hello HOF, I am interested in ${p.name}. Please share availability and ordering details.`;

    const order = modal.querySelector('.hof-modal-order');

    order.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // CATEGORY FILTERS

  function renderCats() {
    const box = $('category-chips');
    box.replaceChildren();

    ['All', ...new Set(rows.map(p => p.category).filter(Boolean))].forEach(v => {
      const b = document.createElement('button');

      b.className = 'chip' + (category === v ? ' active' : '');
      b.textContent = v;

      b.onclick = () => {
        category = v;
        renderCats();
        render();
      };

      box.append(b);
    });
  }

  // PRODUCT CATALOGUE

  function render() {
    const q = $('search').value.trim().toLowerCase();

    const items = rows.filter(p =>
      (category === 'All' || p.category === category) &&
      `${p.name} ${p.category} ${p.description || ''}`.toLowerCase().includes(q)
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
      card.setAttribute('aria-label', `View details for ${p.name}`);

      const media = document.createElement('div');
      media.className = 'product-image';

      if (p.images?.[0]) {
        const im = document.createElement('img');

        im.src = p.images[0];
        im.alt = p.name;
        im.loading = 'lazy';

        media.append(im);
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
      title.textContent = p.name;

      const desc = document.createElement('p');
      desc.className = 'product-description';
      desc.textContent =
        p.description || 'Premium-quality fabric with an elegant finish.';

      const price = document.createElement('p');
      price.className = 'product-price';
      price.textContent = `${naira(p.price)} / ${p.unit || 'item'}`;

      const link = document.createElement('span');
      link.className = 'text-link';
      link.textContent = 'VIEW PRODUCT DETAILS ↗';

      body.append(cat, title, desc, price, link);
      card.append(media, body);

      card.addEventListener('click', () => openProduct(p));

      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProduct(p);
        }
      });

      grid.append(card);
    });
  }

  $('search').addEventListener('input', render);

  // LOAD PRODUCTS FROM SUPABASE

  db.from('products')
    .select('id,name,price,category,unit,description,images,is_available,is_new_arrival,created_at')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        status.textContent = 'Unable to load the collection. Please try again later.';
        console.error(error);
        return;
      }

      rows = data || [];

      renderCats();
      render();
    });
})();
