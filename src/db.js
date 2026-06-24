export function getDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('thevault-db', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cart')) db.createObjectStore('cart', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('wishlist')) db.createObjectStore('wishlist', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('listings')) db.createObjectStore('listings', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('leads')) db.createObjectStore('leads', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function initSeed() {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('listings', 'readwrite');
    const store = tx.objectStore('listings');
    const countReq = store.count();
    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        const seedListings = Array.from({ length: 8 }, (_, i) => ({
          id: `l${i + 1}`,
          title: `Vault Item ${i + 1}`,
          price: 20 + i * 10,
          category: 'collectibles',
          image: '',
          seller: 'vaultops',
          views: 0,
          condition: 'mint',
          badge: 'new',
        }));
        const meta = { id: 'meta', items: seedListings.map((x) => x.id) };
        store.put(meta);
        for (const item of seedListings) store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    countReq.onerror = () => reject(countReq.error);
  });
}
