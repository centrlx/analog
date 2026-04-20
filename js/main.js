(function () {
  const page = document.body.dataset.page;

  function createSummaryCards(tracks) {
    const summaryStrip = document.getElementById('summaryStrip');
    if (!summaryStrip) {
      return;
    }

    const listenedCount = tracks.filter(function (track) {
      return track.listened;
    }).length;

    const cards = [
      { label: 'Всего элементов', value: tracks.length, icon: 'queue_music' },
      { label: 'Прослушано', value: listenedCount, icon: 'done_all' }
    ];

    summaryStrip.innerHTML = cards.map(function (card) {
      return (
        '<article class="summary-card">' +
        '<span class="material-symbols-rounded">' + card.icon + '</span>' +
        '<strong>' + card.value + '</strong>' +
        '<p>' + card.label + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function renderHomePage() {
    const tracksContainer = document.getElementById('tracksContainer');
    if (!tracksContainer) {
      return;
    }

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const countNode = document.getElementById('trackCount');
    let searchQuery = '';
    let currentStatus = 'all';

    function filterTracks(tracks) {
      let filtered = tracks;

      if (currentStatus === 'listened') {
        filtered = filtered.filter(function (track) { return track.listened; });
      }
      if (currentStatus === 'pending') {
        filtered = filtered.filter(function (track) { return !track.listened; });
      }
      if (searchQuery) {
        filtered = filtered.filter(function (track) {
          const haystack = (track.title + ' ' + track.author).toLowerCase();
          return haystack.includes(searchQuery);
        });
      }
      return filtered;
    }

    function renderTracks() {
      const tracks = StorageAPI.getTracks();
      const visibleTracks = filterTracks(tracks);

      createSummaryCards(tracks);
      countNode.textContent = visibleTracks.length + ' элементов';

      if (!visibleTracks.length) {
        tracksContainer.innerHTML =
          '<section class="empty-state">' +
          '<span class="material-symbols-rounded empty-icon">music_off</span>' +
          '<h3>Ничего не найдено</h3>' +
          '<p>Попробуйте другой запрос или добавьте новую ссылку в коллекцию.</p>' +
          '<a class="btn btn-primary" href="form.html"><span class="material-symbols-rounded">add_circle</span>Добавить трек</a>' +
          '</section>';
        return;
      }

      tracksContainer.innerHTML = visibleTracks.map(function (track, index) {
        const listenedClass = track.listened ? ' listened' : '';
        const listenedStateClass = track.listened ? ' on' : '';
        const listenedLabel = track.listened ? 'Снять отметку' : 'Отметить прослушанным';
        const genreMarkup = track.genre
          ? '<span class="genre-pill genre-pill-secondary">' + track.genre + '</span>'
          : '';
        const noteMarkup = track.note ? '<p class="track-note">' + track.note + '</p>' : '';
        const listenedBadgeMarkup = track.listened
          ? '<div class="listened-badge"><span class="material-symbols-rounded">check_circle</span><span>Прослушано</span></div>'
          : '';
        const originalTitleMarkup = track.originalTitle && track.originalTitle !== track.title
          ? '<p class="track-original-title">Оригинал: ' + track.originalTitle + '</p>'
          : '';

        return (
          '<article class="track-card reference-row' + listenedClass + '" data-track-id="' + track.id + '">' +
          '<div class="track-row-top">' +
          '<div class="track-order">' + (index + 1) + '</div>' +
          '<div class="track-meta">' +
          '<div>' +
          '<h2 class="track-title">' + track.title + '</h2>' +
          '<p class="track-author">' + track.author + '</p>' +
          originalTitleMarkup +
          '</div>' +
          '</div>' +
          '<div class="track-type">' +
          '<div class="track-tags">' +
          genreMarkup +
          '</div>' +
          '</div>' +
          '<p class="track-date">' + AppUtils.formatDate(track.addedAt) + '</p>' +
          '<div class="track-actions">' +
          '<button class="btn-icon listened-toggle' + listenedStateClass + '" type="button" aria-label="' + listenedLabel + '" data-action="toggle-listened">' +
          '<span class="material-symbols-rounded">headphones</span>' +
          '</button>' +
          '<button class="btn-icon delete" type="button" aria-label="Удалить трек" data-action="delete-track">' +
          '<span class="material-symbols-rounded">delete</span>' +
          '</button>' +
          '</div>' +
          '</div>' +
          '<div class="track-embed-shell"><div class="track-player">' + AppUtils.normalizeEmbedHtml(track.embedHtml) + '</div></div>' +
          noteMarkup +
          listenedBadgeMarkup +
          '</article>'
        );
      }).join('');
    }

    function updateTrackCardState(card, track) {
      if (!card || !track) {
        return;
      }

      const toggleButton = card.querySelector('.listened-toggle');
      const existingBadge = card.querySelector('.listened-badge');
      const listenedLabel = track.listened ? 'Снять отметку' : 'Отметить прослушанным';

      card.classList.toggle('listened', track.listened);

      if (toggleButton) {
        toggleButton.classList.toggle('on', track.listened);
        toggleButton.setAttribute('aria-label', listenedLabel);
      }

      if (track.listened && !existingBadge) {
        const badge = document.createElement('div');
        badge.className = 'listened-badge';
        badge.innerHTML = '<span class="material-symbols-rounded">check_circle</span><span>Прослушано</span>';
        card.appendChild(badge);
      }

      if (!track.listened && existingBadge) {
        existingBadge.remove();
      }
    }

    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderTracks();
    });

    statusFilter.addEventListener('change', function () {
      currentStatus = statusFilter.value;
      renderTracks();
    });

    tracksContainer.addEventListener('click', async function (event) {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) {
        return;
      }

      const card = actionButton.closest('.track-card');
      const trackId = card && card.dataset.trackId;
      if (!trackId) {
        return;
      }

      if (actionButton.dataset.action === 'toggle-listened') {
        const track = StorageAPI.getTracks().find(function (item) {
          return item.id === trackId;
        });
        const nextListened = !track.listened;

        StorageAPI.updateTrack(trackId, { listened: nextListened });
        updateTrackCardState(card, Object.assign({}, track, { listened: nextListened }));
        AppUtils.showToast(track.listened ? 'Трек снова активен' : 'Трек отмечен как прослушанный', 'done_all');
        createSummaryCards(StorageAPI.getTracks());
      }

      if (actionButton.dataset.action === 'delete-track') {
        const isConfirmed = await AppUtils.confirmDialog({
          title: 'Удалить трек?',
          message: 'Элемент будет удалён из локальной коллекции. Это действие нельзя отменить.',
          confirmText: 'Удалить'
        });

        if (isConfirmed) {
          StorageAPI.deleteTrack(trackId);
          AppUtils.showToast('Трек удалён из коллекции', 'delete');
          renderTracks();
        }
      }
    });

    renderTracks();
  }

  function renderStatsPage() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) {
      return;
    }

    const tracks = StorageAPI.getTracks();
    const listenedCount = tracks.filter(function (track) {
      return track.listened;
    }).length;
    const pendingCount = tracks.length - listenedCount;
    const percent = tracks.length ? Math.round((listenedCount / tracks.length) * 100) : 0;

    const cards = [
      { label: 'Всего треков', value: tracks.length, icon: 'library_music' },
      { label: 'Прослушано', value: listenedCount, icon: 'headphones' },
      { label: 'К прослушиванию', value: pendingCount, icon: 'queue_music' }
    ];

    statsGrid.innerHTML = cards.map(function (card) {
      return (
        '<article class="stat-card">' +
        '<span class="material-symbols-rounded stat-icon">' + card.icon + '</span>' +
        '<div class="stat-number">' + card.value + '</div>' +
        '<div class="stat-label">' + card.label + '</div>' +
        '</article>'
      );
    }).join('');

    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('progressFill').style.width = percent + '%';

    const breakdownList = document.getElementById('breakdownList');
    breakdownList.innerHTML =
      '<div class="metric-bar"><div class="metric-label"><span>Прослушано</span><strong>' + listenedCount + '</strong></div><div class="metric-track"><div class="metric-fill" style="width:' + percent + '%"></div></div></div>' +
      '<div class="metric-bar"><div class="metric-label"><span>Не прослушано</span><strong>' + pendingCount + '</strong></div><div class="metric-track"><div class="metric-fill" style="width:' + (tracks.length ? Math.round((pendingCount / tracks.length) * 100) : 0) + '%"></div></div></div>';

    const dayLabels = ['Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн', 'Вт'];
    const weekBars = document.getElementById('weekBars');
    const buckets = dayLabels.map(function (label) {
      return { label: label, value: 0 };
    });

    tracks.forEach(function (track) {
      const dayIndex = new Date(track.addedAt).getDay();
      const mappedIndex = [4, 5, 6, 0, 1, 2, 3][dayIndex];
      buckets[mappedIndex].value += 1;
    });

    const maxWeekValue = Math.max.apply(null, buckets.map(function (bucket) {
      return bucket.value;
    }).concat([1]));

    weekBars.innerHTML = buckets.map(function (bucket) {
      return (
        '<div class="week-bar-item">' +
        '<div class="week-bar-fill" style="height:' + Math.max(8, Math.round((bucket.value / maxWeekValue) * 120)) + 'px"></div>' +
        '<span>' + bucket.label + '</span>' +
        '<strong>' + bucket.value + '</strong>' +
        '</div>'
      );
    }).join('');

    const statsInsight = document.getElementById('statsInsight');
    if (!tracks.length) {
      statsInsight.textContent = 'Коллекция ещё не заполнена: добавьте первый трек, чтобы увидеть аналитику.';
      return;
    }

    if (percent === 100) {
      statsInsight.textContent = 'Коллекция полностью прослушана. Можно смело добавлять что-то новое и расширять архив.';
      return;
    }

    statsInsight.textContent = 'Сейчас прослушано ' + percent + '% от общего объёма коллекции.';
  }

  if (page === 'home') {
    renderHomePage();
  }

  if (page === 'stats') {
    renderStatsPage();
  }
})();
