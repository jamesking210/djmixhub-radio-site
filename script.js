const CONFIG = {
  termsKey: 'djmixhub_terms_accepted_v1',
  nowPlayingUrl: '/azuracast/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3',
  fallbackArtwork: 'assets/logo.svg',
  pollIntervalMs: 15000
};

const state = {
  acceptedTerms: false,
  isPlaying: false,
  currentStreamUrl: CONFIG.fallbackStreamUrl,
  pollTimer: null
};

const elements = {
  radioPlayer: document.getElementById('radioPlayer'),
  playPauseButton: document.getElementById('playPauseButton'),
  playPauseLabel: document.getElementById('playPauseLabel'),
  playerAgreeButton: document.getElementById('playerAgreeButton'),
  acceptTermsButton: document.getElementById('acceptTermsButton'),
  termsGate: document.getElementById('termsGate'),
  heroListenButton: document.getElementById('heroListenButton'),
  playerArt: document.getElementById('playerArt'),
  playerStatus: document.getElementById('playerStatus'),
  playerListeners: document.getElementById('playerListeners'),
  playerTitle: document.getElementById('playerTitle'),
  playerArtist: document.getElementById('playerArtist'),
  heroStatus: document.getElementById('heroStatus'),
  heroTrack: document.getElementById('heroTrack'),
  heroArtist: document.getElementById('heroArtist'),
  heroListeners: document.getElementById('heroListeners'),
  heroMode: document.getElementById('heroMode'),
  scheduleStatus: document.getElementById('scheduleStatus'),
  scheduleListeners: document.getElementById('scheduleListeners'),
  scheduleNowTitle: document.getElementById('scheduleNowTitle'),
  scheduleNowMeta: document.getElementById('scheduleNowMeta'),
  scheduleNextTitle: document.getElementById('scheduleNextTitle'),
  scheduleNextMeta: document.getElementById('scheduleNextMeta'),
  recentTracks: document.getElementById('recentTracks')
};

function readTermsState() {
  state.acceptedTerms = localStorage.getItem(CONFIG.termsKey) === 'true';
  applyTermsState();
}

function applyTermsState() {
  elements.playPauseButton.disabled = !state.acceptedTerms;
  elements.playerAgreeButton.style.display = state.acceptedTerms ? 'none' : 'inline-flex';
  elements.termsGate.classList.toggle('is-visible', !state.acceptedTerms);
  elements.termsGate.setAttribute('aria-hidden', state.acceptedTerms ? 'true' : 'false');
}

function acceptTerms() {
  localStorage.setItem(CONFIG.termsKey, 'true');
  state.acceptedTerms = true;
  applyTermsState();
}

function setPlayButtonLabel() {
  elements.playPauseLabel.textContent = state.isPlaying ? 'Pause' : 'Play';
  elements.playPauseButton.setAttribute('aria-label', state.isPlaying ? 'Pause station' : 'Play station');
}

async function togglePlayback() {
  if (!state.acceptedTerms) {
    elements.termsGate.classList.add('is-visible');
    return;
  }

  if (!elements.radioPlayer.src) {
    elements.radioPlayer.src = state.currentStreamUrl;
  }

  if (state.isPlaying) {
    elements.radioPlayer.pause();
    state.isPlaying = false;
    setPlayButtonLabel();
    return;
  }

  try {
    await elements.radioPlayer.play();
    state.isPlaying = true;
  } catch (error) {
    console.error('Unable to start playback:', error);
    state.isPlaying = false;
  }

  setPlayButtonLabel();
}

