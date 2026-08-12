const relatedList = document.getElementById('relatedList');
const attachList = document.getElementById('attachList');
const bodyItems = document.getElementById('bodyItems');
const resultPreview = document.getElementById('resultPreview');
const statusText = document.getElementById('statusText');
const addBodyItemBtn = document.getElementById('addBodyItemBtn');
const bodyAddLimitText = document.getElementById('bodyAddLimitText');
const resultPanel = document.querySelector('.result-panel');
const emptyPreview = document.getElementById('emptyPreview');
const toast = document.getElementById('toast');
const generateBtn = document.getElementById('generateBtn');
const composeModeBtn = document.getElementById('composeModeBtn');
const pasteModeBtn = document.getElementById('pasteModeBtn');
const composeMode = document.getElementById('composeMode');
const pasteMode = document.getElementById('pasteMode');
const pasteInput = document.getElementById('pasteInput');
const pasteResetBtn = document.getElementById('pasteResetBtn');
const resultDescription = document.getElementById('resultDescription');
const sourceTitle = document.getElementById('sourceTitle');
const sourceDescription = document.getElementById('sourceDescription');
const actionHelp = document.getElementById('actionHelp');

let hasGeneratedResult = false;
let toastTimer = null;
let activeMode = 'paste';

const DEFAULT_MAIN_SENTENCE = '2000학년도 OO을 다음과 같이 OO하고자 합니다.';
const RELATED_SAMPLE = 'OO과-0000(2020. 00. 00.)';
const ATTACH_SAMPLE_VALUES = ['계획(안)', '견적서'];

const itemMarkers = [
  '가','나','다','라','마','바','사','아','자','차','카','타','파','하',
  '거','너','더','러','머','버','서','어','저','처','커','터','퍼','허',
  '고','노','도','로','모','보','소','오','조','초','코','토','포','호'
];

const bodyDefaults = [
  { label: '일시', value: '2000. 00. 00.(O) 00:00~00:00' },
  { label: '장소', value: '' },
  { label: '대상', value: '' },
  { label: '내용', value: '' },
  { label: '금액(소요예산)', value: '금0원' },
  { label: '산출근거', value: '' },
  { label: '업체명', value: '(주)OO' },
  { label: '', value: '', custom: true }
];

let relatedCount = 0;
let attachCount = 0;
let visibleBodyCount = bodyDefaults.length;

function createRelatedBox(index, value = RELATED_SAMPLE) {
  const input = document.createElement('input');
  input.className = 'input';
  input.type = 'text';
  input.dataset.type = 'related';
  input.placeholder = `관련 ${index}`;
  input.value = value;
  relatedList.appendChild(input);
}

function createAttachBox(index, value = '') {
  const row = document.createElement('div');
  row.className = 'attach-row';

  const marker = document.createElement('div');
  marker.className = 'attach-marker';
  marker.textContent = `${index}.`;

  const textarea = document.createElement('textarea');
  textarea.className = 'textarea autosize';
  textarea.dataset.type = 'attach';
  textarea.placeholder = index === 1 ? '계획(안)' : index === 2 ? '견적서' : '붙임명 입력';
  textarea.rows = 1;
  textarea.value = value;
  textarea.addEventListener('input', () => autoResize(textarea));

  row.appendChild(marker);
  row.appendChild(textarea);
  attachList.appendChild(row);
  autoResize(textarea);
}

function addRelated(n = 1) {
  for (let i = 0; i < n; i++) {
    relatedCount += 1;
    createRelatedBox(relatedCount, RELATED_SAMPLE);
  }
}

function addAttach(n = 2) {
  for (let i = 0; i < n; i++) {
    attachCount += 1;
    const sample = ATTACH_SAMPLE_VALUES[attachCount - 1] || '';
    createAttachBox(attachCount, sample);
  }
}

function getBodyConfig(index) {
  if (index < bodyDefaults.length) return bodyDefaults[index];
  return { label: '', value: '', custom: true };
}

