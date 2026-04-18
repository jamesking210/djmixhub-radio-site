
const STATION = {
  name: 'DJMixHub Live',
  publicPlayerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  liveApiUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  staticApiUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3',
  fallbackArtUrl: '/assets/img/logo.jpg'
};

const ROUTES = {
  '/': { partial: '/partials/home.html', title: 'DJMixHub.com | Live Radio' },
  '/about': { partial: '/partials/about.html', title: 'About | DJMixHub.com' },
  '/djs': { partial: '/partials/djs.html', title: 'DJ Bios | DJMixHub.com' },
  '/terms': { partial: '/partials/terms.html', title: 'Terms & Conditions | DJMixHub.com' }
};

const audio = document.getElementById('station-audio');
const playToggle = document.getElementById('play-toggle');
const volumeRange = document.getElementById('volume-range');
const yearEl = document.getElementById('year');
const termsConsent = document.getElementById('terms-consent');
const appMain = document.getElementById('app-main');
const TERMS_KEY = 'djmixhub-terms-accepted';
const VOLUME_KEY = 'djmixhub-volume';

let isPlaying = false;
let currentStreamUrl = STATION.fallbackStreamUrl;
let lastPayload = null;
let refreshTimer = null;

const normalizePath = (value) => {
  if (!value || value === '/index.html') return '/';
  if (value.endsWith('.html')) return value.replace(/\.html$/, '') || '/';
  return value;
};

const routeForPath = (pathname) => ROUTES[normalizePath(pathname)] || ROUTES['/'];
const getPlayButtons = () => Array.from(document.querySelectorAll('.js-play-toggle'));

const setText = (selector, value) => {
  const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (element) element.textContent = value;
};

const setImage = (selector, src, alt = 'Current album art') => {
  const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!element) return;
  element.src = src || STATION.fallbackArtUrl;
  element.alt = alt;
};

const syncYear = () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

const updateActiveNav = (pathname = window.location.pathname) => {
  document.querySelectorAll('.site-nav a[data-route], .footer-links a[data-route], .brand[data-route]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const isActive = normalizePath(href) === normalizePath(pathname);
    link.classList.toggle('active', isActive && link.closest('.site-nav'));
  });
};

const setPlayButtonState = () => {
  const symbol = isPlaying ? '❚❚' : '▶';
  const label = isPlaying ? 'Pause station' : 'Play station';
  if (playToggle) {
    playToggle.textContent = symbol;
    playToggle.setAttribute('aria-label', label);
  }
  getPlayButtons().forEach((button) => {
    button.textContent = isPlaying ? 'Pause Station' : 'Play Station';
  });
};

const updateTrackText = (title, artist) => {
  setText('#dock-track', title || STATION.name);
  setText('#dock-artist', artist || 'radio.djmixhub.com');
  setText('#np-title', title || STATION.name);
  setText('#np-artist', artist || 'radio.djmixhub.com');
  setText('#hero-track', title || 'Live stream');
};

const updateStatus = (status) => {
  const nice = status || 'Live';
  setText('#hero-live-status', nice);
  setText('#hero-mini-status', nice);
};

const renderRecentTracks = (tracks = []) => {
  const recentTracksList = document.querySelector('#recent-tracks-list');
  if (!recentTracksList) return;
  if (!tracks.length) {
    recentTracksList.innerHTML = '<li>Recent tracks will appear here when available.</li>';
    return;
  }
  recentTracksList.innerHTML = tracks.slice(0, 5).map((item) => {
    const song = item.song || {};
    const text = [song.title, song.artist].filter(Boolean).join(' — ');
    return `<li>${text || 'Unknown track'}</li>`;
  }).join('');
};

const pickArt = (payload) => {
  const candidates = [
    payload?.now_playing?.song?.art,
    payload?.now_playing?.song?.art_url,
    payload?.now_playing?.song?.album_art,
    payload?.song?.art,
    payload?.song?.art_url,
    payload?.station?.brand_image,
    STATION.fallbackArtUrl
  ];
  return candidates.find(Boolean) || STATION.fallbackArtUrl;
};

const extractStationData = (payload) => {
  if (!payload) return null;
  const station = payload.station || {};
  const nowPlaying = payload.now_playing || {};
  const song = nowPlaying.song || {};
  const live = payload.live || nowPlaying.is_live;
  const title = song.title || nowPlaying.song?.text || 'Live stream';
  const artist = song.artist || station.name || STATION.name;
  return {
    title,
    artist,
    streamUrl: station.listen_url || STATION.fallbackStreamUrl,
    isLive: live,
    recent: payload.song_history || [],
    artUrl: pickArt(payload)
  };
};

