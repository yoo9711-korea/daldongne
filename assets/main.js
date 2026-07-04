  // AI 추천 답변 프리셋: Chapter 9 출판 신청 폼의 '전하고 싶은 말'에서 사용
  const APPLY_MESSAGE_PRESETS = {
    warm:     '제 이야기를 소중하게 다뤄주셔서 미리 감사드려요. 가족에게 선물할 생각을 하니 벌써 마음이 따뜻해집니다.',
    plain:    '특별히 전달드릴 내용은 없습니다. 안내해주신 절차대로 진행 부탁드립니다.',
    detailed: '제작 기간과 인쇄 사양(종이 재질, 페이지 수)에 대해 더 자세히 안내받고 싶고, 가능하다면 시안을 먼저 확인하고 싶습니다.'
  };

  // Header scroll state
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }, { passive: true });

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const mobilePanel = document.getElementById('mobilePanel');
  menuToggle.addEventListener('click', () => {
    const open = mobilePanel.classList.toggle('is-open');
    menuToggle.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mobilePanel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobilePanel.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  // Reveal on scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Folio (running page indicator)
  const folio = document.getElementById('folio');
  const folioSections = document.querySelectorAll('[data-folio]');
  const folioObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        folio.textContent = entry.target.getAttribute('data-folio');
        folio.classList.add('is-visible');
      }
    });
  }, { threshold: 0.5 });
  folioSections.forEach(s => folioObserver.observe(s));

  // ---------- Trial widget: upload + AI question + live draft ----------
  (function () {
    const QUESTIONS = [
      { key: 'when',       q: '이 사진은 언제, 어디서의 기억인가요?',         placeholder: '예: 2014년 여름, 할머니 댁 마당에서' },
      { key: 'people',     q: '이 순간을 함께한 사람은 누구였나요?',           placeholder: '예: 동생과 사촌들, 그리고 할머니' },
      { key: 'feeling',    q: '그때 가장 크게 느꼈던 감정은 무엇이었나요?',     placeholder: '예: 시원한 바람과 함께 느꼈던 평온함' },
      { key: 'reflection', q: '지금 이 사진을 다시 보면, 어떤 생각이 드나요?', placeholder: '예: 그 여름이 다시 오지 않는다는 게 새삼스럽다' }
    ];
    const TEMPLATES = {
      when:       (a) => `이 순간은 ${a}의 기억입니다.`,
      people:     (a) => `그 자리에는 ${a}이 함께 있었습니다.`,
      feeling:    (a) => `그때 마음속에는, ${a}이 자리하고 있었습니다.`,
      reflection: (a) => `지금 다시 이 사진을 보면, ${a}.`
    };
    const ENCOURAGE = [
      '차근차근 답해주세요.',
      '좋아요, 계속해볼까요?',
      '벌써 절반 왔어요!',
      '마지막 질문이에요, 거의 다 왔어요!'
    ];
    const PRESET_ANSWERS = {
      when: {
        warm:     '오래전 어느 따뜻한 계절, 마음 한켠에 오래도록 남아있는 날이에요.',
        plain:    '몇 해 전, 평범했던 어느 날이었습니다.',
        detailed: '정확한 날짜는 기억나지 않지만, 계절이 바뀌던 무렵 익숙한 장소에서 있었던 일이에요.'
      },
      people: {
        warm:     '가장 가까운 사람들과 함께였어요, 그저 곁에 있어준 것만으로도 충분했던 사람들이요.',
        plain:    '가족, 그리고 가까운 지인 몇 명이 함께했습니다.',
        detailed: '가족과 친한 친구들이 한자리에 모였고, 각자의 역할로 그 시간을 함께 채워주었어요.'
      },
      feeling: {
        warm:     '말로 다 표현할 수 없는 따뜻함과 편안함이 마음 가득 차올랐어요.',
        plain:    '평온하고 안정된 감정을 느꼈습니다.',
        detailed: '처음엔 약간의 긴장도 있었지만, 시간이 지날수록 마음이 놓이고 감사한 마음이 커졌어요.'
      },
      reflection: {
        warm:     '다시 보아도 그때의 온기가 그대로 전해져서, 마음이 뭉클해져요.',
        plain:    '돌아보면 의미 있던 시간이었다고 생각합니다.',
        detailed: '지금의 나와 그때의 나를 비교해보면, 그 순간이 이후의 선택에 영향을 준 것 같아요.'
      }
    };
    const PLACEHOLDER_TEXT = '사진을 올리고 질문에 답하면, 이 곳에 당신의 이야기가 쓰여집니다.';
    const MAX_PHOTOS = 6;

    const dropzone   = document.getElementById('dropzone');
    const fileInput  = document.getElementById('fileInput');
    const thumbsEl   = document.getElementById('thumbs');
    const qcardEl    = document.getElementById('qcard');
    const qProgress  = document.getElementById('qProgress');
    const qEncourage = document.getElementById('qEncourage');
    const qQuestion  = document.getElementById('qQuestion');
    const qAnswer    = document.getElementById('qAnswer');
    const qPresets   = document.getElementById('qPresets');
    const qPrev      = document.getElementById('qPrev');
    const qNext      = document.getElementById('qNext');
    const qToast     = document.getElementById('qToast');
    const refineEl   = document.getElementById('refine');
    const restartBtn = document.getElementById('restartTrial');
    const progressFill     = document.getElementById('progressFill');
    const previewPhotoPage = document.getElementById('previewPhotoPage');
    const previewText      = document.getElementById('previewText');
    const previewProgress  = document.getElementById('previewProgress');

    const bookTitleInput   = document.getElementById('bookTitle');
    const makeShareCardBtn = document.getElementById('makeShareCard');
    const shareCardEl      = document.getElementById('shareCard');
    const shareCardImg     = document.getElementById('shareCardImg');
    const downloadCardBtn  = document.getElementById('downloadCard');
    const shareCardBtn     = document.getElementById('shareCardBtn');
    const shareNote        = document.getElementById('shareNote');
    const shareCanvas      = document.getElementById('shareCanvas');

    if (!dropzone) return; // safety: widget not present

    let photos = [];          // { url }
    let selectedPhoto = -1;
    let answers = {};
    let qIndex = 0;
    let toastTimer = null;
    let generatedDataURL = null;

    function renderThumbs() {
      thumbsEl.innerHTML = '';
      photos.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'thumb' + (idx === selectedPhoto ? ' is-selected' : '');
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', '대표 사진으로 선택');
        const img = document.createElement('img');
        img.src = p.url;
        img.alt = '';
        div.appendChild(img);
        div.addEventListener('click', () => selectPhoto(idx));
        div.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPhoto(idx); }
        });
        thumbsEl.appendChild(div);
      });
    }

    function updatePreviewPhoto() {
      if (selectedPhoto > -1 && photos[selectedPhoto]) {
        previewPhotoPage.innerHTML =
          '<img src="' + photos[selectedPhoto].url + '" alt="">' +
          '<span class="preview__caption">COVER PHOTO</span>';
      } else {
        previewPhotoPage.innerHTML = '<p class="preview__photo-placeholder">사진을 올리면<br>이 페이지에 담깁니다</p>';
      }
    }

    function selectPhoto(idx) {
      selectedPhoto = idx;
      renderThumbs();
      updatePreviewPhoto();
    }

    function handleFiles(fileList) {
      const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
      files.slice(0, Math.max(0, MAX_PHOTOS - photos.length)).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          photos.push({ url: e.target.result });
          if (selectedPhoto === -1) selectedPhoto = photos.length - 1;
          renderThumbs();
          updatePreviewPhoto();
        };
        reader.readAsDataURL(file);
      });
    }

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function updateProgressDots() {
      qProgress.innerHTML = '';
      QUESTIONS.forEach((item, idx) => {
        const dot = document.createElement('span');
        dot.className = 'qcard__dot' +
          (idx === qIndex ? ' is-current' : '') +
          (answers[item.key] ? ' is-done' : '');
        qProgress.appendChild(dot);
      });
      const count = document.createElement('span');
      count.className = 'qcard__count';
      count.textContent = `질문 ${Math.min(qIndex + 1, QUESTIONS.length)} / ${QUESTIONS.length}`;
      qProgress.appendChild(count);
    }

    function updatePreviewProgressBadge() {
      const answered = Object.values(answers).filter(Boolean).length;
      previewProgress.textContent = `${answered} / ${QUESTIONS.length}`;
      progressFill.style.width = `${(answered / QUESTIONS.length) * 100}%`;
    }

    function composeDraft() {
      const sentences = QUESTIONS
        .map(item => answers[item.key] ? answers[item.key] : null)
        .filter(Boolean);
      if (sentences.length === 0) {
        previewText.textContent = PLACEHOLDER_TEXT;
        previewText.classList.add('is-placeholder');
      } else {
        previewText.textContent = sentences.join(' ');
        previewText.classList.remove('is-placeholder');
      }
      updatePreviewProgressBadge();
    }

    function showToast(message) {
      qToast.textContent = message || '답변이 적용되었습니다 ✓';
      qToast.classList.add('is-shown');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => qToast.classList.remove('is-shown'), 1500);
    }

    // Calls our own serverless function — never calls OpenAI directly from the browser.
    async function refineWithAI(question, rawAnswer) {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer: rawAnswer }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI 응답 실패');
      }
      const data = await res.json();
      return data.refined;
    }

    function renderQuestion() {
      if (qIndex >= QUESTIONS.length) {
        showRefine();
        return;
      }
      qcardEl.style.display = '';
      refineEl.classList.remove('is-active');
      previewText.setAttribute('contenteditable', 'false');
      const item = QUESTIONS[qIndex];
      qQuestion.textContent = item.q;
      qAnswer.placeholder = item.placeholder;
      qAnswer.value = answers[item.key] || '';
      qPrev.disabled = qIndex === 0;
      qNext.disabled = false;
      qNext.textContent = qIndex === QUESTIONS.length - 1 ? '초안 완성하기' : '답변 적용하기';
      qEncourage.textContent = ENCOURAGE[Math.min(qIndex, ENCOURAGE.length - 1)];
      updateProgressDots();
    }

    function showRefine() {
      qcardEl.style.display = 'none';
      refineEl.classList.add('is-active');
      if (!previewText.classList.contains('is-placeholder')) {
        previewText.setAttribute('contenteditable', 'true');
      }
    }

    async function applyAnswer() {
      const item = QUESTIONS[qIndex];
      const rawAnswer = qAnswer.value.trim();
      if (!rawAnswer) return;

      // store the raw answer immediately so nothing is lost if the API call fails
      answers[item.key] = rawAnswer;

      qNext.disabled = true;
      qNext.textContent = 'AI가 다듬는 중...';

      try {
        const refined = await refineWithAI(item.q, rawAnswer);
        answers[item.key] = refined;
        showToast('AI가 답변을 다듬었어요 ✓');
      } catch (e) {
        console.error(e);
        // graceful fallback: keep the user's original answer, just notify them
        showToast('AI 다듬기에 실패해 원문을 적용했어요');
      }

      composeDraft();
      qIndex = Math.min(qIndex + 1, QUESTIONS.length);
      renderQuestion();
    }

    function prevQuestion() {
      if (qIndex === 0) return;
      qIndex -= 1;
      renderQuestion();
    }

    function resetShareCard() {
      generatedDataURL = null;
      bookTitleInput.value = '';
      shareCardEl.style.display = 'none';
      shareNote.textContent = '#달동네출판사 #첫페이지 와 함께 공유해보세요';
    }

    function restartTrial() {
      photos = [];
      selectedPhoto = -1;
      answers = {};
      qIndex = 0;
      fileInput.value = '';
      renderThumbs();
      updatePreviewPhoto();
      composeDraft();
      resetShareCard();
      renderQuestion();
    }

    qNext.addEventListener('click', applyAnswer);
    qPrev.addEventListener('click', prevQuestion);
    restartBtn.addEventListener('click', restartTrial);
    qAnswer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); applyAnswer(); }
    });

    // AI 추천 답변 채우기: 현재 질문에 맞는 프리셋 텍스트를 텍스트박스에 즉시 채워준다.
    if (qPresets) {
      qPresets.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tone = btn.getAttribute('data-tone');
          const key = QUESTIONS[qIndex] && QUESTIONS[qIndex].key;
          const preset = key && PRESET_ANSWERS[key] && PRESET_ANSWERS[key][tone];
          if (!preset) return;
          qAnswer.value = preset;
          qAnswer.focus();
          btn.classList.add('is-flash');
          setTimeout(() => btn.classList.remove('is-flash'), 350);
        });
      });
    }

    // ---- Share card (canvas-rendered cover, downloadable / shareable) ----
    function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
      let lines = [];
      let current = '';
      for (const ch of text) {
        const test = current + ch;
        if (ctx.measureText(test).width > maxWidth && current.length > 0) {
          lines.push(current);
          current = ch;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        let last = lines[maxLines - 1];
        while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) last = last.slice(0, -1);
        lines[maxLines - 1] = last + '…';
      }
      lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    }

    async function generateShareCard() {
      const title = bookTitleInput.value.trim() || '제목 없는 첫 페이지';
      const ctx = shareCanvas.getContext('2d');
      const W = shareCanvas.width, H = shareCanvas.height;
      const photoH = Math.round(H * 0.6);

      ctx.fillStyle = '#1A1611';
      ctx.fillRect(0, 0, W, H);

      if (selectedPhoto > -1 && photos[selectedPhoto]) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.max(W / img.width, photoH / img.height);
            const sw = W / scale, sh = photoH / scale;
            const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, photoH);
            const grad = ctx.createLinearGradient(0, photoH - 140, 0, photoH);
            grad.addColorStop(0, 'rgba(26,22,17,0)');
            grad.addColorStop(1, 'rgba(26,22,17,0.95)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, photoH - 140, W, 140);
            resolve();
          };
          img.onerror = resolve;
          img.src = photos[selectedPhoto].url;
        });
      }

      try { await document.fonts.ready; } catch (e) {}

      ctx.fillStyle = '#D9B872';
      ctx.font = '600 22px "IBM Plex Mono", monospace';
      ctx.fillText('달동네 출판사 · LIFE BOOK', 56, photoH + 64);

      ctx.fillStyle = 'rgba(217,184,114,0.5)';
      ctx.fillRect(56, photoH + 84, 60, 2);

      ctx.fillStyle = '#EFE6D3';
      ctx.font = '700 42px "Noto Serif KR", serif';
      wrapCanvasText(ctx, title, 56, photoH + 150, W - 112, 54, 3);

      ctx.fillStyle = 'rgba(238,230,211,0.5)';
      ctx.font = '400 16px "Noto Sans KR", sans-serif';
      ctx.fillText('AI와 함께 쓴 나의 첫 페이지', 56, H - 56);

      generatedDataURL = shareCanvas.toDataURL('image/png');
      shareCardImg.src = generatedDataURL;
      shareCardEl.style.display = '';
    }

    makeShareCardBtn.addEventListener('click', () => { generateShareCard(); });

    downloadCardBtn.addEventListener('click', () => {
      if (!generatedDataURL) return;
      const a = document.createElement('a');
      a.href = generatedDataURL;
      a.download = 'project-m-first-page.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    shareCardBtn.addEventListener('click', async () => {
      const title = bookTitleInput.value.trim() || '제목 없는 첫 페이지';
      const caption = `${title} — 달동네 출판사로 쓴 나의 첫 페이지 #달동네출판사 #첫페이지`;
      if (navigator.share) {
        try {
          if (generatedDataURL && navigator.canShare) {
            const blob = await (await fetch(generatedDataURL)).blob();
            const file = new File([blob], 'project-m-first-page.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: '달동네 출판사', text: caption });
              return;
            }
          }
          await navigator.share({ title: '달동네 출판사', text: caption, url: location.href });
          return;
        } catch (e) { /* fall through to clipboard */ }
      }
      try {
        await navigator.clipboard.writeText(caption);
        shareNote.textContent = '공유 문구가 복사되었어요! 이미지와 함께 SNS에 올려보세요.';
      } catch (e) {
        shareNote.textContent = '#달동네출판사 #첫페이지 와 함께 공유해보세요';
      }
    });

    renderQuestion();
  })();

  // ---------- Cross-page hash highlight: e.g. arriving at products.html#book-lifebook ----------
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('book-card')) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('is-highlighted');
        setTimeout(() => target.classList.remove('is-highlighted'), 1800);
      }, 250);
    }
  }

  // ---------- B2B / group publishing inquiry (mailto handoff) ----------
  (function () {
    const orgEl     = document.getElementById('b2bOrg');
    const sizeEl    = document.getElementById('b2bSize');
    const contactEl = document.getElementById('b2bContact');
    const msgEl     = document.getElementById('b2bMessage');
    const submitBtn = document.getElementById('b2bSubmit');
    const successEl = document.getElementById('b2bSuccess');
    const rowOrg     = document.getElementById('rowOrg');
    const rowContact = document.getElementById('rowContact');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', () => {
      const org = orgEl.value.trim();
      const contact = contactEl.value.trim();
      rowOrg.classList.toggle('has-error', !org);
      rowContact.classList.toggle('has-error', !contact);
      if (!org || !contact) {
        successEl.classList.remove('is-shown');
        return;
      }
      const subject = encodeURIComponent(`[단체 출판 문의] ${org}`);
      const body = encodeURIComponent(
        `소속/단체명: ${org}\n예상 인원: ${sizeEl.value.trim() || '미입력'}\n연락처: ${contact}\n\n문의 내용:\n${msgEl.value.trim() || '미입력'}`
      );
      // TODO: 실제 운영 시 아래 이메일 주소를 담당 부서 메일 주소로 교체하세요.
      window.location.href = `mailto:hello@project-m.kr?subject=${subject}&body=${body}`;
      successEl.classList.add('is-shown');
    });
  })();

  // ---------- Pricing → Publish application (plan handoff via ?plan= + live summary) ----------
  (function () {
    const planSelect   = document.getElementById('applyPlan');
    const summaryPlan  = document.getElementById('summaryPlan');
    const summaryPrice = document.getElementById('summaryPrice');
    if (!planSelect) return;

    function updateSummary() {
      const opt = planSelect.options[planSelect.selectedIndex];
      summaryPlan.textContent = opt.value;
      summaryPrice.textContent = opt.getAttribute('data-price');
    }

    // Arriving from pricing.html?plan=... -> pre-select the matching option
    const params = new URLSearchParams(location.search);
    const incomingPlan = params.get('plan');
    if (incomingPlan) {
      const match = Array.from(planSelect.options).find(o => o.value === incomingPlan);
      if (match) planSelect.value = incomingPlan;
    }

    planSelect.addEventListener('change', updateSummary);
    updateSummary();

    // Publish application: mailto handoff
    const nameEl    = document.getElementById('applyName');
    const contactEl = document.getElementById('applyContact');
    const msgEl     = document.getElementById('applyMessage');
    const submitBtn = document.getElementById('applySubmit');
    const successEl = document.getElementById('applySuccess');
    const rowName    = document.getElementById('rowApplyName');
    const rowContact = document.getElementById('rowApplyContact');
    const applyPresets = document.getElementById('applyPresets');

    // AI 추천 답변 채우기: '전하고 싶은 말'에 톤별 프리셋 문장을 즉시 채워준다.
    if (applyPresets) {
      applyPresets.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tone = btn.getAttribute('data-tone');
          const preset = APPLY_MESSAGE_PRESETS[tone];
          if (!preset) return;
          msgEl.value = preset;
          msgEl.focus();
          btn.classList.add('is-flash');
          setTimeout(() => btn.classList.remove('is-flash'), 350);
        });
      });
    }

    submitBtn.addEventListener('click', () => {
      const name = nameEl.value.trim();
      const contact = contactEl.value.trim();
      rowName.classList.toggle('has-error', !name);
      rowContact.classList.toggle('has-error', !contact);
      if (!name || !contact) {
        successEl.classList.remove('is-shown');
        return;
      }
      const plan = planSelect.value;
      const price = planSelect.options[planSelect.selectedIndex].getAttribute('data-price');
      const subject = encodeURIComponent(`[출판 신청] ${plan} — ${name}`);
      const body = encodeURIComponent(
        `이름: ${name}\n연락처: ${contact}\n선택 구성: ${plan} (${price})\n\n전하고 싶은 말:\n${msgEl.value.trim() || '미입력'}`
      );
      // TODO: 실제 운영 시 아래 이메일 주소를 담당 부서 메일 주소로 교체하세요.
      window.location.href = `mailto:hello@project-m.kr?subject=${subject}&body=${body}`;
      successEl.classList.add('is-shown');
    });
  })();
