(() => {
const c = window.HOF_CONFIG || {};
const $ = id => document.getElementById(id);
const say = (id, message) => {
const el = $(id);
if (el) el.textContent = message || ‘’;
};

const BUCKET = c.STORAGE_BUCKET || ‘product-images’;

if (
!window.supabase ||
!c.SUPABASE_URL ||
!c.SUPABASE_PUBLISHABLE_KEY ||
!c.ADMIN_UID
) {
say(‘login-message’, ‘HOF configuration is incomplete.’);
return;
}

const db = window.supabase.createClient(
c.SUPABASE_URL,
c.SUPABASE_PUBLISHABLE_KEY
);

let existing = [];

function showLogin(message = ‘’) {
$(‘login-panel’).classList.remove(‘hidden’);
$(‘dashboard’).classList.add(‘hidden’);
say(‘login-message’, message);
}

async function verify() {
const { data, error } = await db.auth.getUser();
const user = data?.user;

if (error || !user || user.id !== c.ADMIN_UID) {
  if (user) await db.auth.signOut();
  showLogin('Please sign in with your authorised HOF account.');
  return;
}
$('login-panel').classList.add('hidden');
$('dashboard').classList.remove('hidden');
await load();

}

db.auth.onAuthStateChange((event, session) => {
if (event === ‘SIGNED_OUT’ || !session) {
showLogin(‘Your session has ended. Please sign in again.’);
} else if (session.user?.id !== c.ADMIN_UID) {
showLogin(‘Unauthorised account.’);
db.auth.signOut();
}
});

$(‘login-form’).addEventListener(‘submit’, async e => {
e.preventDefault();

$('login-button').disabled = true;
say('login-message', 'Signing in…');
try {
  const { error } = await db.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });
  if (error) throw error;
  await verify();
} catch (err) {
  say('login-message', err.message);
} finally {
  $('login-button').disabled = false;
}

});

$(‘logout’).onclick = async () => {
await db.auth.signOut();
showLogin(‘Signed out.’);
};

function money(n) {
return ‘₦’ + Number(n || 0).toLocaleString(‘en-NG’);
}

function storagePath(url) {
const marker = /storage/v1/object/public/${BUCKET}/;
const index = url.indexOf(marker);

if (index === -1) return null;
return decodeURIComponent(
  url.slice(index + marker.length).split('?')[0]
);

}

async function removeImages(urls) {
const paths = urls.map(storagePath).filter(Boolean);

if (!paths.length) return;
const { error } = await db.storage.from(BUCKET).remove(paths);
if (error) throw error;

}

function makeBadge(label, state) {
const badge = document.createElement(‘span’);
badge.className = admin-product-badge ${state};
badge.textContent = label;
return badge;
}

function makeImagePreview(url, name) {
const image = document.createElement(‘img’);
image.alt = name || ‘Product image’;
image.loading = ‘lazy’;

if (url) {
  image.src = url;
  image.onerror = () => {
    image.removeAttribute('src');
    image.alt = 'Image unavailable';
    image.classList.add('image-unavailable');
  };
} else {
  image.alt = 'No product image';
  image.classList.add('image-unavailable');
}
return image;

}

async function load() {
say(‘list-message’, ‘Loading products…’);

const { data, error } = await db
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });
if (error) {
  say('list-message', 'Could not load products: ' + error.message);
  return;
}
const box = $('product-list');
box.replaceChildren();
if (!data?.length) {
  say('list-message', 'No products yet. Add your first product.');
  return;
}
say('list-message', data.length + ' product(s)');
data.forEach(p => {
  const row = document.createElement('article');
  row.className = 'admin-product';
  const images = Array.isArray(p.images) ? p.images : [];
  const gallery = document.createElement('div');
  gallery.className = 'admin-product-gallery';
  const mainImage = makeImagePreview(images[0], p.name);
  gallery.append(mainImage);
  if (images.length > 1) {
    const count = document.createElement('span');
    count.className = 'admin-image-count';
    count.textContent = `+${images.length - 1} photos`;
    gallery.append(count);
  }
  const info = document.createElement('div');
  info.className = 'admin-product-info';
  const h = document.createElement('h3');
  h.textContent = p.name || 'Untitled product';
  const price = document.createElement('p');
  price.className = 'admin-product-price';
  price.textContent = `${money(p.price)} / ${p.unit || 'unit'}`;
  const category = document.createElement('p');
  category.className = 'admin-product-category';
  category.textContent = p.category || 'Uncategorised';
  const badges = document.createElement('div');
  badges.className = 'admin-product-badges';
  badges.append(
    makeBadge(
      p.is_available ? 'Available' : 'Unavailable',
      p.is_available ? 'available' : 'unavailable'
    )
  );
  if (p.is_new_arrival) {
    badges.append(makeBadge('New arrival', 'new-arrival'));
  }
  if (p.description) {
    const description = document.createElement('p');
    description.className = 'admin-product-description';
    description.textContent = p.description;
    info.append(h, price, category, badges, description);
  } else {
    info.append(h, price, category, badges);
  }
  const actions = document.createElement('div');
  actions.className = 'admin-product-actions';
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'outline-button';
  edit.textContent = 'EDIT';
  edit.onclick = () => startEdit(p);
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'outline-button';
  del.textContent = 'DELETE';
  del.onclick = () => remove(p);
  actions.append(edit, del);
  row.append(gallery, info, actions);
  box.append(row);
});

}

