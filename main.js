(function () {
  const searchInput = document.getElementById('search-input')
  const clearButton = document.getElementById('clear-button')
  const status = document.getElementById('status')
  const sourceHint = document.getElementById('source-hint')
  const searchHint = document.getElementById('search-hint')
  const results = document.getElementById('results')
  const resultCount = document.getElementById('result-count')
  const detailTitle = document.getElementById('detail-title')
  const detailContent = document.getElementById('detail-content')
  const modeButtons = Array.from(document.querySelectorAll('.mode-button[data-mode]'))
  const sourceButtons = Array.from(document.querySelectorAll('.source-button'))
  const maxResults = 80
  const plainTextCache = new Map()

  const datasetMeta = {
    dict1: {
      key: 'dict1',
      label: 'Dictionary 1',
      shortLabel: 'D1',
      page: './index.html',
      hint: 'Dictionary 1 được nạp trước để mở nhanh hơn. Phù hợp khi bạn muốn tra nhẹ và phản hồi nhanh hơn.'
    },
    dict2: {
      key: 'dict2',
      label: 'Dictionary 2',
      shortLabel: 'D2',
      page: './index-dict2.html',
      hint: 'Dictionary 2 là bản FULL, nhiều mục từ hơn nhưng nặng hơn đáng kể khi mở lần đầu.'
    },
    both: {
      key: 'both',
      label: 'Cả 2',
      shortLabel: 'D1 + D2',
      page: './index-both.html',
      hint: 'Gộp cả hai bộ dữ liệu để tra cứu rộng hơn. Tùy chọn này sẽ nặng nhất.'
    }
  }

  const modeMeta = {
    auto: {
      label: 'Tự động',
      placeholder: 'Ví dụ: abandon, ability, sức khỏe...',
      hint: 'Tự động nhận diện hướng tra. Gõ tiếng Anh để tìm mục từ, hoặc gõ tiếng Việt có dấu để tra ngược từ phần nghĩa và chú thích.'
    },
    'en-vi': {
      label: 'Anh -> Việt',
      placeholder: 'Ví dụ: abandon, acid, alert...',
      hint: 'Ưu tiên khớp trực tiếp trên mục từ tiếng Anh, sau đó mới dò xuống phần nghĩa và ví dụ.'
    },
    'vi-en': {
      label: 'Việt -> Anh',
      placeholder: 'Ví dụ: sức khỏe, phản ứng, máy bay...',
      hint: 'Dò ngược trong phần nghĩa, chú thích và ví dụ tiếng Việt để gợi ra mục từ tiếng Anh phù hợp.'
    }
  }

  const state = {
    selectedMode: 'auto',
    selectedSource: window.APP_DATASET_MODE || 'dict1',
    activeDataset: null
  }

  function normalizeText(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim()
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function stripHtml(value) {
    return value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function getPlainText(entry) {
    if (!plainTextCache.has(entry.id)) {
      plainTextCache.set(entry.id, stripHtml(entry.html))
    }
    return plainTextCache.get(entry.id)
  }

  function highlight(value, query) {
    if (!query) {
      return escapeHtml(value)
    }

    const normalizedValue = normalizeText(value)
    const normalizedQuery = normalizeText(query)
    const start = normalizedValue.indexOf(normalizedQuery)

    if (start === -1) {
      return escapeHtml(value)
    }

    const end = start + normalizedQuery.length
    return (
      escapeHtml(value.slice(0, start)) +
      '<mark>' +
      escapeHtml(value.slice(start, end)) +
      '</mark>' +
      escapeHtml(value.slice(end))
    )
  }

  function buildSnippet(entry, rawQuery, effectiveMode) {
    const plain = getPlainText(entry)
    if (!rawQuery) {
      return plain.slice(0, 120)
    }

    const normalizedQuery = normalizeText(rawQuery)
    const normalizedPlain = entry.textKey
    let matchIndex = normalizedPlain.indexOf(normalizedQuery)

    if (matchIndex === -1 && effectiveMode === 'en-vi') {
      return plain.slice(0, 120)
    }

    if (matchIndex === -1) {
      matchIndex = 0
    }

    const start = Math.max(0, matchIndex - 40)
    const end = Math.min(plain.length, matchIndex + normalizedQuery.length + 88)
    const prefix = start > 0 ? '…' : ''
    const suffix = end < plain.length ? '…' : ''

    return prefix + plain.slice(start, end).trim() + suffix
  }

  function renderDetail(entry) {
    detailTitle.textContent = entry.sourceLabel ? `${entry.word} · ${entry.sourceLabel}` : entry.word
    detailContent.className = 'detail-content'
    detailContent.innerHTML = entry.html
  }

  function renderEmptyState(title, description) {
    detailTitle.textContent = title
    detailContent.className = 'detail-content empty-state'
    detailContent.textContent = description
  }

  function renderResults(items, rawQuery, effectiveMode) {
    resultCount.textContent = String(items.length)
    results.innerHTML = ''

    if (!items.length) {
      renderEmptyState('Chưa có kết quả', 'Thử nhập từ khóa khác hoặc đổi hướng tra cứu.')
      results.innerHTML = '<div class="empty-results">Không tìm thấy mục phù hợp.</div>'
      return
    }

    items.forEach((entry, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'result-item'
      button.dataset.entryId = entry.id

      const title = document.createElement('div')
      title.className = 'result-title'

      const titleText = document.createElement('p')
      titleText.className = 'result-word'
      titleText.innerHTML = highlight(entry.word, rawQuery)
      title.appendChild(titleText)

      if (state.selectedSource === 'both') {
        const tag = document.createElement('span')
        tag.className = 'source-tag'
        tag.textContent = entry.sourceLabel
        title.appendChild(tag)
      }

      const snippet = document.createElement('p')
      snippet.className = 'result-snippet'
      snippet.innerHTML = highlight(buildSnippet(entry, rawQuery, effectiveMode), rawQuery)

      button.append(title, snippet)
      button.addEventListener('click', function () {
        results.querySelectorAll('.result-item').forEach((node) => {
          node.classList.remove('active')
        })
        button.classList.add('active')
        renderDetail(entry)
      })

      if (index === 0) {
        button.classList.add('active')
        renderDetail(entry)
      }

      results.appendChild(button)
    })
  }

  function isVietnameseQuery(rawQuery) {
    return /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
      rawQuery
    )
  }

  function resolveMode(rawQuery) {
    if (state.selectedMode !== 'auto') {
      return state.selectedMode
    }

    return isVietnameseQuery(rawQuery) ? 'vi-en' : 'en-vi'
  }

  function searchEnglishToVietnamese(entries, query) {
    const exactWord = []
    const startsWith = []
    const containsWord = []
    const containsText = []

    for (const entry of entries) {
      if (entry.wordKey === query) {
        exactWord.push(entry)
      } else if (entry.wordKey.startsWith(query)) {
        startsWith.push(entry)
      } else if (entry.wordKey.includes(query)) {
        containsWord.push(entry)
      } else if (query.length >= 2 && entry.textKey.includes(query)) {
        containsText.push(entry)
      }

      if (exactWord.length >= maxResults) {
        break
      }
    }

    return exactWord
      .concat(startsWith, containsWord, containsText)
      .slice(0, maxResults)
  }

  function searchVietnameseToEnglish(entries, query) {
    if (query.length < 2) {
      return []
    }

    const matches = []

    for (const entry of entries) {
      const matchIndex = entry.textKey.indexOf(query)
      if (matchIndex === -1) {
        continue
      }

      const before = entry.textKey[matchIndex - 1]
      const boundaryBoost = !before || before === ' ' ? 0 : 12

      matches.push({
        entry,
        score: matchIndex + boundaryBoost,
        wordLength: entry.word.length
      })
    }

    matches.sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score
      }

      if (left.wordLength !== right.wordLength) {
        return left.wordLength - right.wordLength
      }

      return left.entry.word.localeCompare(right.entry.word)
    })

    return matches.slice(0, maxResults).map((item) => item.entry)
  }

  function searchEntries(rawQuery) {
    const query = normalizeText(rawQuery)
    const effectiveMode = resolveMode(rawQuery)
    const entries = state.activeDataset?.entries ?? []

    if (!query) {
      return {
        effectiveMode,
        items: entries.slice(0, maxResults)
      }
    }

    return {
      effectiveMode,
      items:
        effectiveMode === 'vi-en'
          ? searchVietnameseToEnglish(entries, query)
          : searchEnglishToVietnamese(entries, query)
    }
  }

  function syncUi(effectiveMode) {
    modeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === state.selectedMode)
    })

    sourceButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.source === state.selectedSource)
    })

    const mode = modeMeta[state.selectedMode]
    const source = datasetMeta[state.selectedSource]

    searchInput.placeholder = mode.placeholder
    searchHint.textContent =
      state.selectedMode === 'auto'
        ? `${mode.hint} Hiện tại đang ưu tiên ${modeMeta[effectiveMode].label}.`
        : mode.hint
    sourceHint.textContent = source.hint
  }

  function updateSearch() {
    const rawQuery = searchInput.value
    const { items, effectiveMode } = searchEntries(rawQuery)
    const total = state.activeDataset?.totalEntries?.toLocaleString('vi-VN') ?? '0'

    syncUi(effectiveMode)

    if (!state.activeDataset) {
      status.textContent = 'Chưa nạp bộ dữ liệu.'
      renderEmptyState('Chưa nạp dữ liệu', 'Không tìm thấy bộ dữ liệu đã preload cho trang này.')
      results.innerHTML = ''
      resultCount.textContent = '0'
      return
    }

    status.textContent = rawQuery
      ? `Đang tra ${modeMeta[effectiveMode].label} trong ${state.activeDataset.label}, hiển thị tối đa ${maxResults} kết quả trên ${total} mục từ.`
      : `Sẵn sàng tra cứu ${total} mục từ từ ${state.activeDataset.label}.`

    renderResults(items, rawQuery, effectiveMode)
  }

  function normalizeLoadedDataset(item) {
    const config = datasetMeta[item.key]
    const rawData = item.data

    if (!rawData || !Array.isArray(rawData.entries)) {
      return null
    }

    for (const entry of rawData.entries) {
      entry.originalId = entry.id
      entry.id = `${config.key}:${entry.id}`
      entry.sourceKey = config.key
      entry.sourceLabel = config.shortLabel
    }

    return {
      key: config.key,
      label: config.label,
      shortLabel: config.shortLabel,
      sourceFile: rawData.sourceFile,
      title: rawData.title,
      author: rawData.author,
      totalEntries: rawData.totalEntries,
      entries: rawData.entries
    }
  }

  function buildActiveDataset() {
    const preloaded = Array.isArray(window.PRELOADED_DICTIONARIES) ? window.PRELOADED_DICTIONARIES : []
    const normalized = preloaded.map(normalizeLoadedDataset).filter(Boolean)

    if (!normalized.length) {
      return null
    }

    if (state.selectedSource === 'both' && normalized.length >= 2) {
      return {
        key: 'both',
        label: datasetMeta.both.label,
        shortLabel: datasetMeta.both.shortLabel,
        sourceFile: normalized.map((item) => item.sourceFile).join(' + '),
        title: normalized.map((item) => item.title).join(' + '),
        author: normalized.flatMap((item) => item.author ?? []),
        totalEntries: normalized.reduce((sum, item) => sum + item.totalEntries, 0),
        entries: normalized.flatMap((item) => item.entries)
      }
    }

    return normalized[0]
  }

  sourceButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const nextSource = button.dataset.source
      if (nextSource === state.selectedSource) {
        return
      }

      window.location.href = datasetMeta[nextSource].page
    })
  })

  modeButtons.forEach((button) => {
    button.addEventListener('click', function () {
      state.selectedMode = button.dataset.mode
      updateSearch()
      searchInput.focus()
    })
  })

  clearButton.addEventListener('click', function () {
    searchInput.value = ''
    searchInput.focus()
    updateSearch()
  })

  searchInput.addEventListener('input', updateSearch)

  state.activeDataset = buildActiveDataset()
  renderEmptyState('Chọn một mục để xem nghĩa', 'Nhập từ khóa ở ô tìm kiếm để bắt đầu.')
  updateSearch()

  if (state.activeDataset) {
    window.APP_BOOTSTRAP?.finish?.()
  } else {
    window.APP_BOOTSTRAP?.fail?.(
      'Khong tim thay du lieu preload',
      'Trang da mo xong nhung khong co bo tu dien hop le de khoi tao.'
    )
  }
})()
