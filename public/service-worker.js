const CACHE_VERSION = 'v1';
const CACHE_NAME = `mystify-me-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  // Vite will inject the actual built filenames here, but we'll handle them dynamically
];

// All cloud images - cache the most common ones first
const CLOUD_IMAGES = {
  essential: [
    // Cache a few from each category immediately for faster first experience
    '/images/clouds/Regular/Cloud_Reg_1.webp',
    '/images/clouds/Regular/Cloud_Reg_2.webp',
    '/images/clouds/Regular/Cloud_Reg_3.webp',
    '/images/clouds/Regular/Cloud_Reg_4.webp',
    '/images/clouds/Regular/Cloud_Reg_5.webp',
    '/images/clouds/Regular/Cloud_Reg_6.webp'
  ],
  regular: [
    '/images/clouds/Regular/Cloud_Reg_1.webp',
    '/images/clouds/Regular/Cloud_Reg_2.webp',
    '/images/clouds/Regular/Cloud_Reg_3.webp',
    '/images/clouds/Regular/Cloud_Reg_4.webp',
    '/images/clouds/Regular/Cloud_Reg_5.webp',
    '/images/clouds/Regular/Cloud_Reg_6.webp',
    '/images/clouds/Regular/Cloud_Reg_7.webp',
    '/images/clouds/Regular/Cloud_Reg_8.webp',
    '/images/clouds/Regular/Cloud_Reg_9.webp',
    '/images/clouds/Regular/Cloud_Reg_10.webp',
    '/images/clouds/Regular/Cloud_Reg_11.webp',
  ],
  heavy: [
    '/images/clouds/Heavy/Cloud_Heavy_1.webp',
    '/images/clouds/Heavy/Cloud_Heavy_1_flipped.webp',
    '/images/clouds/Heavy/Cloud_Heavy_2.webp',
    '/images/clouds/Heavy/Cloud_Heavy_2_flipped.webp',
    '/images/clouds/Heavy/Cloud_Heavy_3.webp',
    '/images/clouds/Heavy/Cloud_Heavy_3_flipped.webp',
    '/images/clouds/Heavy/Cloud_Heavy_4.webp',
    '/images/clouds/Heavy/Cloud_Heavy_4_flipped.webp'
  ],
  light: [
    '/images/clouds/Light/Cloud_Light_1.webp',
    '/images/clouds/Light/Cloud_Light_2.webp',
    '/images/clouds/Light/Cloud_Light_3.webp',
    '/images/clouds/Light/Cloud_Light_4.webp',
    '/images/clouds/Light/Cloud_Light_5.webp',
    '/images/clouds/Light/Cloud_Light_6.webp',
  ]
};

// Combine essential assets for immediate caching
const IMMEDIATE_CACHE_ASSETS = [
  ...CORE_ASSETS,
  ...CLOUD_IMAGES.essential
];

// Install event - cache essential assets immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache essential assets first
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Caching essential assets');
          return cache.addAll(IMMEDIATE_CACHE_ASSETS);
        }),
      
      // Then start background caching of remaining cloud images
      cacheRemainingAssets()
    ])
    .then(() => {
      console.log('Essential assets cached, starting background caching');
      self.skipWaiting();
    })
    .catch((error) => {
      console.error('Failed to cache essential assets:', error);
    })
  );
});

// Background function to cache remaining assets without blocking installation
async function cacheRemainingAssets() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Cache remaining cloud images in batches to avoid overwhelming the browser
    const allRemainingImages = [
      ...CLOUD_IMAGES.regular.filter(img => !CLOUD_IMAGES.essential.includes(img)),
      ...CLOUD_IMAGES.heavy,
      ...CLOUD_IMAGES.light.filter(img => !CLOUD_IMAGES.essential.includes(img))
    ];
    
    // Cache in batches of 5 to be GENTLE on the browser
    const batchSize = 5;
    for (let i = 0; i < allRemainingImages.length; i += batchSize) {
      const batch = allRemainingImages.slice(i, i + batchSize);
      
      try {
        await cache.addAll(batch);
        console.log(`Cached batch ${Math.floor(i/batchSize) + 1} of cloud images`);
        
        // Small delay between batches to not OVERWHELM the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('Failed to cache image batch:', batch, error);
        // Continue with next batch even if this one fails
      }
    }
    
    console.log('Background caching completed');
  } catch (error) {
    console.error('Background caching failed:', error);
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old cache
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take CONTROL of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(handleRequest(event.request));
});

// Main request handling logic
async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (isStaticAsset(url)) {
    return handleCacheFirst(request);
  } else if (isHTMLRequest(url)) {
    return handleNetworkFirst(request);
  } else {
    return handleCacheFirst(request);
  }
}

function isStaticAsset(url) {
  const staticExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function isHTMLRequest(url) {
  return url.pathname === '/' || 
         url.pathname.endsWith('.html') || 
         (!url.pathname.includes('.') && !url.pathname.startsWith('/api/'));
}

// Cache First strategy - perfect for static assets
async function handleCacheFirst(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses for next time
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    // Could return a fallback image here for failed image requests
    throw error;
  }
}

// Network First strategy - for HTML and dynamic content
async function handleNetworkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving from cache due to network failure:', request.url);
      return cachedResponse;
    }
    
    // No cache either - truly offline
    console.error('Request failed and not in cache:', request.url);
    throw error;
  }
}