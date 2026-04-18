(() => {
  const CONFIG = {
    shortcode: 'djmixhub',
    streamPath: '/azuracast/listen/djmixhub/radio.mp3',
    nowPlayingUrl: '/azuracast/api/nowplaying_static/djmixhub.json',
    pollMs: 15000,
    schedulePollMs: 60000,
    maxScheduleItems: 6,
    fallbackArt: 'assets/img/logo.jpg'
  };

  const state = {
    nowPlaying: null,
    schedule: [],
    stationId: null,
    scheduleLoaded: false
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    audio: $('station-audio'),
    playBtn: $('play-toggle'),
    volume: $('volume-range'),
    dockTrack: $('dock-track'),
    dockArtist: $('dock-artist'),
    dockListeners: $('dock-listeners'),
    playerArt: $('player-art'),
    heroStatus: $('hero-status'),
    heroListeners: $('hero-listeners'),
    heroTrack: $('hero-track'),
    npTitle: $('np-title'),
    npArtist: $('np-artist'),
    npSource: $('np-source'),
    npUpdated: $('np-updated'),
    scheduleNowTitle: $('schedule-now-title'),
    scheduleNowMeta: $('schedule-now-meta'),
    scheduleList: $('schedule-list'),
    year: $('year')
  };

  if (els.year) {
    els.year.textContent = String(new Date().getFullYear());
  }

  const friendlyTime = (dateLike) => {
    try {
      const date = new Date(dateLike);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
    } catch {
      return '';
    }
  };

  const secondsAgoText = () => {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date());
  };

  const formatListeners = (np) => {
    const total = np?.listeners?.total;
    if (typeof total === 'number') return String(total);
    if (typeof total === 'string' && total.trim()) return total;
    return '--';
  };

  const buildTrackText = (song) => {
    if (!song) return { title: 'Station automation', artist: 'DJMixHub' };
    const title = song.title || song.text || 'Unknown track';
    const artist = song.artist || song.album || 'DJMixHub';
    return { title, artist };
  };

  const proxifyUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return CONFIG.fallbackArt;
    if (rawUrl.startsWith('data:')) return rawUrl;
    if (rawUrl.startsWith('/azuracast/')) return rawUrl;
    if (rawUrl.startsWith('/')) return '/azuracast' + rawUrl;
    try {
      const parsed = new URL(rawUrl);
      return '/azuracast' + parsed.pathname + parsed.search;
    } catch {
      return CONFIG.fallbackArt;
    }
  };

  const getArtUrl = (np) => {
    const artCandidates = [
      np?.now_playing?.song?.art,
      np?.now_playing?.song?.art_url,
      np?.now_playing?.song?.album_art,
      np?.song?.art,
      np?.station?.logo,
      CONFIG.fallbackArt
    ];

    for (const candidate of artCandidates) {
      if (candidate) return proxifyUrl(candidate);
    }
    return CONFIG.fallbackArt;
  };

  const getSourceLabel = (np) => {
    if (np?.live?.is_live) {
      return np.live.streamer_name ? `Live DJ · ${np.live.streamer_name}` : 'Live DJ';
    }
    if (np?.now_playing?.playlist) {
      return np.now_playing.playlist;
    }
    return 'Station automation';
  };

  const updatePlayButton = () => {
    if (!els.playBtn || !els.audio) return;
    els.playBtn.textContent = els.audio.paused ? '▶' : '❚❚';
  };

  const setAudioSource = () => {
    if (!els.audio) return;
    if (!els.audio.src) {
      els.audio.src = CONFIG.streamPath;
    }
  };

  const togglePlayback = async () => {
    if (!els.audio) return;
    setAudioSource();
    try {
      if (els.audio.paused) {
        await els.audio.play();
      } else {
        els.audio.pause();
      }
    } catch (err) {
      console.error('Audio playback error:', err);
    } finally {
      updatePlayButton();
    }
  };

  const renderNowPlaying = (np) => {
    state.nowPlaying = np;
    state.stationId = np?.station?.id || state.stationId;

    const track = buildTrackText(np?.now_playing?.song);
    const listeners = formatListeners(np);
    const artUrl = getArtUrl(np);
    const source = getSourceLabel(np);
    const isOnline = np?.is_online !== false;

    if (els.dockTrack) els.dockTrack.textContent = track.title;
    if (els.dockArtist) els.dockArtist.textContent = track.artist;
    if (els.dockListeners) els.dockListeners.textContent = listeners;
    if (els.heroListeners) els.heroListeners.textContent = listeners;
    if (els.heroTrack) els.heroTrack.textContent = track.title;
    if (els.npTitle) els.npTitle.textContent = track.title;
    if (els.npArtist) els.npArtist.textContent = track.artist;
    if (els.npSource) els.npSource.textContent = source;
    if (els.npUpdated) els.npUpdated.textContent = secondsAgoText();
    if (els.heroStatus) els.heroStatus.textContent = isOnline ? 'On air' : 'Offline';
    if (els.playerArt) {
      els.playerArt.src = artUrl;
      els.playerArt.onerror = () => { els.playerArt.src = CONFIG.fallbackArt; };
    }

    if (els.scheduleNowTitle) {
      els.scheduleNowTitle.textContent = source;
    }
    if (els.scheduleNowMeta) {
      els.scheduleNowMeta.textContent = `${track.artist} — ${track.title}`;
    }
  };

  const scheduleHtmlFromApi = (items) => {
    if (!Array.isArray(items) || items.length === 0) return '';
    return items.slice(0, CONFIG.maxScheduleItems).map((item) => {
      const title = item.name || item.title || item.playlist || item.streamer_name || 'Scheduled programming';
      const start = item.start_timestamp ? friendlyTime(item.start_timestamp * 1000) : (item.start ? friendlyTime(item.start) : '');
      const end = item.end_timestamp ? friendlyTime(item.end_timestamp * 1000) : (item.end ? friendlyTime(item.end) : '');
      const metaBits = [start && end ? `${start} – ${end}` : start || end, item.type || item.kind || 'Programming'].filter(Boolean);
      const desc = item.description || item.text || item.comments || 'Scheduled station programming.';
      return `
        <article class="glass-card schedule-item">
          <div class="schedule-item-meta">${metaBits.join(' · ')}</div>
          <h3>${title}</h3>
          <p class="schedule-item-subtext">${desc}</p>
        </article>
      `;
    }).join('');
  };

  const scheduleHtmlFallback = (np) => {
    const history = Array.isArray(np?.song_history) ? np.song_history.slice(0, 5) : [];
    if (!history.length) {
      return `
        <article class="glass-card schedule-item placeholder">
          <h3>No public schedule yet</h3>
          <p>The station is live, but no future programming blocks are published yet.</p>
        </article>
      `;
    }

    return history.map((entry, index) => {
      const song = buildTrackText(entry?.song);
      const playedAt = entry?.played_at ? friendlyTime(entry.played_at * 1000) : 'Recently played';
      const label = index === 0 ? 'Just played' : playedAt;
      return `
        <article class="glass-card schedule-item">
          <div class="schedule-item-meta">${label}</div>
          <h3>${song.title}</h3>
          <p class="schedule-item-subtext">${song.artist}</p>
        </article>
      `;
    }).join('');
  };

  const renderSchedule = (items, fromApi = false) => {
    if (!els.scheduleList) return;
    if (fromApi && Array.isArray(items) && items.length) {
      els.scheduleList.innerHTML = scheduleHtmlFromApi(items);
      state.scheduleLoaded = true;
      return;
    }
    els.scheduleList.innerHTML = scheduleHtmlFallback(state.nowPlaying);
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  };

  const fetchNowPlaying = async () => {
    try {
      const np = await fetchJson(CONFIG.nowPlayingUrl);
      renderNowPlaying(np);
      if (!state.scheduleLoaded) {
        renderSchedule([], false);
      }
    } catch (err) {
      console.error('Now playing fetch failed:', err);
      if (els.heroStatus) els.heroStatus.textContent = 'Unable to load';
    }
  };

  const fetchSchedule = async () => {
    const stationId = state.stationId || CONFIG.shortcode;
    const candidates = [
      `/azuracast/api/station/${stationId}/schedule`,
      `/azuracast/api/station/${CONFIG.shortcode}/schedule`
    ];

    for (const url of candidates) {
      try {
        const data = await fetchJson(url);
        const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        if (items.length) {
          renderSchedule(items, true);
          return;
        }
      } catch (err) {
        console.debug('Schedule fetch failed for', url, err);
      }
    }

    renderSchedule([], false);
  };

  const initAudio = () => {
    if (!els.audio) return;
    setAudioSource();
    els.audio.volume = Number(localStorage.getItem('djmixhub-volume') || els.volume?.value || 0.85);
    if (els.volume) {
      els.volume.value = String(els.audio.volume);
      els.volume.addEventListener('input', () => {
        els.audio.volume = Number(els.volume.value);
        localStorage.setItem('djmixhub-volume', String(els.audio.volume));
      });
    }

    els.audio.addEventListener('play', updatePlayButton);
    els.audio.addEventListener('pause', updatePlayButton);
    els.audio.addEventListener('ended', updatePlayButton);

    document.querySelectorAll('.js-play-toggle').forEach((btn) => {
      btn.addEventListener('click', togglePlayback);
    });
    if (els.playBtn) {
      els.playBtn.addEventListener('click', togglePlayback);
    }

    updatePlayButton();
  };

  initAudio();
  fetchNowPlaying().then(fetchSchedule);
  window.setInterval(fetchNowPlaying, CONFIG.pollMs);
  window.setInterval(fetchSchedule, CONFIG.schedulePollMs);
})();
