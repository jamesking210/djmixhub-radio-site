const DEFAULT_CONFIG = {
  siteUrl: 'https://djmixhub.com',
  siteName: 'DJMixHub',
  siteTagline: 'Open Source Energy. Community Sourced Mixes.',
  radioBaseUrl: 'https://radio.djmixhub.com',
  stationShortcode: 'djmixhub',
  stationName: 'DJMixHub',
  nowPlayingUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  streamUrl: '',
  hlsUrl: '',
  mainRepoUrl: 'https://github.com/jamesking210/djmixhub-radio-site',
  azuracastRepoUrl: 'https://github.com/AzuraCast/AzuraCast',
  githubUrl: 'https://github.com/jamesking210',
  contactEmail: 'djmixhubradio@gmail.com',
  termsKey: 'djmixhub_hls_terms_accepted_v1',
  fallbackArtwork: 'assets/logo.jpg',
  pollIntervalMs: 15000
};

function normalizeString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function buildUrl(baseUrl, path) {
  const normalizedBaseUrl = trimTrailingSlash(normalizeString(baseUrl));
  return normalizedBaseUrl ? `${normalizedBaseUrl}${path}` : '';
}

function buildConfig() {
  const runtimeConfig = window.DJMIXHUB_EMBED_CONFIG || {};
  const radioBaseUrl = trimTrailingSlash(normalizeString(runtimeConfig.radioBaseUrl, DEFAULT_CONFIG.radioBaseUrl));
  const stationShortcode = normalizeString(runtimeConfig.stationShortcode, DEFAULT_CONFIG.stationShortcode);
  const siteName = normalizeString(runtimeConfig.siteName, DEFAULT_CONFIG.siteName);
  const stationName = normalizeString(runtimeConfig.stationName, siteName);

  return {
    ...DEFAULT_CONFIG,
    siteName,
    siteTagline: normalizeString(runtimeConfig.siteTagline, DEFAULT_CONFIG.siteTagline),
    siteUrl: normalizeString(runtimeConfig.siteUrl, DEFAULT_CONFIG.siteUrl),
    radioBaseUrl,
    stationShortcode,
    stationName,
    nowPlayingUrl: normalizeString(runtimeConfig.nowPlayingUrl) || buildUrl(radioBaseUrl, `/api/nowplaying/${stationShortcode}`),
    streamUrl: normalizeString(runtimeConfig.streamUrl) || buildUrl(radioBaseUrl, `/listen/${stationShortcode}/radio.mp3`),
    hlsUrl: normalizeString(runtimeConfig.hlsUrl),
    mainRepoUrl: normalizeString(runtimeConfig.mainRepoUrl, DEFAULT_CONFIG.mainRepoUrl),
    azuracastRepoUrl: normalizeString(runtimeConfig.azuracastRepoUrl, DEFAULT_CONFIG.azuracastRepoUrl),
    githubUrl: normalizeString(runtimeConfig.githubUrl, DEFAULT_CONFIG.githubUrl),
    contactEmail: normalizeString(runtimeConfig.contactEmail, DEFAULT_CONFIG.contactEmail)
  };
}

const CONFIG = buildConfig();

const state = {
  acceptedTerms: false,
  isPlaying: false,
  volume: 1,
  pollTimer: null,
  progressTimer: null,
  reconnectTimer: null,
  currentHlsUrl: CONFIG.hlsUrl,
  currentStreamUrl: CONFIG.streamUrl,
  trackStartedAt: null,
  trackElapsedSeconds: 0,
  trackDurationSeconds: 0,
  hls: null,
  playbackMode: null
};

