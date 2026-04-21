(function () {
  const config = window.APP_BOOT_CONFIG || {}
  const mode = config.mode || 'dict1'
  const dictionaries = Array.isArray(config.dictionaries) ? config.dictionaries : []

  window.APP_DATASET_MODE = mode
  window.PRELOADED_DICTIONARIES = []

  const overlay = createLoadingOverlay()
  let currentPercent = 0
  let animationFrameId = 0

  function clampPercent(value) {
    return Math.max(0, Math.min(100, Math.round(value)))
  }

  function renderProgress(percent) {
    const safePercent = clampPercent(percent)
    overlay.bar.style.width = `${safePercent}%`
    overlay.percent.textContent = `${safePercent}%`
    overlay.bar.setAttribute('aria-valuenow', String(safePercent))
  }

  function animateProgress(nextPercent) {
    const target = clampPercent(nextPercent)

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    function tick() {
      if (currentPercent === target) {
        renderProgress(currentPercent)
        return
      }

      const distance = target - currentPercent
      const step = Math.max(1, Math.ceil(Math.abs(distance) / 6))
      currentPercent += distance > 0 ? step : -step

      if ((distance > 0 && currentPercent > target) || (distance < 0 && currentPercent < target)) {
        currentPercent = target
      }

      renderProgress(currentPercent)

      if (currentPercent !== target) {
        animationFrameId = requestAnimationFrame(tick)
      }
    }

    tick()
  }

  function setProgress(percent, title, detail) {
    animateProgress(percent)

    if (title) {
      overlay.title.textContent = title
    }

    if (detail) {
      overlay.detail.textContent = detail
    }
  }

  function setError(title, detail) {
    overlay.root.classList.add('is-error')
    setProgress(currentPercent || 100, title, detail)
  }

  function finish() {
    setProgress(100, 'San sang tra cuu', 'Tu dien da nap xong. Ban co the bat dau tim kiem.')
    overlay.root.classList.add('is-done')

    window.setTimeout(function () {
      overlay.root.classList.add('is-hidden')
    }, 360)
  }

  async function nextPaint() {
    await new Promise(function (resolve) {
      requestAnimationFrame(function () {
        window.setTimeout(resolve, 0)
      })
    })
  }

  async function loadScript(src) {
    await new Promise(function (resolve, reject) {
      const script = document.createElement('script')
      script.src = src
      script.async = false
      script.onload = resolve
      script.onerror = function () {
        reject(new Error(`Khong the nap file ${src}`))
      }
      document.body.appendChild(script)
    })
  }

  function captureDictionary(step) {
    if (!window.DICTIONARY_DATA || !Array.isArray(window.DICTIONARY_DATA.entries)) {
      throw new Error(`Khong tim thay du lieu hop le trong ${step.src}`)
    }

    window.PRELOADED_DICTIONARIES.push({
      key: step.key,
      data: window.DICTIONARY_DATA
    })

    delete window.DICTIONARY_DATA
  }

  async function loadDictionary(step) {
    setProgress(
      step.startPercent,
      step.startTitle || `Dang nap ${step.label}`,
      step.startDetail || 'Neu bo du lieu lon, trinh duyet co the mat nhieu thoi gian de doc va parse file.'
    )
    await nextPaint()
    await loadScript(step.src)
    captureDictionary(step)
    setProgress(
      step.endPercent,
      step.endTitle || `Da nap xong ${step.label}`,
      step.endDetail || 'Du lieu da duoc dua vao bo nho. Dang chuyen sang buoc tiep theo.'
    )
    await nextPaint()
  }

  window.APP_BOOTSTRAP = {
    setProgress,
    finish,
    fail: setError
  }

  bootstrap().catch(function (error) {
    console.error(error)
    setError('Khong the nap tu dien', error && error.message ? error.message : 'Hay thu mo lai trang.')
  })

  async function bootstrap() {
    setProgress(
      4,
      'Dang mo trang',
      'Khoi tao giao dien local. Neu ban chon Dictionary 2 hoac Ca 2, viec nap co the mat 10-15 phut.'
    )
    await nextPaint()

    for (const step of dictionaries) {
      await loadDictionary(step)
    }

    setProgress(96, 'Dang khoi tao tra cuu', 'Dang gan du lieu vao giao dien va chuan bi o tim kiem.')
    await nextPaint()
    await loadScript('./main.js')
  }

  function createLoadingOverlay() {
    const root = document.createElement('div')
    root.className = 'loading-overlay'

    root.innerHTML = `
      <div class="loading-card" role="status" aria-live="polite" aria-atomic="true">
        <p class="loading-eyebrow">Loading Dictionary</p>
        <h2 class="loading-title">Dang chuan bi du lieu...</h2>
        <p class="loading-detail">
          Trinh duyet dang nap du lieu local. Voi bo FULL, thoi gian cho doi co the rat lau.
        </p>
        <div class="loading-progress-row">
          <div
            class="loading-progress-track"
            role="progressbar"
            aria-label="Tien do nap tu dien"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
          >
            <div class="loading-progress-fill"></div>
          </div>
          <strong class="loading-progress-value">0%</strong>
        </div>
        <p class="loading-note">
          Phan tram nay la uoc luong theo giai doan nap va khoi tao, khong phai byte-progress chinh xac cua file local.
        </p>
      </div>
    `

    document.body.appendChild(root)

    return {
      root,
      title: root.querySelector('.loading-title'),
      detail: root.querySelector('.loading-detail'),
      bar: root.querySelector('.loading-progress-fill'),
      percent: root.querySelector('.loading-progress-value')
    }
  }
})()