function startEdit(p) {
$(‘product-id’).value = p.id;
$(‘name’).value = p.name || ‘’;
$(‘price’).value = p.price ?? ‘’;
$(‘category’).value = p.category || ‘’;
$(‘unit’).value = p.unit || ‘yard’;
$(‘description’).value = p.description || ‘’;
$(‘available’).checked = p.is_available !== false;
$(‘new-arrival’).checked = !!p.is_new_arrival;

existing = [...(p.images || [])];
$('form-title').textContent = 'Edit product';
$('save-button').textContent = 'UPDATE PRODUCT';
$('cancel-edit').classList.remove('hidden');
say(
  'form-message',
  existing.length + ' existing photo(s); new photos will be added.'
);
$('product-form').scrollIntoView({ behavior: 'smooth' });

}

function reset() {
$(‘product-form’).reset();
$(‘product-id’).value = ‘’;
$(‘available’).checked = true;

existing = [];
$('form-title').textContent = 'Add a product';
$('save-button').textContent = 'SAVE PRODUCT';
$('cancel-edit').classList.add('hidden');
say('form-message', '');

}

$(‘cancel-edit’).onclick = reset;

async function upload(files) {
const urls = [];

try {
  for (const f of files) {
    if (!f.type.startsWith('image/')) {
      throw Error(f.name + ' is not an image.');
    }
    if (f.size > 10 * 1024 * 1024) {
      throw Error(f.name + ' exceeds 10 MB.');
    }
    const path =
      c.ADMIN_UID + '/' +
      crypto.randomUUID() + '-' +
      f.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, f, {
        upsert: false,
        contentType: f.type
      });
    if (error) throw error;
    const publicUrl = db.storage
      .from(BUCKET)
      .getPublicUrl(path).data.publicUrl;
    urls.push(publicUrl);
  }
  return urls;
} catch (err) {
  if (urls.length) {
    try {
      await removeImages(urls);
    } catch (cleanupError) {
      console.error('Image cleanup failed:', cleanupError);
    }
  }
  throw err;
}

}

$(‘product-form’).addEventListener(‘submit’, async e => {
e.preventDefault();

$('save-button').disabled = true;
say('form-message', 'Saving…');
let added = [];
try {
  const files = [...$('images').files];
  if (files.length) {
    added = await upload(files);
  }
  const record = {
    name: $('name').value.trim(),
    price: Number($('price').value),
    category: $('category').value,
    unit: $('unit').value,
    description: $('description').value.trim(),
    images: [...existing, ...added],
    is_available: $('available').checked,
    is_new_arrival: $('new-arrival').checked,
    updated_at: new Date().toISOString()
  };
  const id = $('product-id').value;
  const result = id
    ? await db.from('products').update(record).eq('id', id)
    : await db.from('products').insert(record);
  if (result.error) throw result.error;
  say('form-message', id ? 'Product updated.' : 'Product added.');
  reset();
  await load();
} catch (err) {
  if (added.length) {
    try {
      await removeImages(added);
    } catch (cleanupError) {
      console.error('Image cleanup failed:', cleanupError);
    }
  }
  say('form-message', 'Save failed: ' + err.message);
} finally {
  $('save-button').disabled = false;
}

});

async function remove(p) {
if (!confirm(Delete "${p.name}"? This cannot be undone.)) {
return;
}

say('list-message', 'Deleting…');
const { error } = await db
  .from('products')
  .delete()
  .eq('id', p.id);
if (error) {
  say('list-message', 'Delete failed: ' + error.message);
  return;
}
try {
  await removeImages(p.images || []);
  say('list-message', 'Product and its images deleted.');
} catch (err) {
  say(
    'list-message',
    'Product deleted, but some images could not be removed: ' + err.message
  );
}
await load();

}

$(‘refresh’).onclick = load;

verify();
})();