const elements = {
  acceptTermsButton: document.getElementById('acceptTermsButton'),
  termsGate: document.getElementById('termsGate'),
  radioPlayer: document.getElementById('radioPlayer'),
  volumeSlider: document.getElementById('volumeSlider'),
  heroListenButton: document.getElementById('heroListenButton'),
  dockPlayButton: document.getElementById('dockPlayButton'),
  headerUniqueListeners: document.getElementById('headerUniqueListeners'),
  statusBadge: document.getElementById('statusBadge'),
  heroListeners: document.getElementById('heroListeners'),
  onAirArt: document.getElementById('onAirArt'),
  onAirTitle: document.getElementById('onAirTitle'),
  onAirArtist: document.getElementById('onAirArtist'),
  nextTitle: document.getElementById('nextTitle'),
  nextMeta: document.getElementById('nextMeta'),
  historyTitle: document.getElementById('historyTitle'),
  historyMeta: document.getElementById('historyMeta'),
  dockArt: document.getElementById('dockArt'),
  dockListeners: document.getElementById('dockListeners'),
  dockTitle: document.getElementById('dockTitle'),
  dockArtist: document.getElementById('dockArtist'),
  progress: document.getElementById('trackProgress'),
  progressElapsed: document.getElementById('trackElapsed'),
  progressDuration: document.getElementById('trackDuration'),
  stationName: document.querySelectorAll('[data-config-text="siteName"]'),
  stationTagline: document.querySelectorAll('[data-config-text="siteTagline"]'),
  email: document.querySelectorAll('[data-config-email]'),
  mainRepoLinks: document.querySelectorAll('[data-config-href="mainRepoUrl"]'),
  azuracastRepoLinks: document.querySelectorAll('[data-config-href="azuracastRepoUrl"]'),
  githubLinks: document.querySelectorAll('[data-config-href="githubUrl"]'),
  radioBaseLinks: document.querySelectorAll('[data-config-href="radioBaseUrl"]'),
  djGrid: document.getElementById('djGrid')
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDuration(totalSeconds) {
  const normalizedSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function normalizePossibleUrl(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (value.startsWith('/')) {
    return `${CONFIG.radioBaseUrl}${value}`;
  }

  return value;
}

function applyConfig() {
  document.title = `${CONFIG.siteName} | HLS Listener Site`;

  elements.stationName.forEach((node) => {
    node.textContent = CONFIG.siteName;
  });

  elements.stationTagline.forEach((node) => {
    node.textContent = CONFIG.siteTagline;
  });

  elements.email.forEach((node) => {
    node.textContent = node.textContent || CONFIG.contactEmail;
    node.href = `mailto:${CONFIG.contactEmail}`;
  });

  [
    [elements.mainRepoLinks, CONFIG.mainRepoUrl],
    [elements.azuracastRepoLinks, CONFIG.azuracastRepoUrl],
    [elements.githubLinks, CONFIG.githubUrl],
    [elements.radioBaseLinks, CONFIG.radioBaseUrl]
  ].forEach(([nodes, href]) => {
    if (!href) {
      return;
    }

    nodes.forEach((node) => {
      node.href = href;
      node.hidden = false;
    });
  });
}

function renderDjs() {
  const djs = Array.isArray(window.DJMIXHUB_EMBED_DJS) ? window.DJMIXHUB_EMBED_DJS : [];

  if (!elements.djGrid || !djs.length) {
    return;
  }

  elements.djGrid.innerHTML = djs.map((dj) => {
    const link = dj.linkUrl
      ? `<a href="${escapeHtml(dj.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(dj.linkLabel || dj.linkUrl)}</a>`
      : `<a href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(dj.emailSubject || 'DJMixHub DJ Submission')}">${escapeHtml(dj.linkLabel || CONFIG.contactEmail)}</a>`;

    return `
      <article class="card dj-card">
        <div class="dj-card__media">
          <img
            src="${escapeHtml(dj.image || CONFIG.fallbackArtwork)}"
            alt="${escapeHtml(dj.name || CONFIG.siteName)}"
            onerror="this.onerror=null;this.src='${CONFIG.fallbackArtwork}';"
          />
        </div>
        <span class="dj-card__tag">${escapeHtml(dj.tag || 'DJ')}</span>
        <h3>${escapeHtml(dj.name || 'DJ')}</h3>
        <p>${escapeHtml(dj.bio || '')}</p>
        ${link}
      </article>
    `;
  }).join('');
}

function showTermsGate() {
  elements.termsGate?.classList.add('is-visible');
  elements.termsGate?.setAttribute('aria-hidden', 'false');
}

function hideTermsGate() {
  elements.termsGate?.classList.remove('is-visible');
  elements.termsGate?.setAttribute('aria-hidden', 'true');
}

function readTermsState() {
  state.acceptedTerms = localStorage.getItem(CONFIG.termsKey) === 'true';
  if (state.acceptedTerms) {
    hideTermsGate();
  }
}

function acceptTerms() {
  localStorage.setItem(CONFIG.termsKey, 'true');
  state.acceptedTerms = true;
  hideTermsGate();
}

function readVolumeState() {
  state.volume = 1;

  if (elements.volumeSlider) {
    elements.volumeSlider.value = String(state.volume);
  }

  if (elements.radioPlayer) {
    elements.radioPlayer.volume = state.volume;
  }
}

function setPlayerVolume(rawValue) {
  const volume = Number(rawValue);
  if (Number.isNaN(volume)) {
    return;
  }

  state.volume = Math.min(1, Math.max(0, volume));
  elements.radioPlayer.volume = state.volume;
}

function destroyHlsInstance() {
  if (state.hls) {
    state.hls.destroy();
    state.hls = null;
  }
}

function teardownPlayerSource() {
  destroyHlsInstance();
  elements.radioPlayer.pause();
  elements.radioPlayer.removeAttribute('src');
  elements.radioPlayer.load();
}

function clearReconnectTimer() {
  window.clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
}

function setPlaybackUi() {
  if (!elements.dockPlayButton) {
    return;
  }

  elements.dockPlayButton.textContent = state.isPlaying ? 'Stop' : 'Play';
  elements.dockPlayButton.setAttribute('aria-label', state.isPlaying ? 'Stop station' : 'Play station');
}

function stopTrackProgressTimer() {
  window.clearInterval(state.progressTimer);
  state.progressTimer = null;
}

function renderProgress() {
  const duration = Math.max(0, state.trackDurationSeconds);
  const elapsed = Math.min(Math.max(0, state.trackElapsedSeconds), duration || state.trackElapsedSeconds);
  const max = duration > 0 ? duration : 1;

  if (elements.progress) {
    elements.progress.max = max;
    elements.progress.value = Math.min(elapsed, max);
  }

  if (elements.progressElapsed) {
    elements.progressElapsed.textContent = formatDuration(elapsed);
  }

  if (elements.progressDuration) {
    elements.progressDuration.textContent = formatDuration(duration);
  }
}

function startTrackProgressTimer() {
  stopTrackProgressTimer();

  if (!state.trackStartedAt || !state.trackDurationSeconds) {
    return;
  }

  state.progressTimer = window.setInterval(() => {
    const elapsedFromClock = Math.floor((Date.now() - state.trackStartedAt) / 1000);
    state.trackElapsedSeconds = Math.min(elapsedFromClock, state.trackDurationSeconds);
    renderProgress();
  }, 1000);
}

function setTrackProgress(elapsedSeconds, durationSeconds) {
  const safeDuration = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  const safeElapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
  state.trackDurationSeconds = safeDuration;
  state.trackElapsedSeconds = safeDuration > 0 ? Math.min(safeElapsed, safeDuration) : safeElapsed;
  state.trackStartedAt = Date.now() - (state.trackElapsedSeconds * 1000);
  renderProgress();
  startTrackProgressTimer();
}

function getStatusText(nowPlaying) {
  const isLive = Boolean(nowPlaying?.live?.is_live);
  const streamerName = nowPlaying?.live?.streamer_name?.trim();

  if (isLive) {
    return streamerName ? `${streamerName} live` : 'Live DJ';
  }

  if (nowPlaying?.is_online) {
    return `${CONFIG.stationName} on air`;
  }

  return 'Offline';
}

function updateArtwork(art, altText) {
  [elements.onAirArt, elements.dockArt].forEach((node) => {
    if (node) {
      node.src = art;
      node.alt = altText;
    }
  });
}

function updateNowPlaying(nowPlaying) {
  const song = nowPlaying?.now_playing?.song ?? {};
  const nextSong = nowPlaying?.playing_next?.song ?? {};
  const historySong = Array.isArray(nowPlaying?.song_history) ? nowPlaying.song_history[0]?.song ?? {} : {};
  const totalListeners = nowPlaying?.listeners?.total ?? nowPlaying?.listeners?.current ?? 0;
  const uniqueListeners = nowPlaying?.listeners?.unique ?? totalListeners;
  const statusText = getStatusText(nowPlaying);
  const art = normalizePossibleUrl(song.art || nowPlaying?.live?.art) || CONFIG.fallbackArtwork;
  const title = song.title || `${CONFIG.stationName} radio`;
  const artist = song.artist || 'Always-on mix radio';
  const hlsUrl = normalizePossibleUrl(nowPlaying?.station?.hls_url);
  const listenUrl = normalizePossibleUrl(nowPlaying?.station?.listen_url);

  updateArtwork(art, `${title} artwork`);

  [elements.onAirTitle, elements.dockTitle].forEach((node) => {
    if (node) {
      node.textContent = title;
    }
  });

  [elements.onAirArtist, elements.dockArtist].forEach((node) => {
    if (node) {
      node.textContent = artist;
    }
  });

  if (elements.heroListeners) {
    elements.heroListeners.textContent = totalListeners;
  }

  if (elements.dockListeners) {
    elements.dockListeners.textContent = totalListeners;
  }

  if (elements.headerUniqueListeners) {
    elements.headerUniqueListeners.textContent = uniqueListeners;
  }

  if (elements.statusBadge) {
    elements.statusBadge.textContent = statusText;
  }

  if (elements.nextTitle) {
    elements.nextTitle.textContent = nextSong.title || 'Station rotation';
  }

  if (elements.nextMeta) {
    elements.nextMeta.textContent = nextSong.artist || 'More mixes are queued up next.';
  }

  if (elements.historyTitle) {
    elements.historyTitle.textContent = historySong.title || 'Recent set history';
  }

  if (elements.historyMeta) {
    elements.historyMeta.textContent = historySong.artist || 'Recent plays will show here when available.';
  }

  state.currentHlsUrl = hlsUrl || state.currentHlsUrl || CONFIG.hlsUrl;
  state.currentStreamUrl = listenUrl || state.currentStreamUrl || CONFIG.streamUrl;
  setTrackProgress(nowPlaying?.now_playing?.elapsed ?? 0, nowPlaying?.now_playing?.duration ?? 0);
}

function appendCacheBust(url) {
  return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

function waitForPlayable(timeoutMs = 4500) {
  return new Promise((resolve, reject) => {
    let finished = false;

    function cleanup() {
      elements.radioPlayer.removeEventListener('playing', onPlaying);
      elements.radioPlayer.removeEventListener('canplay', onCanPlay);
      elements.radioPlayer.removeEventListener('error', onError);
      window.clearTimeout(timeoutId);
    }

    function finish(handler, value) {
      if (finished) {
        return;
      }

      finished = true;
      cleanup();
      handler(value);
    }

    function onPlaying() {
      finish(resolve);
    }

    function onCanPlay() {
      finish(resolve);
    }

    function onError() {
      const mediaError = elements.radioPlayer.error;
      finish(reject, new Error(mediaError?.message || 'Audio element error'));
    }

    const timeoutId = window.setTimeout(() => {
      finish(reject, new Error('Playable stream timed out'));
    }, timeoutMs);

    elements.radioPlayer.addEventListener('playing', onPlaying);
    elements.radioPlayer.addEventListener('canplay', onCanPlay);
    elements.radioPlayer.addEventListener('error', onError);
  });
}

async function attachNativeHls(url) {
  elements.radioPlayer.src = url;
  elements.radioPlayer.load();
  const playPromise = elements.radioPlayer.play();
  await Promise.all([playPromise, waitForPlayable()]);
}

function attachHlsJs(url) {
  return new Promise((resolve, reject) => {
    if (typeof window.Hls === 'undefined' || !window.Hls.isSupported()) {
      reject(new Error('HLS.js not supported'));
      return;
    }

    destroyHlsInstance();

    const hls = new window.Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30
    });

    state.hls = hls;
    hls.loadSource(url);
    hls.attachMedia(elements.radioPlayer);

    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      elements.radioPlayer.play()
        .then(() => waitForPlayable())
        .then(resolve)
        .catch(reject);
    });

    hls.on(window.Hls.Events.ERROR, (_event, data) => {
      if (!data?.fatal) {
        return;
      }

      reject(new Error(`Fatal HLS error: ${data.type || 'unknown'}`));
    });
  });
}

