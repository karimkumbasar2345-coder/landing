let parsedData = null;
let previousView = 'today';

const MONTHS_RU = { 'янв':1,'фев':2,'мар':3,'апр':4,'мая':5,'май':5,'июн':6,'июл':7,'авг':8,'сен':9,'окт':10,'ноя':11,'дек':12 };
const MONTHS_EN = { 'jan':1,'feb':2,'mar':3,'apr':4,'may':5,'jun':6,'jul':7,'aug':8,'sep':9,'oct':10,'nov':11,'dec':12 };

function extractText(msg) {
  if (typeof msg.text === 'string') return msg.text;
  if (Array.isArray(msg.text)) {
    return msg.text.map(t => {
      if (typeof t === 'string') return t;
      if (t && typeof t === 'object' && typeof t.text === 'string') return t.text;
      return '';
    }).join('');
  }
  return '';
}

function findDates(text) {
  const results = [];
  const seen = new Set();
  const push = (d) => {
    const k = dateKey(d);
    if (!seen.has(k)) { seen.add(k); results.push(d); }
  };
  let m;
  const ruRegex = /(\d{1,2})\s*(январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-я]*/gi;
  while ((m = ruRegex.exec(text)) !== null) {
    const month = MONTHS_RU[m[2].slice(0, 3).toLowerCase()];
    if (month) push({ day: parseInt(m[1]), month, raw: m[0] });
  }
  const enRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/gi;
  while ((m = enRegex.exec(text)) !== null) {
    const month = MONTHS_EN[m[1].slice(0, 3).toLowerCase()];
    if (month) push({ day: parseInt(m[2]), month, raw: m[0] });
  }
  const ruRegex2 = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/gi;
  while ((m = ruRegex2.exec(text)) !== null) {
    const month = MONTHS_EN[m[2].slice(0, 3).toLowerCase()];
    if (month) push({ day: parseInt(m[1]), month, raw: m[0] });
  }
  const numRegex = /\b(\d{1,2})[\.\/](\d{1,2})(?:[\.\/](\d{2,4}))?\b/g;
  while ((m = numRegex.exec(text)) !== null) {
    const day = parseInt(m[1]), month = parseInt(m[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) push({ day, month, raw: m[0] });
  }
  return results;
}

function formatDateShort(d) {
  const names = ['','янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  return `${d.day} ${names[d.month]}`;
}

function dateKey(d) { return `${d.month}-${d.day}`; }

// ============ PARSER ============
function parseTelegram(json) {
  const messages = (json.messages || []).filter(m => m && m.type === 'message' && !m.action);
  const decisions = [];
  const ownershipChanges = [];
  const blockers = [];
  const questions = [];
  const budgetChanges = [];
  const scopeChanges = [];
  const conflicts = [];
  const topicDates = new Map();

  const decisionKw = /(релиз|перенос|перенес|решили|решение|утверд|согласова|release|moved|postpone|deadline|дедлайн|срок|date\b|дата\b|финал)/i;
  const ownerKw = /(больше не|теперь|вместо|instead|не отвечает|отвечает|ответственн|owner|owns|владелец|передал|передаю|заменя)/i;
  const blockerKw = /(блок|blocked|cannot proceed|не может|не работает|сломан|не деплоится|проблема с|утечк|memory leak|падает|failed|failure)/i;
  const questionKw = /(не решили|не определ|неизвестно|undecided|unresolved|открыт|open question|остаётся открытым|ещё не|пока не|под вопросом)/i;
  const budgetKw = /(бюджет|budget|урезан|уреза|сокращ|cost|дорого|финанс|отказ от|отмен)/i;
  const scopeKw = /(scope|скоуп|направлен|direction|переформулир|переименов|refram|теперь.*не просто|не только)/i;

  const topicRules = [
    { name: 'Release date', rx: /(релиз|release)/i },
    { name: 'Beta release', rx: /(бета|beta)/i },
    { name: 'Deadline', rx: /(deadline|срок|дедлайн)/i },
    { name: 'CRM integration', rx: /(crm|интеграц)/i },
  ];

  for (const msg of messages) {
    const text = extractText(msg).trim();
    if (!text || text.length < 4) continue;
    const from = msg.from || 'Unknown';
    const date = msg.date || '';
    const dates = findDates(text);

    if (decisionKw.test(text)) decisions.push({ from, date, text: text.slice(0, 400), dates });
    if (ownerKw.test(text)) ownershipChanges.push({ from, date, text: text.slice(0, 300) });
    if (blockerKw.test(text)) blockers.push({ from, date, text: text.slice(0, 300) });
    if (questionKw.test(text)) questions.push({ from, date, text: text.slice(0, 300) });
    if (budgetKw.test(text)) budgetChanges.push({ from, date, text: text.slice(0, 300) });
    if (scopeKw.test(text)) scopeChanges.push({ from, date, text: text.slice(0, 300) });

    if (dates.length > 0) {
      for (const rule of topicRules) {
        if (rule.rx.test(text)) {
          if (!topicDates.has(rule.name)) topicDates.set(rule.name, new Map());
          const map = topicDates.get(rule.name);
          for (const d of dates) {
            const k = dateKey(d);
            if (!map.has(k)) map.set(k, { date: d, messages: [] });
            map.get(k).messages.push({ from, date, text: text.slice(0, 300), raw: d.raw });
          }
          break;
        }
      }
    }
  }

  for (const [topic, dateMap] of topicDates.entries()) {
    if (dateMap.size < 2) continue;
    const entries = [...dateMap.entries()].map(([k, v]) => {
      const latest = v.messages.reduce((a, b) => (a.date > b.date ? a : b));
      return { key: k, date: v.date, messages: v.messages, latestMessageDate: latest.date };
    });
    entries.sort((a, b) => b.latestMessageDate.localeCompare(a.latestMessageDate));

    // Build chain of all distinct dates (newest first)
    const chain = entries.map(e => e.date);

    conflicts.push({
      topic,
      newer: entries[0],
      older: entries[1],
      chain,
      allValues: entries,
    });
  }

  return {
    totalMessages: messages.length,
    decisions: decisions.slice(-20).reverse(),
    ownershipChanges: ownershipChanges.slice(-10).reverse(),
    blockers: blockers.slice(-10).reverse(),
    questions: questions.slice(-10).reverse(),
    budgetChanges: budgetChanges.slice(-5).reverse(),
    scopeChanges: scopeChanges.slice(-5).reverse(),
    conflicts,
  };
}

// ============ DEMO ============
const DEMO_JSON = {
  name: 'Demo project chat',
  messages: [
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-01T10:15:00', text: 'Начинаем обсуждение архитектуры нового модуля оплаты. Два кандидата: микросервис на Go или расширение монолита на Python.' },
    { type: 'message', from: 'Иван (dev)', date: '2026-08-01T14:30:00', text: 'Я за микросервисы на Go. Монолит перегружен.' },
    { type: 'message', from: 'Ольга (devops)', date: '2026-08-02T09:00:00', text: 'Поддерживаю Ивана. Гибкость и масштабирование.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-05T11:45:00', text: 'Решено: модуль оплаты делаем на Go, отдельный микросервис. Ольга — инфраструктура. Иван — разработка.' },
    { type: 'message', from: 'Мария (dev)', date: '2026-08-06T09:00:00', text: 'Как быть с существующей интеграцией с платёжной системой на Python? Нужен адаптер.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-06T12:15:00', text: 'Мария, ты можешь заняться адаптером?' },
    { type: 'message', from: 'Мария (dev)', date: '2026-08-06T12:20:00', text: 'Хорошо, сделаю.' },
    { type: 'message', from: 'Сергей (PO)', date: '2026-08-10T16:00:00', text: 'Клиент просит интеграцию с их внутренней CRM к 1 октября. Это может сдвинуть релиз.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-12T10:30:00', text: 'Релиз у нас запланирован на 15 сентября. С CRM может сдвинуться.' },
    { type: 'message', from: 'Сергей (PO)', date: '2026-08-15T14:00:00', text: 'Оценка: CRM — минимум 2 недели. Релиз лучше перенести на 1 октября.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-18T11:20:00', text: 'Ок, переносим релиз на 1 октября. Решение принято.' },
    { type: 'message', from: 'Иван (dev)', date: '2026-08-20T09:30:00', text: 'Утверждаем формат ошибок? Предлагаю problem+json как везде.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-20T12:10:00', text: 'Утверждено: problem+json.' },
    { type: 'message', from: 'Ольга (devops)', date: '2026-08-22T17:00:00', text: 'Проблема: Go-сервис не деплоится на старый кластер. Нужно обновить Kubernetes с 1.20 до 1.24.' },
    { type: 'message', from: 'Сергей (PO)', date: '2026-08-25T16:30:00', text: 'Клиент согласен подождать до 10 октября, если мы дадим бета-версию к 25 сентября.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-26T09:15:00', text: 'Новый план: релиз 10 октября. Бета для клиента — 25 сентября. Финал.' },
    { type: 'message', from: 'Иван (dev)', date: '2026-08-27T14:30:00', text: 'Нужна очередь RabbitMQ для масштабирования. Без неё потери при пиках.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-08-28T10:00:00', text: 'Добавляем RabbitMQ. Решение записано.' },
    { type: 'message', from: 'Ольга (devops)', date: '2026-09-01T12:00:00', text: 'Kubernetes обновлён до 1.24. Всё работает.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-05T09:30:00', text: 'Плохая новость: бюджет урезан на 20%. Отказываемся от RabbitMQ, переходим на синхронную схему.' },
    { type: 'message', from: 'Иван (dev)', date: '2026-09-05T12:10:00', text: 'Как так? Это снизит надёжность. Но ок.' },
    { type: 'message', from: 'Сергей (PO)', date: '2026-09-06T10:15:00', text: 'Клиент подтвердил: бета к 25 сентября критична.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-10T17:00:00', text: 'Мария заболела, не сможет работать минимум неделю. Кто возьмёт адаптер?' },
    { type: 'message', from: 'Иван (dev)', date: '2026-09-11T09:00:00', text: 'Я могу, но тогда отстану по микросервису.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-11T11:30:00', text: 'Ок: Иван временно ведёт адаптер. Я подключаюсь к микросервису. Ольга — тестирование.' },
    { type: 'message', from: 'Сергей (PO)', date: '2026-09-18T12:00:00', text: 'Бета-версия готова? Клиент ждёт.' },
    { type: 'message', from: 'Иван (dev)', date: '2026-09-18T14:30:00', text: 'Почти. К завтрашнему дню будет готова.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-20T09:00:00', text: 'Бета выкачена клиенту. Все довольны.' },
    { type: 'message', from: 'Ольга (devops)', date: '2026-09-22T11:00:00', text: 'Заметили утечку памяти в Go-сервисе. Нужно исправить до релиза.' },
    { type: 'message', from: 'Мария (dev)', date: '2026-09-24T16:00:00', text: 'Нашла баг: бесконечный цикл при обработке ошибок. Исправила.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-28T14:00:00', text: 'Релиз 10 октября всё ещё актуален. Финальное регрессионное тестирование на этой неделе.' },
    { type: 'message', from: 'Сергей (PO)', date: '2026-09-29T11:00:00', text: 'Клиент жалуется на формат ошибок. Ожидает JSON, а мы возвращаем текст.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-29T11:30:00', text: 'Мы же утвердили problem+json ещё в августе. Иван, проверь.' },
    { type: 'message', from: 'Иван (dev)', date: '2026-09-29T12:00:00', text: 'Проверю. Видимо, не доехало до продакшена.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-29T15:00:00', text: 'Формат первого внешнего пилота всё ещё не определён. Нужно решить до 5 октября.' },
    { type: 'message', from: 'Мария (dev)', date: '2026-09-30T09:00:00', text: 'Иван, я вернулась. Забирай адаптер обратно на меня.' },
    { type: 'message', from: 'Алексей (тимлид)', date: '2026-09-30T17:00:00', text: 'Релиз 10 октября. Бета принята. Открытые вопросы: формат пилота и формат ошибок на проде.' },
  ]
};

function loadDemo() { parseAndShow(DEMO_JSON, DEMO_JSON.name); }

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function showError(msg) {
  document.getElementById('error-box-container').innerHTML = msg ? `<div class="error-box">${escapeHtml(msg)}</div>` : '';
}

function handleFile(file) {
  showError('');
  if (file.size > 50 * 1024 * 1024) { showError('Файл слишком большой (>50 MB).'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      if (!json.messages || !Array.isArray(json.messages)) {
        showError('Это не похоже на экспорт Telegram. Нужен result.json из Telegram Desktop.');
        return;
      }
      if (json.messages.length === 0) { showError('В файле нет сообщений.'); return; }
      parseAndShow(json, json.name || file.name);
    } catch (err) {
      showError('Не удалось прочитать файл: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function parseAndShow(json, chatName) {
  switchView('parsing');
  setTimeout(() => {
    try {
      parsedData = parseTelegram(json);
      parsedData.chatName = chatName;
      renderAll();
      switchView('today');
    } catch (err) {
      console.error(err);
      showError('Ошибка при разборе: ' + err.message);
      switchView('upload');
    }
  }, 500);
}

function renderAll() {
  renderToday();
  renderState();
  renderDecisions();
  renderConflicts();
  updateNavCounts();
}

function updateNavCounts() {
  const el = document.getElementById('nav-conflicts-count');
  if (parsedData.conflicts.length > 0) el.textContent = parsedData.conflicts.length;
  else el.textContent = '';
}

// ============ TODAY ============
function renderToday() {
  const d = parsedData;
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  document.getElementById('today-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  document.getElementById('checkpoint-time').textContent = timeStr;

  const parts = [];
  parts.push(`Проанализировано ${d.totalMessages} сообщений из чата «${d.chatName}».`);
  if (d.conflicts.length > 0) parts.push(`${d.conflicts.length} конфликт${d.conflicts.length === 1 ? '' : 'ов'} между источниками.`);
  if (d.blockers.length > 0) parts.push(`${d.blockers.length} блокер${d.blockers.length === 1 ? '' : 'ов'}.`);
  if (d.questions.length > 0) parts.push(`${d.questions.length} открыт${d.questions.length === 1 ? 'ый вопрос' : 'ых вопросов'}.`);
  document.getElementById('briefing-text').textContent = parts.join(' ');

  document.getElementById('source-count').textContent = `${d.totalMessages} messages analyzed · ${d.decisions.length} decisions · ${d.conflicts.length} conflicts`;

  document.getElementById('stats-block').innerHTML = `
    <div class="stat"><div class="stat-num">${d.totalMessages}</div><div class="stat-label">Messages</div></div>
    <div class="stat"><div class="stat-num">${d.decisions.length}</div><div class="stat-label">Decisions</div></div>
    <div class="stat"><div class="stat-num">${d.conflicts.length}</div><div class="stat-label">Conflicts</div></div>
    <div class="stat"><div class="stat-num">${d.blockers.length}</div><div class="stat-label">Blockers</div></div>
    <div class="stat"><div class="stat-num">${d.ownershipChanges.length}</div><div class="stat-label">Owner changes</div></div>
    <div class="stat"><div class="stat-num">${d.questions.length}</div><div class="stat-label">Open questions</div></div>
  `;

  // Attention
  const att = document.getElementById('attention-cards');
  att.innerHTML = '';
  if (d.conflicts.length === 0 && d.blockers.length === 0) {
    att.innerHTML = '<div class="empty-note">Ничего не требует внимания.</div>';
  } else {
    d.conflicts.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'card conflict';
      card.onclick = () => openConflict(i);
      const chain = c.chain.map(formatDateShort).reverse().join(' → ');
      card.innerHTML = `
        <div class="card-tag">Conflict</div>
        <div class="card-title">${c.topic} — ${chain}</div>
        <div class="card-desc">В чате найдены разные значения. Источники не согласованы.</div>
        <div class="card-meta"><span>${c.allValues.reduce((s, v) => s + v.messages.length, 0)} сообщений</span><span class="sources">${c.allValues.length} values ↗</span></div>
      `;
      att.appendChild(card);
    });
    d.blockers.slice(0, 5).forEach(b => {
      const card = document.createElement('div');
      card.className = 'card blocker';
      card.innerHTML = `
        <div class="card-tag">Blocker</div>
        <div class="card-title">${escapeHtml(b.text.slice(0, 120))}${b.text.length > 120 ? '…' : ''}</div>
        <div class="card-meta"><span>${escapeHtml(b.from)}</span><span class="sources">${formatDate(b.date)} ↗</span></div>
      `;
      att.appendChild(card);
    });
  }

  // Changes
  const ch = document.getElementById('changes-cards');
  ch.innerHTML = '';
  const seen = new Set();
  const allChanges = [
    ...d.scopeChanges.map(s => ({ ...s, tag: 'Scope', cls: 'change' })),
    ...d.budgetChanges.map(s => ({ ...s, tag: 'Budget', cls: 'budget' })),
    ...d.ownershipChanges.map(s => ({ ...s, tag: 'Owner', cls: 'owner' })),
  ];
  allChanges.slice(0, 8).forEach((c, i) => {
    const short = c.text.slice(0, 60);
    if (seen.has(short)) return;
    seen.add(short);
    const card = document.createElement('div');
    card.className = 'card ' + c.cls;
    card.innerHTML = `
      <div class="card-tag">${c.tag}</div>
      <div class="card-title">${escapeHtml(c.text.slice(0, 140))}${c.text.length > 140 ? '…' : ''}</div>
      <div class="card-meta"><span>${escapeHtml(c.from)}</span><span class="sources">${formatDate(c.date)}</span></div>
    `;
    ch.appendChild(card);
  });
  if (allChanges.length === 0) {
    ch.innerHTML = '<div class="empty-note">Изменений не найдено.</div>';
  }

  // Questions
  const q = document.getElementById('questions-cards');
  q.innerHTML = '';
  if (d.questions.length === 0) {
    q.innerHTML = '<div class="empty-note">Открытых вопросов не найдено.</div>';
  } else {
    d.questions.slice(0, 6).forEach(item => {
      const card = document.createElement('div');
      card.className = 'card question';
      card.innerHTML = `
        <div class="card-tag">Open question</div>
        <div class="card-title">${escapeHtml(item.text.slice(0, 140))}${item.text.length > 140 ? '…' : ''}</div>
        <div class="card-meta"><span>${escapeHtml(item.from)}</span><span class="sources">${formatDate(item.date)}</span></div>
      `;
      q.appendChild(card);
    });
  }
}

// ============ PROJECT STATE ============
function renderState() {
  const d = parsedData;
  document.getElementById('state-subtitle').textContent = d.chatName;

  const lines = [];
  d.conflicts.forEach(c => {
    const chain = c.chain.map(formatDateShort).reverse();
    const current = chain[chain.length - 1];
    lines.push(`${c.topic} — текущее значение <strong>${current}</strong> (история: ${chain.join(' → ')})`);
  });
  if (d.blockers.length > 0) lines.push(`Активных блокеров: <strong>${d.blockers.length}</strong>`);
  if (d.questions.length > 0) lines.push(`Открытых вопросов: <strong>${d.questions.length}</strong>`);
  if (d.decisions.length > 0) lines.push(`Всего решений: <strong>${d.decisions.length}</strong>`);

  document.getElementById('state-current').innerHTML = lines.length
    ? `<div style="font-size:15px;line-height:1.9;">${lines.map(l => `<div>• ${l}</div>`).join('')}</div>`
    : '<div class="empty-note">Пока нечего показать.</div>';

  const changesEl = document.getElementById('state-changes');
  changesEl.innerHTML = '';
  if (d.conflicts.length === 0) {
    changesEl.innerHTML = '<div class="empty-note">Изменений не найдено.</div>';
  } else {
    d.conflicts.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'card change';
      card.onclick = () => openConflict(i);
      const chain = c.chain.map(formatDateShort).reverse().join(' → ');
      card.innerHTML = `
        <div class="card-title">${c.topic}: ${chain}</div>
        <div class="card-meta"><span>${c.allValues.reduce((s, v) => s + v.messages.length, 0)} sources</span><span class="sources">↗</span></div>
      `;
      changesEl.appendChild(card);
    });
  }

  const ownersEl = document.getElementById('state-owners');
  ownersEl.innerHTML = '';
  if (d.ownershipChanges.length === 0) {
    ownersEl.innerHTML = '<div class="empty-note">Смен ответственных не найдено.</div>';
  } else {
    d.ownershipChanges.slice(0, 5).forEach(oc => {
      const card = document.createElement('div');
      card.className = 'card owner';
      card.innerHTML = `
        <div class="card-title">${escapeHtml(oc.text.slice(0, 140))}${oc.text.length > 140 ? '…' : ''}</div>
        <div class="card-meta"><span>${escapeHtml(oc.from)}</span><span class="sources">${formatDate(oc.date)}</span></div>
      `;
      ownersEl.appendChild(card);
    });
  }

  const attEl = document.getElementById('state-attention');
  attEl.innerHTML = '';
  if (d.blockers.length === 0 && d.questions.length === 0) {
    attEl.innerHTML = '<div class="empty-note">Ничего не требует внимания.</div>';
  } else {
    d.blockers.slice(0, 5).forEach(b => {
      const card = document.createElement('div');
      card.className = 'card blocker';
      card.innerHTML = `
        <div class="card-tag">Blocker</div>
        <div class="card-title">${escapeHtml(b.text.slice(0, 140))}${b.text.length > 140 ? '…' : ''}</div>
        <div class="card-meta"><span>${escapeHtml(b.from)}</span><span class="sources">${formatDate(b.date)}</span></div>
      `;
      attEl.appendChild(card);
    });
    d.questions.slice(0, 5).forEach(q => {
      const card = document.createElement('div');
      card.className = 'card question';
      card.innerHTML = `
        <div class="card-tag">Open question</div>
        <div class="card-title">${escapeHtml(q.text.slice(0, 140))}${q.text.length > 140 ? '…' : ''}</div>
        <div class="card-meta"><span>${escapeHtml(q.from)}</span><span class="sources">${formatDate(q.date)}</span></div>
      `;
      attEl.appendChild(card);
    });
  }
}

// ============ DECISIONS ============
function renderDecisions() {
  const d = parsedData;
  const el = document.getElementById('decisions-list');
  el.innerHTML = '';
  if (d.decisions.length === 0) {
    el.innerHTML = '<div class="empty-note">Решений не найдено.</div>';
    return;
  }
  const seen = new Set();
  d.decisions.forEach((dec, i) => {
    const short = dec.text.slice(0, 60);
    if (seen.has(short)) return;
    seen.add(short);
    const card = document.createElement('div');
    card.className = 'card change';
    card.onclick = () => openDecision(i);
    card.innerHTML = `
      <div class="card-tag">Decision</div>
      <div class="card-title">${escapeHtml(dec.text.slice(0, 160))}${dec.text.length > 160 ? '…' : ''}</div>
      <div class="card-meta"><span>${escapeHtml(dec.from)}</span><span class="sources">${formatDate(dec.date)} ↗</span></div>
    `;
    el.appendChild(card);
  });
}

// ============ CONFLICTS ============
function renderConflicts() {
  const d = parsedData;
  const el = document.getElementById('conflicts-list');
  el.innerHTML = '';
  if (d.conflicts.length === 0) {
    el.innerHTML = '<div class="empty-note">Конфликтов не найдено.</div>';
    return;
  }
  d.conflicts.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card conflict';
    card.onclick = () => openConflict(i);
    const chain = c.chain.map(formatDateShort).reverse().join(' → ');
    card.innerHTML = `
      <div class="card-tag">Conflict</div>
      <div class="card-title">${c.topic}</div>
      <div class="card-desc">История значений: ${chain}</div>
      <div class="card-meta"><span>${c.allValues.reduce((s, v) => s + v.messages.length, 0)} источников</span><span class="sources">${c.allValues.length} значений ↗</span></div>
    `;
    el.appendChild(card);
  });
}