function createBodyItem(index) {
  const config = getBodyConfig(index);
  let labelInput = null;
  const marker = itemMarkers[index];
  const wrap = document.createElement('div');
  wrap.className = config.custom ? 'field custom-field' : 'field';
  wrap.dataset.bodyIndex = String(index);

  const markerEl = document.createElement('span');
  markerEl.className = 'item-marker';
  markerEl.textContent = `${marker}.`;
  wrap.appendChild(markerEl);

  if (config.custom) {
    labelInput = document.createElement('input');
    labelInput.className = 'input body-label-input';
    labelInput.type = 'text';
    labelInput.dataset.type = 'bodyLabel';
    labelInput.placeholder = '직접 입력';
    labelInput.value = config.label || '';
    wrap.appendChild(labelInput);
  } else {
    const labelEl = document.createElement('label');
    labelEl.className = 'item-label';
    labelEl.textContent = `${config.label}:`;
    wrap.appendChild(labelEl);
  }

  const textarea = document.createElement('textarea');
  textarea.className = 'textarea autosize';
  textarea.dataset.type = 'body';
  textarea.dataset.label = config.label || '';
  textarea.value = config.value || '';
  textarea.placeholder = config.custom ? '내용을 입력하세요' : config.label;
  textarea.rows = 1;
  textarea.addEventListener('input', () => {
    autoResize(textarea);
    updateMoneyPreview(textarea);
  });
  textarea.addEventListener('blur', () => {
    const label = getBodyLabel(textarea);
    if (isMoneyLabel(label)) {
      normalizeMoneyInput(textarea);
    } else {
      textarea.value = formatNumbersWithUnits(textarea.value);
    }
    autoResize(textarea);
    updateMoneyPreview(textarea);
  });
  wrap.appendChild(textarea);

  const moneyPreview = document.createElement('div');
  moneyPreview.className = 'money-preview-badge';
  moneyPreview.setAttribute('aria-live', 'polite');
  moneyPreview.hidden = true;
  wrap.appendChild(moneyPreview);

  if (labelInput) {
    labelInput.addEventListener('input', () => updateMoneyPreview(textarea));
  }

  bodyItems.appendChild(wrap);
  autoResize(textarea);
  updateMoneyPreview(textarea);
}

function renderBodyItems() {
  bodyItems.innerHTML = '';
  for (let i = 0; i < visibleBodyCount && i < itemMarkers.length; i++) {
    createBodyItem(i);
  }
  updateBodyAddButton();
}

function addBodyItem() {
  if (visibleBodyCount >= itemMarkers.length) return;
  visibleBodyCount += 1;
  createBodyItem(visibleBodyCount - 1);
  updateBodyAddButton();
  const last = bodyItems.querySelector('.field:last-child');
  const focusTarget = last?.querySelector('.body-label-input') || last?.querySelector('textarea');
  if (focusTarget) focusTarget.focus();
}

function updateBodyAddButton() {
  const isMax = visibleBodyCount >= itemMarkers.length;
  if (addBodyItemBtn) addBodyItemBtn.hidden = isMax;
  if (bodyAddLimitText) bodyAddLimitText.hidden = !isMax;
}