async function attachMp3Stream(url) {
  elements.radioPlayer.src = url;
  elements.radioPlayer.load();
  const playPromise = elements.radioPlayer.play();
  await Promise.all([playPromise, waitForPlayable()]);
}

async function tryStartStream(mode) {
  if (mode === 'hls-native') {
    await attachNativeHls(appendCacheBust(state.currentHlsUrl));
    return;
  }

  if (mode === 'hls-js') {
    await attachHlsJs(appendCacheBust(state.currentHlsUrl));
    return;
  }

  if (mode === 'mp3') {
    await attachMp3Stream(appendCacheBust(state.currentStreamUrl));
    return;
  }

  throw new Error(`Unknown playback mode: ${mode}`);
}

function buildPlaybackModes() {
  const modes = [];
  const hasHls = Boolean(state.currentHlsUrl);
  const hasMp3 = Boolean(state.currentStreamUrl);

  if (hasHls && elements.radioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    modes.push('hls-native');
  }

  if (hasHls && typeof window.Hls !== 'undefined' && window.Hls.isSupported()) {
    modes.push('hls-js');
  }

  if (hasMp3) {
    modes.push('mp3');
  }

  return [...new Set(modes)];
}

async function playStream(preferredMode = null) {
  if (!state.acceptedTerms) {
    showTermsGate();
    return;
  }

  clearReconnectTimer();
  teardownPlayerSource();
  elements.radioPlayer.volume = state.volume;

  const fallbackModes = buildPlaybackModes();
  const modes = preferredMode
    ? [preferredMode, ...fallbackModes.filter((mode) => mode !== preferredMode)]
    : fallbackModes;

  if (!modes.length) {
    console.error('No playable stream URL available');
    state.isPlaying = false;
    state.playbackMode = null;
    setPlaybackUi();
    return;
  }

  for (const mode of modes) {
    try {
      await tryStartStream(mode);
      state.isPlaying = true;
      state.playbackMode = mode;
      setPlaybackUi();
      return;
    } catch (error) {
      console.error(`Unable to start ${mode} playback:`, error);
      teardownPlayerSource();
    }
  }

  state.isPlaying = false;
  state.playbackMode = null;
  setPlaybackUi();
}

