(function () {
  let activeToast = null;
  let activeToastTimer = null;

  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  function createId() {
    return 'track-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8);
  }

  function normalizeEmbedHtml(embedHtml) {
    return embedHtml
      .replace(/visual=true/g, 'visual=false')
      .replace(/color=%23[0-9a-fA-F]{6}/g, 'color=%23000000');
  }

  function getTrackCategory(url) {
    return url.includes('/sets/') ? 'playlist' : 'track';
  }

  function parsePreviewData(payload, originalUrl) {
    const title = payload.title || 'Без названия';
    const author = payload.author_name || 'Неизвестный автор';

    return {
      title: title,
      author: author,
      soundcloudUrl: payload.author_url ? originalUrl : originalUrl,
      embedHtml: normalizeEmbedHtml(payload.html || ''),
      category: getTrackCategory(originalUrl)
    };
  }

  function isSoundCloudUrl(value) {
    return /^https?:\/\/(www\.)?soundcloud\.com\/.+/i.test(value.trim());
  }

  function showToast(message, icon) {
    if (activeToastTimer) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }

    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span class="material-symbols-rounded">' + (icon || 'library_music') + '</span><span>' + message + '</span>';
    document.body.appendChild(toast);
    activeToast = toast;

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    activeToastTimer = setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        if (activeToast === toast) {
          toast.remove();
          activeToast = null;
        }
      }, 250);
    }, 2400);
  }

  function confirmDialog(options) {
    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      overlay.innerHTML =
        '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">' +
        '<h3 id="dialogTitle">' + options.title + '</h3>' +
        '<p>' + options.message + '</p>' +
        '<div class="dialog-actions">' +
        '<button class="btn btn-secondary" type="button" data-action="cancel">Отмена</button>' +
        '<button class="btn btn-primary" type="button" data-action="confirm">' + (options.confirmText || 'Подтвердить') + '</button>' +
        '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      const cleanup = function (result) {
        overlay.classList.remove('open');
        setTimeout(function () {
          overlay.remove();
          resolve(result);
        }, 180);
      };

      overlay.addEventListener('click', function (event) {
        const action = event.target.getAttribute('data-action');
        if (event.target === overlay || action === 'cancel') {
          cleanup(false);
        }
        if (action === 'confirm') {
          cleanup(true);
        }
      });

      requestAnimationFrame(function () {
        overlay.classList.add('open');
      });
    });
  }

  window.AppUtils = {
    formatDate: formatDate,
    createId: createId,
    normalizeEmbedHtml: normalizeEmbedHtml,
    parsePreviewData: parsePreviewData,
    isSoundCloudUrl: isSoundCloudUrl,
    showToast: showToast,
    confirmDialog: confirmDialog,
    getTrackCategory: getTrackCategory
  };
})();