function getBodyLabel(textarea) {
  const wrap = textarea.closest('.field');
  const inputLabel = wrap?.querySelector('.body-label-input')?.value;
  const label = normalizeText(inputLabel || textarea.dataset.label || '');
  return label || '기타';
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.max(42, el.scrollHeight)}px`;
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanMultiline(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function compactPlaceholder(value) {
  return normalizeText(value)
    .replace(/[.:()\-\/~/~]/g, '')
    .replace(/\s/g, '')
    .toUpperCase();
}

function isEmptyValue(value) {
  const raw = normalizeText(value);
  const compact = compactPlaceholder(raw);
  if (!raw) return true;
  if (/^[O0\s.()\-\/:~]+$/i.test(raw)) return true;
  if (/^OO+$/i.test(compact)) return true;
  if (/^0+$/.test(compact)) return true;
  if (compact === 'OOOOOOOOO0000') return true;
  if (compact === '20000000O00000000') return true;
  if (/^O+과0+2020+$/i.test(compact)) return true;
  if (/^O+과0+20200000$/i.test(compact)) return true;
  if (compact === '금0원') return true;
  if (/^금0+원$/.test(compact)) return true;
  if (/^O+1부$/i.test(compact)) return true;
  if (/^O+1부끝$/i.test(compact)) return true;
  if (compact === '주OO') return true;
  if (compact === '강사') return true;
  return false;
}

function cleanAttachment(value) {
  return normalizeText(value)
    .replace(/^\d+\s*[.)]\s*/, '')
    .replace(/\s*끝\.?\s*$/g, '')
    .trim();
}

function formatAttachment(value) {
  let text = cleanAttachment(value);
  if (!text) return '';

  if (/\d+\s*부\.?$/.test(text)) {
    return text.replace(/\.?$/, '.');
  }

  text = text.replace(/[.]$/, '').trim();
  return `${text} 1부.`;
}

function normalizeMoneyInput(textarea) {
  const amount = extractAmount(textarea.value);
  if (!amount || amount <= 0) {
    const raw = normalizeText(textarea.value);
    if (!raw || isEmptyValue(raw)) textarea.value = '금0원';
    return;
  }
  textarea.value = `금${amount.toLocaleString('ko-KR')}원`;
}

function isMoneyLabel(label) {
  const compact = normalizeText(label).replace(/\s/g, '');
  return compact === '소요예산' || compact === '금액(소요예산)' || compact.includes('소요예산');
}

function formatMoney(label, value) {
  if (!isMoneyLabel(label)) return value;
  const amount = extractAmount(value);
  if (!amount || amount <= 0) return value;
  return formatMoneyDisplay(amount);
}

function formatMoneyDisplay(amount) {
  return `금${amount.toLocaleString('ko-KR')}원(${numberToKoreanMoney(amount)})`;
}

function updateMoneyPreview(textarea) {
  const wrap = textarea.closest('.field');
  const badge = wrap?.querySelector('.money-preview-badge');
  if (!badge) return;
  const label = getBodyLabel(textarea);
  const amount = extractAmount(textarea.value);
  if (isMoneyLabel(label) && amount > 0) {
    badge.textContent = formatMoneyDisplay(amount);
    badge.hidden = false;
    wrap.classList.add('has-money-preview');
  } else {
    badge.textContent = '';
    badge.hidden = true;
    wrap.classList.remove('has-money-preview');
  }
}

function updateAllMoneyPreviews() {
  document.querySelectorAll('textarea[data-type="body"]').forEach(updateMoneyPreview);
}

function extractAmount(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!digits) return 0;
  return Number(digits);
}

function numberToKoreanMoney(num) {
  if (!num) return '금영원';
  const units = ['', '만', '억', '조'];
  const smallUnits = ['', '십', '백', '천'];
  const nums = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const parts = [];
  let n = num;
  let unitIndex = 0;

  while (n > 0) {
    const chunk = n % 10000;
    if (chunk > 0) {
      let chunkText = '';
      const digits = String(chunk).padStart(4, '0').split('').map(Number);
      digits.forEach((digit, idx) => {
        if (digit > 0) {
          const pos = 3 - idx;
          chunkText += nums[digit] + smallUnits[pos];
        }
      });
      parts.unshift(chunkText + units[unitIndex]);
    }
    n = Math.floor(n / 10000);
    unitIndex += 1;
  }
  return `금${parts.join('')}원`;
}

function formatNumbersWithUnits(text) {
  const units = '원|명분|명|개|부|장|매|회|시간|분|대|권|건|식|종|학급|교|점|세트|SET|박스|상자|봉|통|롤|벌|개소|기관|과정';
  return String(text || '').replace(new RegExp('(\\d[\\d,]{3,})(\\s*)(' + units + ')', 'g'), (match, number, space, unit) => {
    const digits = number.replace(/,/g, '');
    if (digits.length < 4) return match;
    return Number(digits).toLocaleString('ko-KR') + space + unit;
  });
}

function getValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .map(input => input.value)
    .filter(value => !isEmptyValue(value));
}

function formatSubLine(marker, label, value) {
  return `  ${marker}. ${label}: ${value}`;
}

function formatMainLine(number, label, value) {
  return `${number}. ${label}: ${value}`;
}

function getResultText() {
  if (!resultPreview) return '';
  return typeof resultPreview.value === 'string' ? resultPreview.value : resultPreview.textContent || '';
}

function setResultText(text) {
  if (!resultPreview) return;
  if (typeof resultPreview.value === 'string') resultPreview.value = text;
  else resultPreview.textContent = text;
}

function setEmptyPreview(title = '아직 결과가 없어요', description = '항목을 입력하고 공문 생성하기를 눌러보세요') {
  hasGeneratedResult = false;
  setResultText('');
  if (resultPanel) resultPanel.classList.add('is-empty');
  if (emptyPreview) {
    const titleEl = emptyPreview.querySelector('.empty-preview-title');
    const descEl = emptyPreview.querySelector('.empty-preview-desc');
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = description;
  }
  setStatus(activeMode === 'paste' ? '정리 전' : '생성 전');
}

function showResultPreview(text) {
  hasGeneratedResult = true;
  setResultText(text);
  if (resultPanel) resultPanel.classList.remove('is-empty');
}

function setStatus(message, tone = 'neutral') {
  if (!statusText) return;
  statusText.textContent = message;
  statusText.classList.remove('is-success', 'is-error');
  if (tone === 'success') statusText.classList.add('is-success');
  if (tone === 'error') statusText.classList.add('is-error');
}

function showToast(message, tone = 'success') {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('is-success', 'is-error');
  if (tone === 'success') toast.classList.add('is-success');
  if (tone === 'error') toast.classList.add('is-error');
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 1800);
}

function scrollToResultOnMobile() {
  if (!window.matchMedia || !window.matchMedia('(max-width: 960px)').matches) return;
  const target = document.querySelector('.result-panel');
  if (!target) return;
  window.requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function generateDocument() {
  const lines = [];
  let mainNo = 1;

  document.querySelectorAll('textarea[data-type="body"]').forEach(input => {
    const label = getBodyLabel(input);
    if (isMoneyLabel(label)) normalizeMoneyInput(input);
    else input.value = formatNumbersWithUnits(input.value);
  });
  document.querySelectorAll('.autosize').forEach(autoResize);

  const related = getValues('input[data-type="related"]');
  const mainSentence = normalizeText(document.getElementById('mainSentence').value) || DEFAULT_MAIN_SENTENCE;
  const body = Array.from(document.querySelectorAll('textarea[data-type="body"]'))
    .map(input => ({ label: getBodyLabel(input), value: cleanMultiline(input.value) }))
    .filter(item => !isEmptyValue(item.value))
    .map(item => ({
      ...item,
      value: isMoneyLabel(item.label)
        ? formatMoney(item.label, item.value)
        : formatNumbersWithUnits(item.value)
    }));
  const attachments = getValues('textarea[data-type="attach"]').map(formatAttachment).filter(Boolean);

  if (related.length === 0) {
    lines.push(mainSentence);
    body.forEach((item, idx) => {
      lines.push(formatMainLine(idx + 1, item.label, item.value));
    });
  } else {
    if (related.length === 1) {
      lines.push(`${mainNo}. 관련: ${related[0]}`);
      mainNo += 1;
    } else {
      lines.push(`${mainNo}. 관련`);
      related.forEach((item, idx) => {
        lines.push(`  ${itemMarkers[idx] || `${idx + 1})`}. ${item}`);
      });
      mainNo += 1;
    }
    lines.push(`${mainNo}. ${mainSentence}`);

    if (body.length === 1) {
      mainNo += 1;
      lines.push(formatMainLine(mainNo, body[0].label, body[0].value));
    } else if (body.length > 1) {
      body.forEach((item, idx) => {
        lines.push(formatSubLine(itemMarkers[idx] || `${idx + 1})`, item.label, item.value));
      });
    }
  }

  if (attachments.length === 0) {
    if (lines.length) {
      const last = lines.length - 1;
      lines[last] = finishLine(lines[last]);
    }
  } else if (attachments.length === 1) {
    lines.push('');
    lines.push(`붙임  ${removeFinalEnd(attachments[0])}  끝.`);
  } else {
    lines.push('');
    attachments.forEach((item, idx) => {
      const prefix = idx === 0 ? '붙임  ' : '        ';
      const suffix = idx === attachments.length - 1 ? '  끝.' : '';
      lines.push(`${prefix}${idx + 1}. ${removeFinalEnd(item)}${suffix}`);
    });
  }

  const result = lines.join('\n');
  showResultPreview(result);
  setStatus('생성 완료');
  updateAllMoneyPreviews();
  scrollToResultOnMobile();
  return result;
}

function removeFinalEnd(text) {
  return String(text || '').replace(/\s*끝\.?\s*$/g, '').trim();
}

function finishLine(line) {
  const trimmed = removeFinalEnd(line).replace(/\s+$/g, '');
  if (/[.]$/.test(trimmed)) return `${trimmed}  끝.`;
  return `${trimmed}.  끝.`;
}

function finishDocument(text) {
  const trimmed = String(text || '').replace(/\s+$/g, '');
  if (!trimmed) return '';
  return finishLine(trimmed);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renumberPastedText() {
  const raw = String(pasteInput?.value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!raw.trim()) {
    setEmptyPreview('정리할 내용이 없어요', '작성한 공문 내용을 왼쪽에 붙여넣어 주세요');
    setStatus('입력 필요', 'error');
    showToast('정리할 내용을 먼저 붙여넣어 주세요', 'error');
    pasteInput?.focus();
    return '';
  }

  const markerPattern = itemMarkers.map(escapeRegExp).join('|');
  // 공문 항목 체계의 넷째 단계까지 구분한다: 1. → 가. → 1) → 가)
  // 번호 뒤 공백이 없거나 항목 내용이 비어 있어도 순번으로 인식한다.
  const koreanDotPattern = new RegExp(`^(\\s*)(${markerPattern})\\s*[.．](?:\\s+|$|(?=[가-힣A-Za-z0-9]))`);
  const koreanParenPattern = new RegExp(`^(\\s*)(${markerPattern})\\s*[)](?:\\s+|$|(?=[가-힣A-Za-z0-9]))`);
  // 1~99까지만 순번으로 봐서 '2026. 8. 20.' 같은 날짜는 건드리지 않는다.
  const numberDotPattern = /^(\s*)(\d{1,2})\s*[.．](?:\s+|$|(?=[가-힣A-Za-z]))/;
  const numberParenPattern = /^(\s*)(\d{1,2})\s*[)](?:\s+|$|(?=[가-힣A-Za-z]))/;
  const attachmentStartPattern = /^(\s*)(붙임\s+)(\d{1,2})\s*(?:[)](?:\s+|$)|[.．](?:\s+|$|(?=[가-힣A-Za-z])))/;

  let bodyNumber = 1;
  let koreanDotIndex = 0;
  let subNumber = 1;
  let koreanParenIndex = 0;
  let attachmentNumber = 1;
  let inAttachmentBlock = false;
  let bodyNumberCount = 0;
  let koreanDotCount = 0;
  let subNumberCount = 0;
  let koreanParenCount = 0;
  let attachmentCount = 0;

  const resultLines = raw.split('\n').map(line => {
    // '8. 20.'처럼 월·일로 시작하는 날짜형 줄은 본문 숫자 순번으로 처리하지 않는다.
    const isShortDateLine = /^\s*\d{1,2}\s*[.．]\s*\d{1,2}\s*[.．]/.test(line);

    const attachmentStart = line.match(attachmentStartPattern);
    if (attachmentStart) {
      inAttachmentBlock = true;
      const content = line.slice(attachmentStart[0].length);
      const next = `붙임  ${attachmentNumber}. ${content}`;
      attachmentNumber += 1;
      attachmentCount += 1;
      return next;
    }

    if (inAttachmentBlock) {
      const attachmentItem = line.match(numberDotPattern);
      if (attachmentItem) {
        const content = line.slice(attachmentItem[0].length);
        const next = `        ${attachmentNumber}. ${content}`;
        attachmentNumber += 1;
        attachmentCount += 1;
        return next;
      }
      return line;
    }

    const bodyItem = isShortDateLine ? null : line.match(numberDotPattern);
    if (bodyItem) {
      const content = line.slice(bodyItem[0].length);
      const next = `${bodyNumber}. ${content}`;
      bodyNumber += 1;
      bodyNumberCount += 1;
      // 새 상위 숫자 문단이 시작되면 모든 하위 순번을 처음부터 다시 센다.
      koreanDotIndex = 0;
      subNumber = 1;
      koreanParenIndex = 0;
      return next;
    }

    const koreanDotItem = line.match(koreanDotPattern);
    if (koreanDotItem) {
      const originalMarker = koreanDotItem[2];
      const content = line.slice(koreanDotItem[0].length);
      const nextMarker = itemMarkers[koreanDotIndex] || originalMarker;
      koreanDotIndex += 1;
      koreanDotCount += 1;
      subNumber = 1;
      koreanParenIndex = 0;
      return `  ${nextMarker}. ${content}`;
    }

    const subNumberItem = line.match(numberParenPattern);
    if (subNumberItem) {
      const content = line.slice(subNumberItem[0].length);
      const next = `    ${subNumber}) ${content}`;
      subNumber += 1;
      subNumberCount += 1;
      koreanParenIndex = 0;
      return next;
    }

    const koreanParenItem = line.match(koreanParenPattern);
    if (koreanParenItem) {
      const originalMarker = koreanParenItem[2];
      const content = line.slice(koreanParenItem[0].length);
      const nextMarker = itemMarkers[koreanParenIndex] || originalMarker;
      koreanParenIndex += 1;
      koreanParenCount += 1;
      return `      ${nextMarker}) ${content}`;
    }

    return line;
  });

  if (attachmentCount === 1) {
    const onlyAttachmentIndex = resultLines.findIndex(line => /^붙임  1[.]\s*/.test(line));
    if (onlyAttachmentIndex >= 0) {
      resultLines[onlyAttachmentIndex] = resultLines[onlyAttachmentIndex].replace(/^붙임  1[.]\s*/, '붙임  ');
    }
  }

  const result = finishDocument(resultLines.join('\n'));
  const totalCount = bodyNumberCount + koreanDotCount + subNumberCount + koreanParenCount + attachmentCount;
  showResultPreview(result);

  if (totalCount > 0) {
    const parts = [];
    if (bodyNumberCount) parts.push(`본문 숫자 ${bodyNumberCount}`);
    if (koreanDotCount) parts.push(`가나다 ${koreanDotCount}`);
    if (subNumberCount) parts.push(`1) 순번 ${subNumberCount}`);
    if (koreanParenCount) parts.push(`가) 순번 ${koreanParenCount}`);
    if (attachmentCount) parts.push(`붙임 ${attachmentCount}`);
    setStatus(`✓ 순번 정리 완료 · ${parts.join(' · ')}`, 'success');
    showToast(`✓ 순번 ${totalCount}개를 정리했어요`, 'success');
  } else {
    setStatus('정리할 순번 없음');
    showToast('정리할 1. / 가. / 1) / 가) 항목이 없어요', 'success');
  }
  scrollToResultOnMobile();
  return result;
}

function generateActiveMode() {
  return activeMode === 'paste' ? renumberPastedText() : generateDocument();
}

function switchMode(mode) {
  if (mode !== 'compose' && mode !== 'paste') return;
  activeMode = mode;
  const isCompose = mode === 'compose';

  composeMode.hidden = !isCompose;
  pasteMode.hidden = isCompose;
  composeModeBtn.classList.toggle('is-active', isCompose);
  pasteModeBtn.classList.toggle('is-active', !isCompose);
  composeModeBtn.setAttribute('aria-selected', String(isCompose));
  pasteModeBtn.setAttribute('aria-selected', String(!isCompose));
  generateBtn.textContent = isCompose ? '✨ 공문 생성하기' : '✨ 순번 정리하기';
  if (sourceTitle) sourceTitle.textContent = isCompose ? '새 공문 작성' : '공문 원문';
  if (sourceDescription) sourceDescription.textContent = isCompose ? '항목을 칸칸이 입력하면 빈 항목을 제외하고 순번을 자동으로 붙입니다.' : '이미 작성한 공문을 그대로 붙여넣으세요. 순번과 들여쓰기를 다시 맞춰드립니다.';
  if (actionHelp) actionHelp.textContent = isCompose ? '입력한 항목을 모아 공문 형태로 생성합니다.' : '1. → 가. → 1) → 가) 순번과 들여쓰기를 한 번에 정리합니다.';
  if (resultDescription) {
    resultDescription.textContent = isCompose ? '생성된 공문을 직접 수정한 뒤 복사하거나 저장하세요.' : '정리된 결과를 직접 수정한 뒤 복사하거나 저장하세요.';
  }

  if (isCompose) {
    setEmptyPreview('아직 결과가 없어요', '항목을 입력하고 공문 생성하기를 눌러보세요');
  } else {
    setEmptyPreview('아직 정리한 결과가 없어요', '공문을 붙여넣고 순번 정리하기를 눌러보세요');
    window.requestAnimationFrame(() => pasteInput?.focus());
  }
}

async function copyResult() {
  const currentResult = getResultText();
  const text = hasGeneratedResult && currentResult.trim()
    ? currentResult
    : generateActiveMode();
  if (!text || !text.trim()) return;

  try {
    await navigator.clipboard.writeText(text);
    setStatus('✓ 복사 완료', 'success');
    showToast('✓ 복사됐어요', 'success');
  } catch (error) {
    setStatus('복사 실패: 직접 선택해 복사하세요', 'error');
    showToast('복사에 실패했어요', 'error');
  }
}

function downloadTxt() {
  const currentResult = getResultText();
  const text = hasGeneratedResult && currentResult.trim()
    ? currentResult
    : generateActiveMode();
  if (!text || !text.trim()) return;

  const title = normalizeText(document.getElementById('docTitle').value) || '2000학년도 OO 실시';
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus('✓ TXT 저장 완료', 'success');
  showToast('✓ TXT 저장됐어요', 'success');
}

function resetForm() {
  const ok = window.confirm('작성 중인 내용을 모두 초기화할까요?');
  if (!ok) return;

  document.getElementById('docTitle').value = '2000학년도 OO 실시';
  document.getElementById('mainSentence').value = DEFAULT_MAIN_SENTENCE;
  if (pasteInput) pasteInput.value = '';

  relatedList.innerHTML = '';
  attachList.innerHTML = '';
  bodyItems.innerHTML = '';
  relatedCount = 0;
  attachCount = 0;
  visibleBodyCount = bodyDefaults.length;
  addRelated(1);
  addAttach(2);
  renderBodyItems();
  document.querySelectorAll('.autosize').forEach(autoResize);
  updateAllMoneyPreviews();
  setEmptyPreview('초기화했어요', activeMode === 'paste' ? '공문을 붙여넣고 순번 정리하기를 눌러보세요' : '항목을 입력하고 공문 생성하기를 눌러보세요');
  setStatus('초기화 완료');
}

function resetPasteInput() {
  if (!pasteInput) return;
  if (pasteInput.value.trim()) {
    const ok = window.confirm('붙여넣은 내용을 지울까요?');
    if (!ok) return;
  }
  pasteInput.value = '';
  setEmptyPreview('붙여넣기 내용을 지웠어요', '공문을 붙여넣고 순번 정리하기를 눌러보세요');
  setStatus('초기화 완료');
  pasteInput.focus();
}

document.getElementById('addRelatedBtn').addEventListener('click', () => addRelated(1));
document.getElementById('addAttachBtn').addEventListener('click', () => addAttach(2));
generateBtn.addEventListener('click', generateActiveMode);
document.getElementById('copyBtn').addEventListener('click', copyResult);
document.getElementById('downloadBtn').addEventListener('click', downloadTxt);
document.getElementById('resetBtn').addEventListener('click', resetForm);
document.getElementById('mainSentence').addEventListener('input', e => autoResize(e.target));
if (addBodyItemBtn) addBodyItemBtn.addEventListener('click', addBodyItem);
if (composeModeBtn) composeModeBtn.addEventListener('click', () => switchMode('compose'));
if (pasteModeBtn) pasteModeBtn.addEventListener('click', () => switchMode('paste'));
if (pasteResetBtn) pasteResetBtn.addEventListener('click', resetPasteInput);

if (resultPreview) {
  resultPreview.addEventListener('input', () => {
    if (!hasGeneratedResult) return;
    setStatus('직접 수정 중 · 복사/TXT에 반영');
  });
}

addRelated(1);
addAttach(2);
renderBodyItems();
autoResize(document.getElementById('mainSentence'));
updateAllMoneyPreviews();
switchMode('paste');

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const topBar = document.getElementById('topBar');
const floatingTopBtn = document.getElementById('floatingTopBtn');
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const helpCloseButtons = document.querySelectorAll('[data-close-help]');
let helpTrigger = null;

function openHelp() {
  if (!helpModal) return;
  helpTrigger = document.activeElement;
  helpModal.hidden = false;
  document.body.classList.add('modal-open');
  helpModal.querySelector('.help-close-btn')?.focus();
}

function closeHelp() {
  if (!helpModal || helpModal.hidden) return;
  helpModal.hidden = true;
  document.body.classList.remove('modal-open');
  if (helpTrigger instanceof HTMLElement) helpTrigger.focus();
}

function updateTopButtons() {
  const scrolled = window.scrollY > 80;
  if (topBar) topBar.classList.toggle('is-scrolled', scrolled);
  if (floatingTopBtn) floatingTopBtn.classList.toggle('is-visible', scrolled);
}

if (helpBtn) helpBtn.addEventListener('click', openHelp);
helpCloseButtons.forEach(button => button.addEventListener('click', closeHelp));
if (helpModal) {
  helpModal.addEventListener('click', event => {
    if (event.target === helpModal) closeHelp();
  });
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && helpModal && !helpModal.hidden) closeHelp();
});
if (floatingTopBtn) floatingTopBtn.addEventListener('click', scrollToPageTop);
window.addEventListener('scroll', updateTopButtons, { passive: true });
updateTopButtons();