function stopStream() {
  clearReconnectTimer();
  teardownPlayerSource();
  state.isPlaying = false;
  state.playbackMode = null;
  setPlaybackUi();
}

function scheduleReconnect() {
  if (!state.isPlaying) {
    return;
  }

  clearReconnectTimer();
  state.reconnectTimer = window.setTimeout(async () => {
    if (!state.isPlaying) {
      return;
    }
    await playStream(state.playbackMode === 'mp3' ? 'mp3' : null);
  }, 1500);
}

async function togglePlayback() {
  if (state.isPlaying) {
    stopStream();
  } else {
    await playStream();
  }
}

async function fetchNowPlaying() {
  try {
    const response = await fetch(`${CONFIG.nowPlayingUrl}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const nowPlaying = await response.json();
    updateNowPlaying(nowPlaying);
  } catch (error) {
    console.error('Could not load station data:', error);
  } finally {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = window.setTimeout(fetchNowPlaying, CONFIG.pollIntervalMs);
  }
}

function init() {
  applyConfig();
  renderDjs();
  readTermsState();
  readVolumeState();
  renderProgress();
  fetchNowPlaying();
  setPlaybackUi();

  elements.acceptTermsButton?.addEventListener('click', acceptTerms);
  elements.heroListenButton?.addEventListener('click', playStream);
  elements.dockPlayButton?.addEventListener('click', togglePlayback);
  elements.volumeSlider?.addEventListener('input', (event) => {
    setPlayerVolume(event.target.value);
  });

  elements.radioPlayer?.addEventListener('play', () => {
    state.isPlaying = true;
    setPlaybackUi();
  });

  elements.radioPlayer?.addEventListener('pause', () => {
    if (!elements.radioPlayer.src) {
      state.isPlaying = false;
      setPlaybackUi();
    }
  });

  elements.radioPlayer?.addEventListener('stalled', scheduleReconnect);
  elements.radioPlayer?.addEventListener('ended', scheduleReconnect);
  elements.radioPlayer?.addEventListener('error', scheduleReconnect);

  [elements.onAirArt, elements.dockArt].forEach((node) => {
    node?.addEventListener('error', () => {
      node.src = CONFIG.fallbackArtwork;
    });
  });
}

init();
