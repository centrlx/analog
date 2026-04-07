(function () {
  const form = document.getElementById('trackForm');
  if (!form) {
    return;
  }

  const input = document.getElementById('trackUrl');
  const errorNode = document.getElementById('formError');
  const loader = document.getElementById('previewLoader');
  const previewArea = document.getElementById('previewArea');
  const previewTitle = document.getElementById('previewTitle');
  const previewAuthor = document.getElementById('previewAuthor');
  const previewEmbed = document.getElementById('previewEmbed');
  const saveButton = document.getElementById('saveTrackButton');
  const loadButton = document.getElementById('loadPreviewButton');
  const customTitleInput = document.getElementById('customTitle');
  const customGenreInput = document.getElementById('customGenre');
  const trackNoteInput = document.getElementById('trackNote');
  const genreErrorNode = document.getElementById('genreError');
  const noteErrorNode = document.getElementById('noteError');
  let previewData = null;

  function showError(message) {
    input.classList.add('error');
    errorNode.textContent = message;
    errorNode.classList.add('visible');
  }

  function clearError() {
    input.classList.remove('error');
    errorNode.classList.remove('visible');
  }

  function showGenreError() {
    customGenreInput.classList.add('error');
    genreErrorNode.classList.add('visible');
  }

  function clearGenreError() {
    customGenreInput.classList.remove('error');
    genreErrorNode.classList.remove('visible');
  }

  function showNoteError() {
    trackNoteInput.classList.add('error');
    noteErrorNode.classList.add('visible');
  }

  function clearNoteError() {
    trackNoteInput.classList.remove('error');
    noteErrorNode.classList.remove('visible');
  }

  function resetPreview() {
    previewData = null;
    saveButton.disabled = true;
    previewArea.classList.remove('visible');
    previewEmbed.innerHTML = '';
  }

  async function loadPreview() {
    const url = input.value.trim();
    resetPreview();
    clearError();

    if (!AppUtils.isSoundCloudUrl(url)) {
      showError('Нужна корректная ссылка вида soundcloud.com/... .');
      return;
    }

    loader.classList.add('visible');
    loadButton.disabled = true;

    try {
      const response = await fetch('https://soundcloud.com/oembed?format=json&maxheight=300&url=' + encodeURIComponent(url));
      if (!response.ok) {
        throw new Error('oEmbed request failed');
      }

      const payload = await response.json();
      previewData = AppUtils.parsePreviewData(payload, url);

      previewTitle.textContent = previewData.title;
      previewAuthor.textContent = previewData.author;
      previewEmbed.innerHTML = previewData.embedHtml;
      previewArea.classList.add('visible');
      saveButton.disabled = false;
      AppUtils.showToast('Превью успешно загружено', 'cloud_done');
    } catch (error) {
      console.error(error);
      showError('Не удалось загрузить данные. Проверьте ссылку или попробуйте другой трек.');
    } finally {
      loader.classList.remove('visible');
      loadButton.disabled = false;
    }
  }

  input.addEventListener('input', function () {
    clearError();
  });

  customGenreInput.addEventListener('change', function () {
    clearGenreError();
  });

  trackNoteInput.addEventListener('input', function () {
    clearNoteError();
  });

  loadButton.addEventListener('click', loadPreview);

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!previewData) {
      showError('Сначала загрузите превью, затем сохраните трек.');
      return;
    }

    if (!customGenreInput.value.trim()) {
      showGenreError();
      return;
    }

    if (!trackNoteInput.value.trim()) {
      showNoteError();
      return;
    }

    StorageAPI.saveTrack({
      id: AppUtils.createId(),
      title: customTitleInput.value.trim() || previewData.title,
      author: previewData.author,
      soundcloudUrl: input.value.trim(),
      embedHtml: previewData.embedHtml,
      addedAt: new Date().toISOString(),
      listened: false,
      category: previewData.category,
      genre: customGenreInput.value.trim(),
      note: trackNoteInput.value.trim(),
      originalTitle: previewData.title
    });

    AppUtils.showToast('Трек сохранён в коллекцию', 'save');
    window.setTimeout(function () {
      window.location.href = 'index.html';
    }, 500);
  });
})();
