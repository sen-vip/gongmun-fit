const relatedList = document.getElementById('relatedList');
const attachList = document.getElementById('attachList');
const bodyItems = document.getElementById('bodyItems');
const resultPreview = document.getElementById('resultPreview');
const statusText = document.getElementById('statusText');

const DEFAULT_MAIN_SENTENCE = '2000학년도 OO을 다음과 같이 OO하고자 합니다.';
const RELATED_SAMPLE = 'OO과-0000(2020.00.00)';
const ATTACH_SAMPLE = 'OOO 1부.';

const bodyDefaults = [
  ['목적', ''],
  ['일시', '2000. 00. 00.(O) 00:00~00:00'],
  ['장소', ''],
  ['대상', ''],
  ['내용', ''],
  ['운영방법', ''],
  ['소요예산', '금0원'],
  ['산출근거', ''],
  ['업체명', ''],
  ['강사', ''],
  ['기대효과', ''],
  ['협조사항', ''],
  ['행정사항', ''],
  ['기타', '']
];

const hangulNums = ['가','나','다','라','마','바','사','아','자','차','카','타','파','하'];
let relatedCount = 0;
let attachCount = 0;

function createRelatedBox(index, value = RELATED_SAMPLE) {
  const input = document.createElement('input');
  input.className = 'input';
  input.type = 'text';
  input.dataset.type = 'related';
  input.placeholder = `관련 ${index}`;
  input.value = value;
  relatedList.appendChild(input);
}

function createAttachBox(index, value = ATTACH_SAMPLE) {
  const textarea = document.createElement('textarea');
  textarea.className = 'textarea autosize';
  textarea.dataset.type = 'attach';
  textarea.placeholder = `붙임 ${index}`;
  textarea.rows = 1;
  textarea.value = value;
  textarea.addEventListener('input', () => autoResize(textarea));
  attachList.appendChild(textarea);
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
    createAttachBox(attachCount, ATTACH_SAMPLE);
  }
}

function renderBodyItems() {
  bodyDefaults.forEach(([label, value], idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';

    const labelEl = document.createElement('label');
    labelEl.textContent = `${hangulNums[idx]}. ${label}:`;

    const textarea = document.createElement('textarea');
    textarea.className = 'textarea autosize';
    textarea.dataset.type = 'body';
    textarea.dataset.label = label;
    textarea.value = value;
    textarea.placeholder = label === '업체명' ? '(주)OO' : label;
    textarea.rows = 1;
    textarea.addEventListener('input', () => autoResize(textarea));
    textarea.addEventListener('blur', () => {
      if (label === '소요예산') {
        normalizeMoneyInput(textarea);
      } else {
        textarea.value = formatNumbersWithUnits(textarea.value);
      }
      autoResize(textarea);
    });

    wrap.appendChild(labelEl);
    wrap.appendChild(textarea);
    bodyItems.appendChild(wrap);
    autoResize(textarea);
  });
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
  if (/^[O0\s.()\-/:~]+$/i.test(raw)) return true;
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
  return false;
}

function cleanAttachment(value) {
  let text = normalizeText(value);
  text = text.replace(/^\d+\s*[.)]\s*/, '').trim();
  if (text && !/[.]$/.test(text)) text += '.';
  return text;
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