// ============ DETAIL ============
function openConflict(idx) {
  const c = parsedData.conflicts[idx];
  const chain = c.chain.map(formatDateShort).reverse();
  const current = chain[chain.length - 1];
  const older = chain.slice(0, -1);

  const chainHtml = chain.map((d, i) => {
    if (i === chain.length - 1) return `<span class="step current">${d}</span>`;
    return `<span class="step old">${d}</span>`;
  }).join('<span class="arrow">→</span>');

  const supports = c.allValues[0];
  const contradicts = c.allValues.slice(1);

  document.getElementById('detail-content').innerHTML = `
    <div class="decision-header">
      <div class="decision-title">${c.topic}</div>
      <div class="decision-reason">Текущее значение: ${current}</div>
    </div>

    <div class="state-block">
      <h3>History of values</h3>
      <div class="chain">${chainHtml}</div>
    </div>

    <div class="state-block">
      <h3>Evidence</h3>
      <div class="evidence-grid">
        <div class="evidence-col supports">
          <h4>Supports (${formatDateShort(supports.date)})</h4>
          ${supports.messages.map(m => `
            <div class="evidence-item">
              <div class="evidence-source">${escapeHtml(m.from)} · ${formatDate(m.date)}</div>
              <div class="evidence-quote">"${escapeHtml(m.text)}"</div>
            </div>
          `).join('')}
        </div>
        <div class="evidence-col contradicts">
          <h4>Contradicts</h4>
          ${contradicts.map(v => `
            <div style="margin-bottom:16px;">
              <div style="font-size:11px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${formatDateShort(v.date)}</div>
              ${v.messages.map(m => `
                <div class="evidence-item">
                  <div class="evidence-source">${escapeHtml(m.from)} · ${formatDate(m.date)}</div>
                  <div class="evidence-quote">"${escapeHtml(m.text)}"</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="state-block">
      <h3>Status</h3>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span class="status-badge badge-open">Open conflict</span>
        <span style="font-size:14px;color:#444;">Источники всё ещё противоречат друг другу. ${c.allValues.length} значений в истории.</span>
      </div>
    </div>

    <div class="footer-note">
      Каждое изменение, причина и открытый конфликт хранятся вместе. Это единица записи Meto.
    </div>
  `;
  previousView = document.querySelector('.view.active').id.replace('view-', '');
  switchView('detail');
}

function openDecision(idx) {
  const d = parsedData.decisions[idx];
  document.getElementById('detail-content').innerHTML = `
    <div class="decision-header">
      <div class="decision-title" style="font-size:22px;">${escapeHtml(d.text.slice(0, 100))}${d.text.length > 100 ? '…' : ''}</div>
      <div class="decision-reason">Сообщение от ${escapeHtml(d.from)}</div>
    </div>
    <div class="state-block">
      <h3>Source</h3>
      <div class="evidence-item">
        <div class="evidence-source">${escapeHtml(d.from)} · ${formatDate(d.date)}</div>
        <div class="evidence-text">${escapeHtml(d.text)}</div>
      </div>
    </div>
    ${d.dates.length > 0 ? `
      <div class="state-block">
        <h3>Dates mentioned</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${d.dates.map(dt => `<span style="background:#f0eeea;padding:6px 12px;border-radius:6px;font-size:14px;">${formatDateShort(dt)}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;
  previousView = 'decisions';
  switchView('detail');
}

// ============ UTILS ============
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatDate(s) {
  if (!s) return '';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return s; }
}

// ============ NAVIGATION ============
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-view="${name}"]`);
  if (navItem) navItem.classList.add('active');
  window.scrollTo(0, 0);
}

function goBack() { switchView(previousView); }

function resetToUpload() {
  parsedData = null;
  fileInput.value = '';
  showError('');
  switchView('upload');
}

document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', () => {
    if (!parsedData) {
      showError('Сначала загрузите экспорт Telegram или нажмите «Показать на демо-данных».');
      switchView('upload');
      return;
    }
    previousView = 'today';
    switchView(item.dataset.view);
  });
});

if (window.location.hash === '#demo') setTimeout(loadDemo, 100);
