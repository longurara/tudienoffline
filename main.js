(function () {
  const data = window.DICTIONARY_DATA
  const searchInput = document.getElementById('search-input')
  const clearButton = document.getElementById('clear-button')
  const status = document.getElementById('status')
  const searchHint = document.getElementById('search-hint')
  const results = document.getElementById('results')
  const resultCount = document.getElementById('result-count')
  const detailTitle = document.getElementById('detail-title')
  const detailContent = document.getElementById('detail-content')
  const modeButtons = Array.from(document.querySelectorAll('.mode-button'))
  const maxResults = 80
  const plainTextCache = new Map()

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

  let selectedMode = 'auto'

  if (!data || !Array.isArray(data.entries)) {
    status.textContent = 'Không tìm thấy dữ liệu từ điển. Hãy chạy bước build dữ liệu trước.'
    return
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
    detailTitle.textContent = entry.word
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

      const title = document.createElement('p')
      title.className = 'result-word'
      title.innerHTML = highlight(entry.word, rawQuery)

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
    if (selectedMode !== 'auto') {
      return selectedMode
    }

    return isVietnameseQuery(rawQuery) ? 'vi-en' : 'en-vi'
  }

  function searchEnglishToVietnamese(query) {
    const exactWord = []
    const startsWith = []
    const containsWord = []
    const containsText = []

    for (const entry of data.entries) {
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

  function searchVietnameseToEnglish(query) {
    if (query.length < 2) {
      return []
    }

    const matches = []

    for (const entry of data.entries) {
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

    if (!query) {
      return {
        effectiveMode,
        items: data.entries.slice(0, maxResults)
      }
    }

    return {
      effectiveMode,
      items:
        effectiveMode === 'vi-en'
          ? searchVietnameseToEnglish(query)
          : searchEnglishToVietnamese(query)
    }
  }

  function syncModeUi(effectiveMode) {
    modeButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === selectedMode)
    })

    const meta = modeMeta[selectedMode]
    searchInput.placeholder = meta.placeholder
    searchHint.textContent =
      selectedMode === 'auto'
        ? `${meta.hint} Hiện tại đang ưu tiên ${modeMeta[effectiveMode].label}.`
        : meta.hint
  }

  function updateSearch() {
    const rawQuery = searchInput.value
    const { items, effectiveMode } = searchEntries(rawQuery)
    const total = data.totalEntries.toLocaleString('vi-VN')

    syncModeUi(effectiveMode)

    status.textContent = rawQuery
      ? `Đang tra ${modeMeta[effectiveMode].label}, hiển thị tối đa ${maxResults} kết quả trong ${total} mục từ.`
      : `Sẵn sàng tra cứu ${total} mục.`

    renderResults(items, rawQuery, effectiveMode)
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', function () {
      selectedMode = button.dataset.mode
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

  status.textContent = `Đã nạp ${data.totalEntries.toLocaleString('vi-VN')} mục từ.`
  syncModeUi('en-vi')
  updateSearch()
})()
