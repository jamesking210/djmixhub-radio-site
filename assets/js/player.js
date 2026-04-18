const STATION = {
  name: 'DJMixHub Live',
  shortcode: 'djmixhub',
  publicPlayerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  liveApiUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  staticApiUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3',
  fallbackArtwork: 'assets/img/logo.jpg',
  baseUrl: 'https://radio.djmixhub.com'
};

const ROUTES = {
  home: { title: 'DJMixHub.com | Live internet radio' },
  about: { title: 'About | DJMixHub.com' },
  djs: { title: 'DJ Bios | DJMixHub.com' },
  terms: { title: 'Terms & Conditions | DJMixHub.com' }
};

const TERMS_KEY = 'djmixhub-terms-accepted';
const VOLUME_KEY = 'djmixhub-volume';

const audio = document.getElementById('station-audio');
const playToggle = document.getElementById('play-toggle');
const volumeRange = document.getElementById('volume-range');
const yearEl = document.getElementById('year');
const termsConsent = document.getElementById('terms-consent');
const sections = Array.from(document.querySelectorAll('[data-route-section]'));

let isPlaying = false;
let currentStreamUrl = STATION.fallbackStreamUrl;
let currentArtworkUrl = STATION.fallbackArtwork;
let lastPayload = null;

const setText = (selector, value) => {
  const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (element) element.textContent = value;
};

const syncYear = () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

const getRouteFromHash = () => {
  const hash = window.location.hash.replace('#', '').trim().toLowerCase();
  if (hash && ROUTES[hash]) return hash;
  return 'home';
};

const setRoute = (route) => {
  const activeRoute = ROUTES[route] ? route : 'home';

  sections.forEach((section) => {
    section.classList.toggle('active', section.dataset.routeSection === activeRoute);
  });

  document.querySelectorAll('[data-route]').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === activeRoute);
  });

  document.title = ROUTES[activeRoute].title;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const showTermsIfNeeded = () => {
  if (!termsConsent) return;
  const accepted = localStorage.getItem(TERMS_KEY) === 'yes';
  termsConsent.hidden = accepted;
};

const getPlayButtons = () => Array.from(document.querySelectorAll('.js-play-toggle'));

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

  recentTracksList.innerHTML = tracks
    .slice(0, 5)
    .map((item) => {
      const song = item.song || {};
      const text = [song.title, song.artist].filter(Boolean).join(' — ');
      return `<li>${text || 'Unknown track'}</li>`;
    })
    .join('');
};

const absolutizeUrl = (value) => {
  if (!value) return '';
  try {
    return new URL(value, STATION.baseUrl).href;
  } catch (error) {
    return value;
  }
};

const getArtworkFromPayload = (payload) => {
  const song = payload?.now_playing?.song || {};
  const station = payload?.station || {};
  const candidates = [
    song.art,
    song.art_url,
    payload?.now_playing?.song?.art,
    payload?.now_playing?.song?.art_url,
    payload?.now_playing?.song?.album_art,
    payload?.live?.art,
    station.art,
    station.art_url,
    station.logo,
    STATION.fallbackArtwork
  ].filter(Boolean);

  const first = candidates.find(Boolean) || STATION.fallbackArtwork;
  return absolutizeUrl(first);
};

const setArtwork = (artUrl) => {
  currentArtworkUrl = artUrl || STATION.fallbackArtwork;

  const playerArt = document.getElementById('player-art');
  const heroArt = document.getElementById('hero-art');

  [playerArt, heroArt].forEach((img) => {
    if (img) img.src = currentArtworkUrl;
  });
};

const updateMediaSession = (title, artist, artUrl) => {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || STATION.name,
      artist: artist || 'DJMixHub',
      album: STATION.name,
      artwork: [
        { src: artUrl || STATION.fallbackArtwork, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  } catch (error) {
    // Ignore unsupported metadata formats.
  }
};

const extractStationData = (payload) => {
  if (!payload) return null;

  const station = payload.station || {};
  const nowPlaying = payload.now_playing || {};
  const song = nowPlaying.song || {};
  const live = payload.live || nowPlaying.is_live;
  const title = song.title || song.text || 'Live stream';
  const artist = song.artist || station.name || STATION.name;

  return {
    title,
    artist,
    streamUrl: station.listen_url || payload?.listeners?.stream_url || STATION.fallbackStreamUrl,
    isLive: live,
    recent: payload.song_history || [],
    artUrl: getArtworkFromPayload(payload)
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
  setArtwork(data.artUrl);
  updateMediaSession(data.title, data.artist, data.artUrl);
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

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
      setArtwork(STATION.fallbackArtwork);
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
      if (audio.src !== currentStreamUrl) {
        audio.src = currentStreamUrl;
      }
      await audio.play();
      isPlaying = true;
    }
  } catch (error) {
    window.open(STATION.publicPlayerUrl, '_blank', 'noopener');
  }

  setPlayButtonState();
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

document.addEventListener('click', (event) => {
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

  const routeLink = event.target.closest('[data-route]');
  if (routeLink) {
    event.preventDefault();
    const route = routeLink.dataset.route || 'home';
    window.location.hash = route;
  }
});

window.addEventListener('hashchange', () => {
  setRoute(getRouteFromHash());
});

if (playToggle) {
  playToggle.addEventListener('click', togglePlayback);
}

if (audio) {
  audio.addEventListener('ended', () => {
    isPlaying = false;
    setPlayButtonState();
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    setPlayButtonState();
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    setPlayButtonState();
  });
}

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => {
    if (!isPlaying) togglePlayback();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    if (isPlaying) togglePlayback();
  });
}

syncYear();
setRoute(getRouteFromHash());
showTermsIfNeeded();
setPlayButtonState();
refreshStationData();
setInterval(refreshStationData, 30000);