const updateFromPayload = (payload) => {
  const data = extractStationData(payload);
  if (!data) return;
  lastPayload = payload;
  currentStreamUrl = data.streamUrl || STATION.fallbackStreamUrl;
  if (audio && audio.src !== currentStreamUrl && !isPlaying) {
    audio.src = currentStreamUrl;
  }
  updateTrackText(data.title, data.artist);
  updateStatus(data.isLive ? 'Live now' : 'AutoDJ');
  renderRecentTracks(data.recent);
  setImage('#dock-art', data.artUrl, `${data.title} album art`);
  setImage('#np-art', data.artUrl, `${data.title} album art`);
};

const fetchJson = async (url) => {
  const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
};

const refreshStationData = async () => {
  try {
    const payload = await fetchJson(STATION.staticApiUrl);
    updateFromPayload(payload);
  } catch (staticError) {
    try {
      const payload = await fetchJson(STATION.liveApiUrl);
      updateFromPayload(payload);
    } catch (liveError) {
      updateTrackText(STATION.name, 'Metadata unavailable');
      updateStatus('Stream ready');
      renderRecentTracks([]);
      setImage('#dock-art', STATION.fallbackArtUrl, 'DJMixHub logo');
      setImage('#np-art', STATION.fallbackArtUrl, 'DJMixHub logo');
    }
  }
};

const togglePlayback = async () => {
  if (!audio) return;
  try {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      if (audio.src !== currentStreamUrl) audio.src = currentStreamUrl;
      await audio.play();
      isPlaying = true;
    }
  } catch (error) {
    window.open(STATION.publicPlayerUrl, '_blank', 'noopener');
  }
  setPlayButtonState();
};

const renderRoute = async (pathname, { pushState = false } = {}) => {
  const normalized = normalizePath(pathname);
  const route = routeForPath(normalized);
  const response = await fetch(route.partial, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${route.partial}`);
  appMain.innerHTML = await response.text();
  document.title = route.title;
  if (pushState) history.pushState({}, '', normalized);
  updateActiveNav(normalized);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  if (lastPayload) updateFromPayload(lastPayload);
  setPlayButtonState();
};

const showTermsIfNeeded = () => {
  if (!termsConsent) return;
  const accepted = localStorage.getItem(TERMS_KEY) === 'yes';
  termsConsent.hidden = accepted;
};

const shouldHandleInternalLink = (link) => {
  if (!link) return false;
  if (link.target && link.target !== '') return false;
  if (link.hasAttribute('download')) return false;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  const url = new URL(link.href, window.location.href);
  return url.origin === window.location.origin;
};

if (audio) {
  audio.src = currentStreamUrl;
  audio.volume = Number(localStorage.getItem(VOLUME_KEY) || 0.85);
}

if (volumeRange && audio) {
  volumeRange.value = audio.volume;
  volumeRange.addEventListener('input', (event) => {
    audio.volume = Number(event.target.value);
    localStorage.setItem(VOLUME_KEY, event.target.value);
  });
}

document.addEventListener('click', async (event) => {
  const acceptButton = event.target.closest('[data-accept-terms]');
  if (acceptButton) {
    localStorage.setItem(TERMS_KEY, 'yes');
    showTermsIfNeeded();
    return;
  }

  const playButton = event.target.closest('.js-play-toggle');
  if (playButton) {
    event.preventDefault();
    togglePlayback();
    return;
  }

  const link = event.target.closest('a');
  if (!shouldHandleInternalLink(link)) return;
  const destination = new URL(link.href, window.location.href);
  const normalized = normalizePath(destination.pathname);
  if (!ROUTES[normalized]) return;
  event.preventDefault();
  await renderRoute(normalized, { pushState: true });
});

window.addEventListener('popstate', () => {
  renderRoute(window.location.pathname).catch(() => {
    if (normalizePath(window.location.pathname) !== '/') window.location.href = '/';
  });
});

if (playToggle) playToggle.addEventListener('click', togglePlayback);

if (audio) {
  audio.addEventListener('ended', () => { isPlaying = false; setPlayButtonState(); });
  audio.addEventListener('pause', () => { isPlaying = false; setPlayButtonState(); });
  audio.addEventListener('play', () => { isPlaying = true; setPlayButtonState(); });
}

syncYear();
showTermsIfNeeded();
setPlayButtonState();
updateActiveNav();
renderRoute(window.location.pathname).catch(() => renderRoute('/'));
refreshStationData();
refreshTimer = setInterval(refreshStationData, 30000);
