(function () {
  const STORAGE_KEY = 'analog_tracks';

  const demoTracks = [];

  function readTracks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoTracks));
      return [...demoTracks];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse tracks from storage', error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoTracks));
      return [...demoTracks];
    }
  }

  function writeTracks(tracks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  }

  function getTracks() {
    return readTracks().sort(function (a, b) {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }

  function saveTrack(track) {
    const tracks = getTracks();
    tracks.unshift(track);
    writeTracks(tracks);
    return track;
  }

  function deleteTrack(trackId) {
    const nextTracks = getTracks().filter(function (track) {
      return track.id !== trackId;
    });
    writeTracks(nextTracks);
  }

  function updateTrack(trackId, patch) {
    const nextTracks = getTracks().map(function (track) {
      if (track.id !== trackId) {
        return track;
      }

      return Object.assign({}, track, patch);
    });

    writeTracks(nextTracks);
  }

  window.StorageAPI = {
    getTracks: getTracks,
    saveTrack: saveTrack,
    deleteTrack: deleteTrack,
    updateTrack: updateTrack
  };
})();
