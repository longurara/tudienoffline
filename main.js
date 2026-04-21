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
      hint: 'Dictionary 1 mo nhanh hon va phu hop khi ban muon tra nhanh tren may yeu hon.'
    },
    dict2: {
      key: 'dict2',
      label: 'Dictionary 2',
      shortLabel: 'D2',
      page: './index-dict2.html',
      hint: 'Dictionary 2 la ban FULL. Cac chunk du lieu se duoc nap dan trong nen.'
    },
    both: {
      key: 'both',
      label: 'Ca 2',
      shortLabel: 'D1 + D2',
      page: './index-both.html',
      hint: 'Gop ca 2 bo du lieu de tra rong hon. Neu D2 chua nap xong, ket qua se duoc bo sung dan.'
    }
  }

  const modeMeta = {
    auto: {
      label: 'Tu dong',
      placeholder: 'Vi du: abandon, ability, suc khoe...',
      hint: 'Tu dong uu tien Anh -> Viet hoac Viet -> Anh dua tren tu khoa ban vua nhap.'
    },
    'en-vi': {
      label: 'Anh -> Viet',
      placeholder: 'Vi du: abandon, acid, alert...',
      hint: 'Uu tien khop truc tiep tren muc tu tieng Anh, sau do moi mo rong sang phan nghia.'
    },
    'vi-en': {
      label: 'Viet -> Anh',
      placeholder: 'Vi du: suc khoe, phan ung, may bay...',
      hint: 'Tra nguoc trong nghia, chu thich va noi dung tieng Viet cua tung muc tu.'
    }
  }

  const state = {
    selectedMode: 'auto',
    selectedSource: window.APP_DATASET_MODE || 'dict1',
    activeDataset: null,
    selectedEntryId: null
  }

  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0111/g, 'd')
      .replace(/\u0110/g, 'D')
      .toLowerCase()
      .trim()
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function stripHtml(value) {
    return String(value ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function getPlainText(entry) {
    const cacheKey = entry.id || `${entry.sourceKey || 'entry'}:${entry.originalId || entry.word || 'unknown'}`

    if (!plainTextCache.has(cacheKey)) {
      plainTextCache.set(cacheKey, stripHtml(entry.html))
    }

    return plainTextCache.get(cacheKey)
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
      escapeHtml(String(value).slice(0, start)) +
      '<mark>' +
      escapeHtml(String(value).slice(start, end)) +
      '</mark>' +
      escapeHtml(String(value).slice(end))
    )
  }

  function buildSnippet(entry, rawQuery, effectiveMode) {
    const plain = getPlainText(entry)

    if (!rawQuery) {
      return plain.slice(0, 120)
    }

    const normalizedQuery = normalizeText(rawQuery)
    const normalizedPlain = entry.textKey || ''
    let matchIndex = normalizedPlain.indexOf(normalizedQuery)

    if (matchIndex === -1 && effectiveMode === 'en-vi') {
      return plain.slice(0, 120)
    }

    if (matchIndex === -1) {
      matchIndex = 0
    }

    const start = Math.max(0, matchIndex - 40)
    const end = Math.min(plain.length, matchIndex + normalizedQuery.length + 88)
    const prefix = start > 0 ? '...' : ''
    const suffix = end < plain.length ? '...' : ''

    return prefix + plain.slice(start, end).trim() + suffix
  }

  function renderDetail(entry) {
    detailTitle.textContent = entry.sourceLabel ? `${entry.word} - ${entry.sourceLabel}` : entry.word
    detailContent.className = 'detail-content'
    detailContent.innerHTML = entry.html || '<p>Khong co chi tiet cho muc nay.</p>'
  }

  function renderEmptyState(title, description) {
    detailTitle.textContent = title
    detailContent.className = 'detail-content empty-state'
    detailContent.textContent = description
  }

  function activateRenderedEntry(button, entry) {
    results.querySelectorAll('.result-item').forEach((node) => {
      node.classList.remove('active')
    })

    if (button) {
      button.classList.add('active')
    }

    state.selectedEntryId = entry.id
    renderDetail(entry)
  }

  function renderResults(items, rawQuery, effectiveMode) {
    resultCount.textContent = String(items.length)
    results.innerHTML = ''

    if (!items.length) {
      state.selectedEntryId = null
      renderEmptyState('Chua co ket qua', 'Thu nhap tu khoa khac hoac doi huong tra cuu.')
      results.innerHTML = '<div class="empty-results">Khong tim thay muc phu hop.</div>'
      return
    }

    let firstMatch = null
    let selectedMatch = null

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
        activateRenderedEntry(button, entry)
      })

      if (index === 0) {
        firstMatch = { button, entry }
      }

      if (entry.id === state.selectedEntryId) {
        selectedMatch = { button, entry }
      }

      results.appendChild(button)
    })

    const activeMatch = selectedMatch || firstMatch
    if (activeMatch) {
      activateRenderedEntry(activeMatch.button, activeMatch.entry)
    }
  }

  function isVietnameseQuery(rawQuery) {
    return /[^\u0000-\u007F]/.test(String(rawQuery ?? ''))
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

    return exactWord.concat(startsWith, containsWord, containsText).slice(0, maxResults)
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
        ? `${mode.hint} Hien tai uu tien ${modeMeta[effectiveMode].label}.`
        : mode.hint
    sourceHint.textContent = source.hint
  }

  function updateSearch() {
    const rawQuery = searchInput.value
    const { items, effectiveMode } = searchEntries(rawQuery)
    const total = state.activeDataset?.totalEntries?.toLocaleString('vi-VN') ?? '0'
    const loaded = state.activeDataset?.loadedEntries?.toLocaleString('vi-VN') ?? total

    syncUi(effectiveMode)

    if (!state.activeDataset) {
      status.textContent = 'Chua nap bo du lieu.'
      renderEmptyState('Chua nap du lieu', 'Khong tim thay bo du lieu preload cho trang nay.')
      results.innerHTML = ''
      resultCount.textContent = '0'
      return
    }

    if (!state.activeDataset.isComplete) {
      const chunkLabel =
        state.activeDataset.totalParts > 1
          ? ` (${state.activeDataset.loadedParts}/${state.activeDataset.totalParts} chunk)`
          : ''

      status.textContent = rawQuery
        ? `Dang tra ${modeMeta[effectiveMode].label} trong ${state.activeDataset.label}. Hien da nap ${loaded}/${total} muc tu${chunkLabel}, nen ket qua se duoc bo sung khi cac chunk con lai tiep tuc nap.`
        : `Dang nap nen ${state.activeDataset.label}: ${loaded}/${total} muc tu${chunkLabel}. Ban co the tim ngay, ket qua se day dan khi cac chunk tiep tuc xong.`
    } else {
      status.textContent = rawQuery
        ? `Dang tra ${modeMeta[effectiveMode].label} trong ${state.activeDataset.label}, hien thi toi da ${maxResults} ket qua tren ${total} muc tu.`
        : `San sang tra cuu ${total} muc tu tu ${state.activeDataset.label}.`
    }

    renderResults(items, rawQuery, effectiveMode)
  }

  function normalizeLoadedDataset(item) {
    const config = datasetMeta[item.key]
    const rawData = item.data

    if (!rawData || !Array.isArray(rawData.entries)) {
      return null
    }

    const normalizedCount = rawData.__normalizedCount ?? 0

    for (let index = normalizedCount; index < rawData.entries.length; index += 1) {
      const entry = rawData.entries[index]
      const originalId = entry.originalId ?? entry.id

      entry.originalId = originalId
      entry.id = `${config.key}:${originalId}`
      entry.sourceKey = config.key
      entry.sourceLabel = config.shortLabel
    }

    rawData.__normalizedCount = rawData.entries.length

    return {
      key: config.key,
      label: config.label,
      shortLabel: config.shortLabel,
      sourceFile: rawData.sourceFile,
      title: rawData.title,
      author: rawData.author,
      totalEntries: rawData.totalEntries ?? rawData.entries.length,
      loadedEntries: rawData.loadedEntries ?? rawData.entries.length,
      loadedParts: rawData.loadedParts ?? 1,
      totalParts: rawData.totalParts ?? 1,
      isComplete: rawData.isComplete ?? true,
      entries: rawData.entries
    }
  }

  function buildCombinedDataset(normalized) {
    const entries = []

    for (const item of normalized) {
      for (const entry of item.entries) {
        entries.push(entry)
      }
    }

    return {
      key: 'both',
      label: datasetMeta.both.label,
      shortLabel: datasetMeta.both.shortLabel,
      sourceFile: normalized.map((item) => item.sourceFile).join(' + '),
      title: normalized.map((item) => item.title).join(' + '),
      author: normalized.flatMap((item) => item.author ?? []),
      totalEntries: normalized.reduce((sum, item) => sum + item.totalEntries, 0),
      loadedEntries: normalized.reduce((sum, item) => sum + item.loadedEntries, 0),
      loadedParts: normalized.reduce((sum, item) => sum + item.loadedParts, 0),
      totalParts: normalized.reduce((sum, item) => sum + item.totalParts, 0),
      isComplete: normalized.every((item) => item.isComplete),
      entries
    }
  }

  function buildActiveDataset() {
    const preloaded = Array.isArray(window.PRELOADED_DICTIONARIES) ? window.PRELOADED_DICTIONARIES : []
    const normalized = preloaded.map(normalizeLoadedDataset).filter(Boolean)

    if (!normalized.length) {
      return null
    }

    if (state.selectedSource === 'both' && normalized.length >= 2) {
      return buildCombinedDataset(normalized)
    }

    return normalized[0]
  }

  function refreshDatasetAndUi() {
    state.activeDataset = buildActiveDataset()
    updateSearch()
  }

  window.addEventListener('dictionary-data-updated', function () {
    refreshDatasetAndUi()
  })

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

  renderEmptyState('Chon mot muc de xem nghia', 'Nhap tu khoa o o tim kiem de bat dau.')
  refreshDatasetAndUi()

  if (!state.activeDataset) {
    window.APP_BOOTSTRAP?.fail?.(
      'Khong tim thay du lieu preload',
      'Trang da mo xong nhung khong co bo tu dien hop le de khoi tao.'
    )
  }
})()