function formatMoney(label, value) {
  if (label !== '소요예산') return value;
  const amount = extractAmount(value);
  if (!amount || amount <= 0) return value;
  const cleaned = `금${amount.toLocaleString('ko-KR')}원`;
  return `${cleaned}(${numberToKoreanMoney(amount)})`;
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

function generateDocument() {
  const lines = [];
  let mainNo = 1;

  document.querySelectorAll('textarea[data-label="소요예산"]').forEach(normalizeMoneyInput);
  document.querySelectorAll('textarea[data-type="body"]').forEach(input => {
    if (input.dataset.label !== '소요예산') input.value = formatNumbersWithUnits(input.value);
  });
  document.querySelectorAll('.autosize').forEach(autoResize);

  const related = getValues('input[data-type="related"]');
  const mainSentence = normalizeText(document.getElementById('mainSentence').value) || DEFAULT_MAIN_SENTENCE;
  const body = Array.from(document.querySelectorAll('textarea[data-type="body"]'))
    .map(input => ({ label: input.dataset.label, value: cleanMultiline(input.value) }))
    .filter(item => !isEmptyValue(item.value))
    .map(item => ({
      ...item,
      value: item.label === '소요예산'
        ? formatMoney(item.label, item.value)
        : formatNumbersWithUnits(item.value)
    }));
  const attachments = getValues('textarea[data-type="attach"]').map(cleanAttachment).filter(Boolean);

  if (related.length === 0) {
    // 관련이 없을 때는 본문 문장에 큰 번호를 붙이지 않고,
    // 본문 항목을 1, 2, 3...으로 승격한다.
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
        lines.push(`  ${hangulNums[idx]}. ${item}`);
      });
      mainNo += 1;
    }

    lines.push(`${mainNo}. ${mainSentence}`);

    if (body.length === 1) {
      mainNo += 1;
      lines.push(formatMainLine(mainNo, body[0].label, body[0].value));
    } else if (body.length > 1) {
      body.forEach((item, idx) => {
        lines.push(formatSubLine(hangulNums[idx], item.label, item.value));
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
      const prefix = idx === 0 ? '붙임  ' : '      ';
      const suffix = idx === attachments.length - 1 ? '  끝.' : '';
      lines.push(`${prefix}${idx + 1}. ${removeFinalEnd(item)}${suffix}`);
    });
  }

  const result = lines.join('\n');
  resultPreview.textContent = result;
  statusText.textContent = '생성 완료';
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

async function copyResult() {
  const text = resultPreview.textContent || generateDocument();
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    statusText.textContent = '복사 완료';
  } catch (error) {
    statusText.textContent = '복사 실패: 직접 선택해 복사하세요';
  }
}

function downloadTxt() {
  const text = resultPreview.textContent || generateDocument();
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
  statusText.textContent = 'TXT 저장 완료';
}


function resetForm() {
  const ok = window.confirm('작성 중인 내용을 모두 초기화할까요?');
  if (!ok) return;

  document.getElementById('docTitle').value = '2000학년도 OO 실시';
  document.getElementById('mainSentence').value = DEFAULT_MAIN_SENTENCE;

  relatedList.innerHTML = '';
  attachList.innerHTML = '';
  bodyItems.innerHTML = '';
  relatedCount = 0;
  attachCount = 0;

  addRelated(1);
  addAttach(2);
  renderBodyItems();
  document.querySelectorAll('.autosize').forEach(autoResize);
  generateDocument();
  statusText.textContent = '초기화 완료';
}

document.getElementById('addRelatedBtn').addEventListener('click', () => addRelated(1));
document.getElementById('addAttachBtn').addEventListener('click', () => addAttach(2));
document.getElementById('generateBtn').addEventListener('click', generateDocument);
document.getElementById('copyBtn').addEventListener('click', copyResult);
document.getElementById('downloadBtn').addEventListener('click', downloadTxt);
document.getElementById('resetBtn').addEventListener('click', resetForm);
document.getElementById('mainSentence').addEventListener('input', e => autoResize(e.target));

addRelated(1);
addAttach(2);
renderBodyItems();
autoResize(document.getElementById('mainSentence'));
generateDocument();

// v1.7.4: sticky bar shadow + quick scroll-to-top buttons
function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const topBar = document.getElementById('topBar');
const topBarBtn = document.getElementById('topBarBtn');
const floatingTopBtn = document.getElementById('floatingTopBtn');

function updateTopButtons() {
  const scrolled = window.scrollY > 80;
  if (topBar) topBar.classList.toggle('is-scrolled', scrolled);
  if (floatingTopBtn) floatingTopBtn.classList.toggle('is-visible', scrolled);
}

if (topBarBtn) topBarBtn.addEventListener('click', scrollToPageTop);
if (floatingTopBtn) floatingTopBtn.addEventListener('click', scrollToPageTop);
window.addEventListener('scroll', updateTopButtons, { passive: true });
updateTopButtons();
