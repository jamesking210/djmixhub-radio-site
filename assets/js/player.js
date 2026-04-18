const STATION = {
  name: 'DJMixHub Live',
  shortcode: 'djmixhub',
  publicPlayerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  liveApiUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  staticApiUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3'
};

const audio = document.getElementById('station-audio');
const playToggle = document.getElementById('play-toggle');
const playButtons = document.querySelectorAll('.js-play-toggle');
const volumeRange = document.getElementById('volume-range');
const dockTrack = document.getElementById('dock-track');
const dockArtist = document.getElementById('dock-artist');
const npTitle = document.getElementById('np-title');
const npArtist = document.getElementById('np-artist');
const heroTrack = document.getElementById('hero-track');
const heroLiveStatus = document.getElementById('hero-live-status');
const heroMiniStatus = document.getElementById('hero-mini-status');
const recentTracksList = document.getElementById('recent-tracks-list');
const yearEl = document.getElementById('year');

let isPlaying = false;
let currentStreamUrl = STATION.fallbackStreamUrl;

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (audio) {
  audio.src = currentStreamUrl;
  audio.volume = Number(localStorage.getItem('djmixhub-volume') || 0.85);
}

if (volumeRange && audio) {
  volumeRange.value = audio.volume;
  volumeRange.addEventListener('input', (event) => {
    audio.volume = Number(event.target.value);
    localStorage.setItem('djmixhub-volume', event.target.value);
  });
}

const setPlayButtonState = () => {
  const symbol = isPlaying ? '❚❚' : '▶';
  const label = isPlaying ? 'Pause station' : 'Play station';
  if (playToggle) {
    playToggle.textContent = symbol;
    playToggle.setAttribute('aria-label', label);
  }
  playButtons.forEach((button) => {
    button.textContent = isPlaying ? 'Pause Station' : 'Play Station';
  });
};

const setText = (element, value) => {
  if (element) element.textContent = value;
};

const updateTrackText = (title, artist) => {
  setText(dockTrack, title || 'DJMixHub Live');
  setText(dockArtist, artist || 'radio.djmixhub.com');
  setText(npTitle, title || 'DJMixHub Live');
  setText(npArtist, artist || 'radio.djmixhub.com');
  setText(heroTrack, title || 'Live stream');
};

const updateStatus = (status) => {
  const nice = status || 'Live';
  setText(heroLiveStatus, nice);
  setText(heroMiniStatus, nice);
};

const renderRecentTracks = (tracks = []) => {
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
    recent: payload.song_history || []
  };
};

const updateFromPayload = (payload) => {
  const data = extractStationData(payload);
  if (!data) return;

  currentStreamUrl = data.streamUrl || STATION.fallbackStreamUrl;
  if (audio && audio.src !== currentStreamUrl && !isPlaying) {
    audio.src = currentStreamUrl;
  }

  updateTrackText(data.title, data.artist);
  updateStatus(data.isLive ? 'Live now' : 'AutoDJ');
  renderRecentTracks(data.recent);
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
      updateTrackText('DJMixHub Live', 'Metadata unavailable');
      updateStatus('Stream ready');
      renderRecentTracks([]);
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

if (playToggle) {
  playToggle.addEventListener('click', togglePlayback);
}

playButtons.forEach((button) => button.addEventListener('click', togglePlayback));

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

setPlayButtonState();
refreshStationData();
setInterval(refreshStationData, 30000);
