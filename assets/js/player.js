const STATION = {
  name: 'DJMixHub Live',
  shortcode: 'djmixhub',
  publicPlayerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  liveApiUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  staticApiUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3',
  fallbackArtUrl: 'assets/img/logo.jpg'
};

const audio = document.getElementById('station-audio');
const playToggle = document.getElementById('play-toggle');
const volumeRange = document.getElementById('volume-range');
const yearEl = document.getElementById('year');
const termsConsent = document.getElementById('terms-consent');
const TERMS_KEY = 'djmixhub-terms-accepted';
const VOLUME_KEY = 'djmixhub-volume';

let isPlaying = false;
let currentStreamUrl = STATION.fallbackStreamUrl;

const getPlayButtons = () => Array.from(document.querySelectorAll('.js-play-toggle'));
const getNavLinks = () => Array.from(document.querySelectorAll('[data-nav-link]'));
const getSections = () => Array.from(document.querySelectorAll('[data-section]'));

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};

const setImage = (selector, src, alt = 'Current album art') => {
  const element = document.querySelector(selector);
  if (!element) return;
  element.src = src || STATION.fallbackArtUrl;
  element.alt = alt;
};

const syncYear = () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

const updateActiveNav = (sectionId) => {
  getNavLinks().forEach((link) => {
    link.classList.toggle('active', link.dataset.navLink === sectionId);
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

  recentTracksList.innerHTML = tracks
    .slice(0, 5)
    .map((item) => {
      const song = item.song || {};
      const text = [song.title, song.artist].filter(Boolean).join(' — ');
      return `<li>${text || 'Unknown track'}</li>`;
    })
    .join('');
};

const extractArtwork = (payload) => {
  const nowPlaying = payload?.now_playing || {};
  const song = nowPlaying.song || {};
  return (
    song.art ||
    song.art_url ||
    nowPlaying.art ||
    nowPlaying.art_url ||
    payload?.live?.art ||
    STATION.fallbackArtUrl
  );
};

const extractStationData = (payload) => {
  if (!payload) return null;

  const station = payload.station || {};
  const nowPlaying = payload.now_playing || {};
  const song = nowPlaying.song || {};

  const liveFlag = nowPlaying.is_live ?? payload.is_live ?? false;
  const title = song.title || song.text || nowPlaying.song?.text || 'Live stream';
  const artist = song.artist || station.name || STATION.name;
  const streamUrl = station.listen_url || STATION.fallbackStreamUrl;
  const artUrl = extractArtwork(payload);

  return {
    title,
    artist,
    streamUrl,
    artUrl,
    isLive: liveFlag,
    recent: payload.song_history || []
  };
};

const updateFromPayload = (payload) => {
  const data = extractStationData(payload);
  if (!data) return;

  currentStreamUrl = data.streamUrl || STATION.fallbackStreamUrl;

  if (audio && !audio.src) {
    audio.src = currentStreamUrl;
  }

  updateTrackText(data.title, data.artist);
  updateStatus(data.isLive ? 'Live now' : 'AutoDJ');
  renderRecentTracks(data.recent);
  setImage('#player-art', data.artUrl, `${data.title} album art`);
  setImage('#hero-art', data.artUrl, `${data.title} album art`);
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
      setImage('#player-art', STATION.fallbackArtUrl, 'DJMixHub logo');
      setImage('#hero-art', STATION.fallbackArtUrl, 'DJMixHub logo');
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
      if (!audio.src || audio.src !== currentStreamUrl) {
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

const showTermsIfNeeded = () => {
  if (!termsConsent) return;
  const accepted = localStorage.getItem(TERMS_KEY) === 'yes';
  termsConsent.hidden = accepted;
};

const observeSections = () => {
  const sections = getSections();
  if (!sections.length || !('IntersectionObserver' in window)) {
    const first = sections[0];
    if (first) updateActiveNav(first.dataset.section);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const sectionId = visible.target.dataset.section;
    updateActiveNav(sectionId);
  }, {
    rootMargin: '-25% 0px -55% 0px',
    threshold: [0.15, 0.4, 0.65]
  });

  sections.forEach((section) => observer.observe(section));
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
  }
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

syncYear();
showTermsIfNeeded();
setPlayButtonState();
observeSections();
refreshStationData();
setInterval(refreshStationData, 30000);