function updateNowPlayingUi(np) {
  const nowSong = np?.now_playing?.song ?? {};
  const listeners = np?.listeners?.total ?? np?.listeners?.current ?? 0;
  const isLive = Boolean(np?.live?.is_live);
  const streamerName = np?.live?.streamer_name?.trim();
  const statusText = isLive
    ? `Live${streamerName ? ` with ${streamerName}` : ''}`
    : np?.is_online
      ? 'AutoDJ on air'
      : 'Station offline';

  const title = nowSong.title || 'DJMixHub radio';
  const artist = nowSong.artist || (isLive && streamerName ? streamerName : 'Always free internet radio');
  const art = nowSong.art || np?.live?.art || CONFIG.fallbackArtwork;

  elements.playerArt.src = art;
  elements.playerArt.alt = `${title} artwork`;
  elements.playerStatus.textContent = statusText;
  elements.playerListeners.textContent = listeners;
  elements.playerTitle.textContent = title;
  elements.playerArtist.textContent = artist;

  elements.heroStatus.textContent = statusText;
  elements.heroTrack.textContent = title;
  elements.heroArtist.textContent = artist;
  elements.heroListeners.textContent = listeners;
  elements.heroMode.textContent = isLive ? 'Live DJ' : (np?.is_online ? 'AutoDJ' : 'Offline');

  elements.scheduleStatus.textContent = statusText;
  elements.scheduleListeners.textContent = listeners;
  elements.scheduleNowTitle.textContent = title;
  elements.scheduleNowMeta.textContent = isLive
    ? streamerName
      ? `Live with ${streamerName}`
      : 'Live broadcast is active right now.'
    : 'Station rotation is currently active.';

  const playingNext = np?.playing_next?.song;
  if (playingNext?.title || playingNext?.artist) {
    elements.scheduleNextTitle.textContent = playingNext.title || 'Coming up next';
    elements.scheduleNextMeta.textContent = playingNext.artist || 'Upcoming track from the current station flow.';
  } else {
    elements.scheduleNextTitle.textContent = 'Curated station rotation';
    elements.scheduleNextMeta.textContent = 'A fuller show schedule can be plugged in here later.';
  }

  const history = Array.isArray(np?.song_history) ? np.song_history.slice(0, 4) : [];
  if (!history.length) {
    elements.recentTracks.innerHTML = '<li>Recent track history will show here when available.</li>';
  } else {
    elements.recentTracks.innerHTML = history
      .map((item) => {
        const song = item.song || {};
        const titleText = song.title || 'Unknown track';
        const artistText = song.artist || 'Unknown artist';
        return `<li><strong>${escapeHtml(titleText)}</strong> <span>— ${escapeHtml(artistText)}</span></li>`;
      })
      .join('');
  }

  const listenUrl = np?.station?.listen_url;
  if (listenUrl) {
    state.currentStreamUrl = listenUrl;
    if (!state.isPlaying && !elements.radioPlayer.src) {
      elements.radioPlayer.src = listenUrl;
    }
  }
}

async function fetchNowPlaying() {
  try {
    const response = await fetch(`${CONFIG.nowPlayingUrl}?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const nowPlaying = await response.json();
    updateNowPlayingUi(nowPlaying);
  } catch (error) {
    console.error('Could not load now playing data:', error);
    elements.playerStatus.textContent = 'Station info unavailable';
    elements.heroStatus.textContent = 'Could not reach station feed';
    elements.scheduleStatus.textContent = 'Feed temporarily unavailable';
  } finally {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = window.setTimeout(fetchNowPlaying, CONFIG.pollIntervalMs);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function init() {
  readTermsState();
  setPlayButtonLabel();
  fetchNowPlaying();

  elements.acceptTermsButton?.addEventListener('click', acceptTerms);
  elements.playerAgreeButton?.addEventListener('click', () => {
    elements.termsGate.classList.add('is-visible');
  });
  elements.playPauseButton?.addEventListener('click', togglePlayback);
  elements.heroListenButton?.addEventListener('click', async () => {
    if (!state.acceptedTerms) {
      elements.termsGate.classList.add('is-visible');
      return;
    }

    await togglePlayback();
    document.getElementById('bottomPlayer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  elements.radioPlayer?.addEventListener('pause', () => {
    state.isPlaying = false;
    setPlayButtonLabel();
  });

  elements.radioPlayer?.addEventListener('play', () => {
    state.isPlaying = true;
    setPlayButtonLabel();
  });
}

init();
