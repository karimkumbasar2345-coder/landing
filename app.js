(function() {
      'use strict';

      const METO_STORE = {
        projectMeta: {
          name: "Финтех · Модуль оплаты v2.4",
          lastAudited: "16 сентября 2026, 16:30",
          activeView: "today"
        },

        metrics: {
          activeConflicts: 1,
          trackerDesyncs: 1,
          decisionsRecorded: 5,
          openQuestions: 2
        },

        temporalStates: {
          SUPPORTED: {
            key: "SUPPORTED",
            labelRu: "ПОДТВЕРЖДЕНО",
            glyph: "◈",
            iconId: "icon-check",
            cssClass: "status-supported",
            descriptionRu: "Подтверждено первоисточником; ожидает утверждения PM"
          },
          SUPERSEDED: {
            key: "SUPERSEDED",
            labelRu: "ЗАМЕНЕНО",
            glyph: "↺",
            iconId: "icon-superseded",
            cssClass: "status-superseded",
            descriptionRu: "Заменено более поздним решением; сохранено в истории"
          },
          CONFLICT: {
            key: "CONFLICT",
            labelRu: "КОНФЛИКТ",
            glyph: "⚡",
            iconId: "icon-conflict",
            cssClass: "status-conflict",
            descriptionRu: "Источники противоречат; текущее значение не установлено"
          },
          UNCERTAIN: {
            key: "UNCERTAIN",
            labelRu: "НЕ ОПРЕДЕЛЕНО",
            glyph: "◌",
            iconId: "icon-uncertain",
            cssClass: "status-uncertain",
            descriptionRu: "Данные неполны; открытый вопрос без закреплённого владельца"
          },
          CURRENT: {
            key: "CURRENT",
            labelRu: "УТВЕРЖДЕНО",
            glyph: "✓",
            iconId: "icon-current",
            cssClass: "status-current",
            descriptionRu: "Официальный рабочий базис; явно утверждён PM / лидом"
          }
        },

        facts: [
          {
            id: "fact-release-date",
            domain: "RELEASE",
            domainNameRu: "Сроки и релизы",
            title: "Целевая дата релиза спринта v2.4",
            canonicalState: "SUPPORTED",
            currentValueDisplay: "15 сентября 2026",
            sourcesCount: 2,
            staleAlert: {
              hasDesync: true,
              staleSourceTitle: "Jira (PAY-104)",
              staleValue: "12 сентября 2026",
              desyncDays: 5,
              descriptionRu: "Рассинхронизация: Трекер отстаёт на 5 дней от решения в чате (12 сен вместо 15 сен)"
            },
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-db-engine",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            title: "Основная СУБД транзакционного ядра биллинга",
            canonicalState: "CONFLICT",
            currentValueDisplay: "Текущее значение не установлено",
            sourcesCount: 2,
            memoDrawerId: "memo-scenario-2"
          },
          {
            id: "fact-tech-stack",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            title: "Архитектурный стек нового модуля оплаты",
            canonicalState: "CURRENT",
            currentValueDisplay: "Микросервис на Go",
            sourcesCount: 3,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-error-format",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            title: "Стандарт ответов об ошибках API",
            canonicalState: "SUPPORTED",
            currentValueDisplay: "RFC 7807 (problem+json)",
            sourcesCount: 2,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-queue-broker",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            title: "Транспорт очередей между сервисами",
            canonicalState: "SUPERSEDED",
            currentValueDisplay: "Синхронная схема (отказ от RabbitMQ из-за бюджета -20%)",
            sourcesCount: 2,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-k8s-version",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            title: "Версия продакшн-кластера Kubernetes",
            canonicalState: "CURRENT",
            currentValueDisplay: "v1.24 (обновлено 1 сентября)",
            sourcesCount: 1,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-crm-scope",
            domain: "PRODUCT",
            domainNameRu: "Продукт и скоуп",
            title: "CRM-интеграция по требованию клиента",
            canonicalState: "SUPPORTED",
            currentValueDisplay: "Включена в скоуп (оценка 2 недели)",
            sourcesCount: 2,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-pilot-format",
            domain: "PRODUCT",
            domainNameRu: "Продукт и скоуп",
            title: "Формат первого внешнего пилота",
            canonicalState: "UNCERTAIN",
            currentValueDisplay: "Не определён (дедлайн выбора: 5 октября)",
            sourcesCount: 1,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-owner-adapter",
            domain: "OWNERSHIP",
            domainNameRu: "Ответственность",
            title: "Владелец платёжного адаптера Python",
            canonicalState: "CURRENT",
            currentValueDisplay: "Мария (вернулась 30 сен; временно вёл Иван)",
            sourcesCount: 3,
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "fact-prod-error-leak",
            domain: "RISKS",
            domainNameRu: "Риски и блокеры",
            title: "Некорректный формат ошибок на продакшене",
            canonicalState: "CONFLICT",
            currentValueDisplay: "Клиент получает plain text вместо problem+json",
            sourcesCount: 2,
            memoDrawerId: "memo-scenario-2"
          }
        ],

        conflicts: [
          {
            id: "conf-db-engine",
            topic: "Выбор СУБД: PostgreSQL 16 vs MySQL 8.0",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            canonicalState: "CONFLICT",
            statusDisplayRu: "Текущее значение не установлено",
            invariantRuleRu: "Meto не выбирает MySQL автоматически по таймстампу (5 сен > 3 сен). Требуется решение техсовета или PM.",
            memoDrawerId: "memo-scenario-2",
            sideA: {
              value: "PostgreSQL 16",
              sourceSystemRu: "Confluence ADR-04",
              author: "Николай (Chief Architect)",
              dateRu: "3 сентября 2026",
              argumentRu: "Строгая сериализуемость (SSI), нативная обработка JSONB для метаданных фискальных чеков и аудит транзакций через Timescale/WAL-G",
              temporalState: "SUPPORTED"
            },
            sideB: {
              value: "MySQL 8.0",
              sourceSystemRu: "Стенограмма синка #28",
              author: "Виктор (Tech Lead)",
              dateRu: "5 сентября 2026",
              argumentRu: "Текущий шардинг в k8s заточен под MySQL, миграция на Postgres задержит релиз на месяц, которого у нас нет до релиза",
              temporalState: "SUPPORTED"
            }
          }
        ],

        decisions: [
          {
            id: "dec-release-15sep",
            dateRu: "11 сентября 2026",
            title: "Смещение даты релиза на 15 сентября (Задержка авторизации)",
            domain: "RELEASE",
            domainNameRu: "Сроки и релизы",
            decider: "Алексей (Тимлид)",
            ratifier: "Сергей (PO)",
            state: "SUPPORTED",
            beforeRu: "12 сентября 2026 (Jira PAY-104)",
            afterRu: "15 сентября 2026",
            rationaleRu: "Банк-эквайер не предоставил тестовые OAuth callback ключи вовремя. Регресс невозможен без авторизации.",
            rejectedAlternatives: [
              { title: "Релиз 12 сентября с моками авторизации", reasonRu: "Недопустимый риск для транзакционного контура клиента" }
            ],
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "dec-cancel-rabbitmq",
            dateRu: "5 сентября 2026",
            title: "Отказ от RabbitMQ в пользу синхронных вызовов",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            decider: "Алексей (Тимлид)",
            state: "SUPERSEDED",
            beforeRu: "RabbitMQ для асинхронной обработки очередей",
            afterRu: "Синхронная схема HTTP/gRPC",
            rationaleRu: "Бюджет проекта урезан руководства на 20%. Сокращение расходов на инфраструктуру очередей.",
            rejectedAlternatives: [
              { title: "Сокращение QA инженеров", reasonRu: "Критически уронит качество финансового сервиса" }
            ],
            memoDrawerId: "memo-scenario-1"
          },
          {
            id: "dec-error-problem-json",
            dateRu: "20 августа 2026",
            title: "Утверждение RFC 7807 (problem+json) для всех API",
            domain: "ENGINEERING",
            domainNameRu: "Инженерия",
            decider: "Алексей (Тимлид)",
            state: "SUPPORTED",
            beforeRu: "Кастомные JSON ошибки {error: string}",
            afterRu: "RFC 7807 standard problem+json",
            rationaleRu: "Унификация контрактов с фронтендом и внешними шлюзами.",
            rejectedAlternatives: [],
            memoDrawerId: "memo-scenario-1"
          }
        ],

        memoPayloads: {
          "memo-scenario-1": {
            id: "memo-scenario-1",
            entityType: "DESYNC",
            title: "Дата релиза модуля оплаты v2.4",
            domainNameRu: "Сроки и релизы",
            state: "SUPPORTED",
            stateLabelRu: "ПОДТВЕРЖДЕНО",
            staleBadgeText: "РАССИНХРОНИЗАЦИЯ: JIRA ОТСТАЁТ НА 5 ДНЕЙ",
            whatRu: "Целевой срок выката релиза в продакшн перенесён на 15 сентября 2026 года.",
            whyRu: "Задержка авторизации со стороны эквайера: банк задержал выдачу тестовых OAuth callback ключей на 3 рабочих дня. Сквозное тестирование в песочнице к 12 сентября завершить невозможно.",
            beforeRu: "12 сентября 2026 (Linear / Jira PAY-104)",
            afterRu: "15 сентября 2026 (Согласовано в @pay_core_dev)",
            verbatimExcerpts: [
              {
                sourceName: "Telegram · @pay_core_dev · Сообщение #8841",
                author: "Алексей (Тимлид разработки)",
                timestampRu: "11 сен 2026, 11:20",
                badgeState: "SUPPORTED",
                badgeLabelRu: "ПОДТВЕРЖДЕНО",
                quoteText: "Коллеги, внимание: релиз переносим с 12 на 15 сентября. Причина — задержка авторизации со стороны эквайера (банк не выдал тестовые ключи OAuth callback вовремя). Решение согласовано с Сергеем (PO). 12 сентября в прод не выходим, фиксируем дату 15.09. Обновите трекер, кто отвечает за тикет!"
              },
              {
                sourceName: "Linear / Jira · Тикет PAY-104 · Обновление 8 сен",
                author: "Автоматический синк трекера",
                timestampRu: "08 сен 2026, 18:20",
                badgeState: "SUPERSEDED",
                badgeLabelRu: "УСТАРЕЛО (РАССИНХРОН)",
                isStaleNotice: true,
                quoteText: "Целевая дата релиза спринта v2.4: 12 сентября 2026. Статус: In Progress. Приоритет: High. Дедлайн зафиксирован в плане спринта #14. Дата не менялась с момента планирования."
              }
            ],
            timelineTrace: [
              {
                dateRu: "01 сен 2026",
                actor: "Сергей (PO)",
                actionRu: "Фиксация дедлайна 12 сентября в плане спринта #14",
                toState: "SUPPORTED",
                noteRu: "Первоначальное согласование сроков."
              },
              {
                dateRu: "11 сен 2026, 11:20",
                actor: "Алексей (Тимлид)",
                actionRu: "Перенос даты на 15 сентября из-за задержки авторизации",
                fromState: "SUPPORTED",
                toState: "SUPPORTED",
                noteRu: "Значение 12 сентября переведено в SUPERSEDED. Выявлен desync с Jira на 5 дней."
              }
            ]
          },

          "memo-scenario-2": {
            id: "memo-scenario-2",
            entityType: "CONFLICT",
            title: "СУБД транзакционного ядра биллинга",
            domainNameRu: "Инженерия и архитектура",
            state: "CONFLICT",
            stateLabelRu: "КОНФЛИКТ",
            whatRu: "Не разрешённое расхождение между архитектурным стандартом и стенограммой синка команды.",
            whyRu: "Главный архитектор утвердил PostgreSQL 16 в Confluence ADR-04 (3 сен), однако на синке 5 сентября техлид бэкенда заявил о выборе MySQL 8.0 из-за имеющегося опыта шардинга. Meto не отдает победу MySQL только потому, что 5 сен позже 3 сен.",
            beforeRu: "PostgreSQL 16 (ADR-04 от 3 сен)",
            afterRu: "Текущее значение не установлено (Конфликт источников)",
            verbatimExcerpts: [
              {
                sourceName: "Confluence · Архитектурная записка ADR-04",
                author: "Николай (Chief Architect)",
                timestampRu: "03 сен 2026, 14:00",
                badgeState: "SUPPORTED",
                badgeLabelRu: "КАНДИДАТ A (ПОДТВЕРЖДЕНО)",
                quoteText: "ADR-04: Выбор СУБД для транзакционного ядра биллинга. Решение: PostgreSQL 16. Обоснование: Поддержка строгой сериализуемости (SSI), нативная обработка JSONB для метаданных фискальных чеков и аудит транзакций через Timescale/WAL-G. Стек согласован со службой инфраструктуры."
              },
              {
                sourceName: "Zoom / Otter.ai · Стенограмма Engineering Sync #28",
                author: "Виктор (Tech Lead / Core Backend)",
                timestampRu: "05 сен 2026, 16:45",
                badgeState: "SUPPORTED",
                badgeLabelRu: "КАНДИДАТ B (ПОДТВЕРЖДЕНО)",
                quoteText: "Виктор: 'Ребята, по базе для биллинга — мы вчера посовещались с DBA и решили остаться на MySQL 8. У нас весь текущий шардинг, репликация и бэкапы в k8s заточены под MySQL, а миграция на Postgres займет лишний месяц, которого у нас нет до релиза. Давайте брать MySQL.'"
              }
            ],
            timelineTrace: [
              {
                dateRu: "03 сен 2026",
                actor: "Николай (Chief Architect)",
                actionRu: "Публикация ADR-04 в Confluence",
                toState: "SUPPORTED",
                noteRu: "Утверждение PostgreSQL 16."
              },
              {
                dateRu: "05 сен 2026",
                actor: "Виктор (Tech Lead)",
                actionRu: "Инженерный синк #28: предложение остаться на MySQL",
                fromState: "SUPPORTED",
                toState: "CONFLICT",
                noteRu: "Обнаружен конфликт. Статус переведён в CONFLICT: текущее значение не установлено."
              }
            ],
            resolutionAction: {
              buttonTextRu: "Утвердить решение техсовета",
              dialogType: "RESOLVE_DB_CONFLICT"
            }
          }
        }
      };
function escapeHtml(str) {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      const MetoDrawer = {
        isOpen: false,
        activeId: null,
        triggerElement: null,

        open(payloadId) {
          const payload = METO_STORE.memoPayloads[payloadId];
          if (!payload) return;

          this.activeId = payloadId;
          this.triggerElement = document.activeElement;

          this.renderContent(payload);

          const backdrop = document.getElementById('drawer-backdrop');
          const drawer = document.getElementById('memo-drawer');

          backdrop.classList.add('visible');
          drawer.classList.add('open');
          drawer.setAttribute('aria-hidden', 'false');
          drawer.setAttribute('aria-modal', 'true');
          this.isOpen = true;

          const closeBtn = document.getElementById('drawer-close-btn');
          if (closeBtn) closeBtn.focus();
        },

        close() {
          if (!this.isOpen) return;

          const backdrop = document.getElementById('drawer-backdrop');
          const drawer = document.getElementById('memo-drawer');

          backdrop.classList.remove('visible');
          drawer.classList.remove('open');
          drawer.setAttribute('aria-hidden', 'true');
          this.isOpen = false;
          this.activeId = null;

          if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
            this.triggerElement.focus();
          }
        },

        renderContent(p) {
          const stateMeta = METO_STORE.temporalStates[p.state] || METO_STORE.temporalStates.SUPPORTED;

          const badgeEl = document.getElementById('drawer-memo-badge');
          badgeEl.className = 'status-badge ' + stateMeta.cssClass;
          badgeEl.innerHTML = '<span class="status-glyph">' + stateMeta.glyph + '</span><span>' + escapeHtml(p.stateLabelRu) + '</span>';

          const domainEl = document.getElementById('drawer-domain-badge');
          if (domainEl) domainEl.textContent = p.domainNameRu || 'Финтех';

          const staleBadge = document.getElementById('drawer-stale-badge');
          const staleText = document.getElementById('drawer-stale-text');
          if (p.staleBadgeText) {
            staleBadge.style.display = 'inline-flex';
            if (staleText) staleText.textContent = p.staleBadgeText;
          } else {
            staleBadge.style.display = 'none';
          }

          document.getElementById('drawer-title').textContent = p.title;
          document.getElementById('drawer-what').textContent = p.whatRu;
          document.getElementById('drawer-why').textContent = p.whyRu;
          document.getElementById('drawer-before').textContent = p.beforeRu;
          document.getElementById('drawer-after').textContent = p.afterRu;

          const quotesEl = document.getElementById('drawer-quotes');
          quotesEl.innerHTML = (p.verbatimExcerpts || []).map(q => {
            const qMeta = METO_STORE.temporalStates[q.badgeState] || stateMeta;
            return '<div class="excerpt-card ' + (q.isStaleNotice ? 'is-stale' : '') + '">' +
              '<div class="excerpt-meta">' +
                '<span class="excerpt-source">' + escapeHtml(q.sourceName) + '</span>' +
                '<span class="status-badge ' + qMeta.cssClass + ' sm">' +
                  '<span class="status-glyph">' + qMeta.glyph + '</span>' +
                  '<span>' + escapeHtml(q.badgeLabelRu) + '</span>' +
                '</span>' +
              '</div>' +
              '<blockquote class="excerpt-quote">«' + escapeHtml(q.quoteText) + '»</blockquote>' +
              '<div class="excerpt-author">' + escapeHtml(q.author) + ' · ' + escapeHtml(q.timestampRu) + '</div>' +
            '</div>';
          }).join('');

          const timelineEl = document.getElementById('drawer-timeline');
          timelineEl.innerHTML = (p.timelineTrace || []).map(t => {
            return '<div class="timeline-step">' +
              '<div class="timeline-dot"></div>' +
              '<div class="timeline-content">' +
                '<div class="timeline-header">' +
                  '<span class="timeline-date">' + escapeHtml(t.dateRu) + '</span>' +
                  '<span class="timeline-actor">' + escapeHtml(t.actor) + '</span>' +
                '</div>' +
                '<div class="timeline-action">' + escapeHtml(t.actionRu) + '</div>' +
                '<div class="timeline-note">' + escapeHtml(t.noteRu) + '</div>' +
              '</div>' +
            '</div>';
          }).join('');

          const actionBtn = document.getElementById('drawer-action-btn');
          if (p.resolutionAction) {
            actionBtn.style.display = 'inline-flex';
            actionBtn.textContent = p.resolutionAction.buttonTextRu;
          } else {
            actionBtn.style.display = 'none';
          }
        }
      };

      const MetoRouter = {
        currentView: 'landing',

        init() {
          window.addEventListener('hashchange', () => this.handleRoute());
          this.handleRoute();
        },

        navigate(viewName) {
          window.location.hash = '#/' + viewName;
        },

        handleRoute() {
          const raw = window.location.hash.replace(/^#\/?/, '');
          if (!raw || raw === 'landing') {
            this.showLanding();
            return;
          }

          if (raw === 'demo') {
            this.showAppView('today');
            return;
          }

          const targetView = ['today', 'state', 'decisions', 'conflicts'].includes(raw) ? raw : 'today';
          this.showAppView(targetView);
        },

        showLanding() {
          document.getElementById('view-landing').style.display = 'flex';
          document.getElementById('view-app').style.display = 'none';
          MetoDrawer.close();
          this.currentView = 'landing';
          window.scrollTo({ top: 0, behavior: 'instant' });
        },

        showAppView(viewName) {
          document.getElementById('view-landing').style.display = 'none';
          document.getElementById('view-app').style.display = 'grid';

          document.querySelectorAll('.nav-item[data-view], .mob-item[data-view]').forEach(el => {
            el.classList.toggle('active', el.dataset.view === viewName);
          });

          document.querySelectorAll('.view-pane').forEach(el => {
            el.classList.toggle('active', el.id === 'pane-' + viewName);
          });

          this.currentView = viewName;
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      };

      const MetoApp = {
        initialFacts: null,
        initialMetrics: null,

        init() {
          this.initialFacts = JSON.parse(JSON.stringify(METO_STORE.facts));
          this.initialMetrics = JSON.parse(JSON.stringify(METO_STORE.metrics));
          this.renderToday();
          this.renderState();
          this.renderDecisions();
          this.renderConflicts();
          this.setupEvents();
          MetoRouter.init();
        },

        resetDemo() {
          if (this.initialFacts) {
            METO_STORE.facts = JSON.parse(JSON.stringify(this.initialFacts));
          }
          if (this.initialMetrics) {
            METO_STORE.metrics = JSON.parse(JSON.stringify(this.initialMetrics));
            const conflictMetric = document.getElementById('metric-conflicts');
            if (conflictMetric) conflictMetric.textContent = String(METO_STORE.metrics.activeConflicts);
          }
          this.renderToday();
          this.renderState();
          this.renderDecisions();
          this.renderConflicts();
          this.showToast('Демо-состояние возвращено к исходному (1 конфликт, 1 рассинхрон)');
        },

        showToast(msg) {
          const toastRegion = document.getElementById('toast-region');
          const toast = document.createElement('div');
          toast.className = 'toast';
          toast.innerHTML = '<svg class="ui-icon"><use href="#icon-check"></use></svg><span>' + escapeHtml(msg) + '</span>';
          toastRegion.appendChild(toast);
          setTimeout(() => {
            toast.remove();
          }, 3500);
        },

        renderToday() {
          const changesContainer = document.getElementById('today-recent-changes');
          const changeFacts = METO_STORE.facts.filter(f => f.id === 'fact-release-date' || f.id === 'fact-queue-broker');
          changesContainer.innerHTML = changeFacts.map(f => this.createFactCardHtml(f)).join('');

          const questionsContainer = document.getElementById('today-open-questions');
          const questionFacts = METO_STORE.facts.filter(f => f.canonicalState === 'UNCERTAIN' || f.canonicalState === 'CONFLICT');
          questionsContainer.innerHTML = questionFacts.map(f => this.createFactCardHtml(f)).join('');
        },

        renderState() {
          const domainsContainer = document.getElementById('state-domains-container');
          const domains = [
            { key: 'RELEASE', titleRu: 'Сроки и релизы' },
            { key: 'ENGINEERING', titleRu: 'Инженерия и архитектура' },
            { key: 'PRODUCT', titleRu: 'Продукт и скоуп' },
            { key: 'OWNERSHIP', titleRu: 'Ответственность и роли' },
            { key: 'RISKS', titleRu: 'Риски и блокеры' }
          ];

          domainsContainer.innerHTML = domains.map(d => {
            const domainFacts = METO_STORE.facts.filter(f => f.domain === d.key);
            if (domainFacts.length === 0) return '';

            return '<div class="domain-group">' +
              '<div class="domain-title">' +
                '<span>' + escapeHtml(d.titleRu) + '</span>' +
                '<span>' + domainFacts.length + ' фактов</span>' +
              '</div>' +
              '<div class="facts-list">' +
                domainFacts.map(f => this.createFactCardHtml(f)).join('') +
              '</div>' +
            '</div>';
          }).join('');
        },

        createFactCardHtml(f) {
          const stateMeta = METO_STORE.temporalStates[f.canonicalState] || METO_STORE.temporalStates.SUPPORTED;
          let staleBadgeHtml = '';

          if (f.staleAlert && f.staleAlert.hasDesync) {
            staleBadgeHtml = '<span class="badge-stale">' +
              '<svg class="ui-icon"><use href="#icon-stale"></use></svg>' +
              '<span>Рассинхрон трекера (' + f.staleAlert.desyncDays + ' дн.)</span>' +
            '</span>';
          }

          return '<div class="fact-card" onclick="MetoDrawer.open(\'' + f.memoDrawerId + '\')" data-memo="' + f.memoDrawerId + '">' +
            '<div class="fact-card-left">' +
              '<div class="fact-card-meta">' +
                '<span>' + escapeHtml(f.domainNameRu) + '</span>' +
                '<span>•</span>' +
                '<span>' + f.sourcesCount + ' источника</span>' +
              '</div>' +
              '<div class="fact-card-title">' + escapeHtml(f.title) + '</div>' +
              '<div class="fact-card-val">' + escapeHtml(f.currentValueDisplay) + '</div>' +
            '</div>' +
            '<div class="fact-card-right">' +
              staleBadgeHtml +
              '<span class="status-badge ' + stateMeta.cssClass + '">' +
                '<span class="status-glyph">' + stateMeta.glyph + '</span>' +
                '<span>' + escapeHtml(stateMeta.labelRu) + '</span>' +
              '</span>' +
              '<svg class="ui-icon" style="color: var(--text-tertiary);"><use href="#icon-arrow-right"></use></svg>' +
            '</div>' +
          '</div>';
        },

        renderDecisions() {
          const container = document.getElementById('decisions-timeline-container');
          container.innerHTML = METO_STORE.decisions.map(dec => {
            const stateMeta = METO_STORE.temporalStates[dec.state] || METO_STORE.temporalStates.SUPPORTED;

            let altsHtml = '';
            if (dec.rejectedAlternatives && dec.rejectedAlternatives.length > 0) {
              altsHtml = '<div class="rejected-alts">' +
                '<strong>Отклонённые альтернативы:</strong> ' +
                dec.rejectedAlternatives.map(a => escapeHtml(a.title) + ' (' + escapeHtml(a.reasonRu) + ')').join('; ') +
              '</div>';
            }

            return '<div class="decision-entry" onclick="MetoDrawer.open(\'' + dec.memoDrawerId + '\')">' +
              '<div class="decision-header">' +
                '<div class="decision-title">' + escapeHtml(dec.title) + '</div>' +
                '<span class="status-badge ' + stateMeta.cssClass + ' sm">' +
                  '<span class="status-glyph">' + stateMeta.glyph + '</span>' +
                  '<span>' + escapeHtml(stateMeta.labelRu) + '</span>' +
                '</span>' +
              '</div>' +
              '<div class="decision-meta">' +
                '<span>' + escapeHtml(dec.dateRu) + '</span> • <span>Принял: <strong>' + escapeHtml(dec.decider) + '</strong></span>' +
                (dec.ratifier ? ' • <span>Утвердил: ' + escapeHtml(dec.ratifier) + '</span>' : '') +
              '</div>' +
              '<div class="decision-rationale">' +
                '<strong>Обоснование:</strong> ' + escapeHtml(dec.rationaleRu) +
              '</div>' +
              '<div class="decision-compare-grid">' +
                '<div>' +
                  '<div class="compare-label">БЫЛО</div>' +
                  '<div>' + escapeHtml(dec.beforeRu) + '</div>' +
                '</div>' +
                '<div>' +
                  '<div class="compare-label">СТАЛО</div>' +
                  '<div><strong>' + escapeHtml(dec.afterRu) + '</strong></div>' +
                '</div>' +
              '</div>' +
              altsHtml +
            '</div>';
          }).join('');
        },

        renderConflicts() {
          const container = document.getElementById('conflicts-container');
          container.innerHTML = METO_STORE.conflicts.map(c => {
            return '<div class="conflict-card-container">' +
              '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">' +
                '<h2 style="font-size: 18px; font-weight: 800;">' + escapeHtml(c.topic) + '</h2>' +
                '<span class="status-badge status-conflict">' +
                  '<span class="status-glyph">⚡</span>' +
                  '<span>КОНФЛИКТ</span>' +
                '</span>' +
              '</div>' +
              '<div style="font-size: 14px; font-weight: 700; color: #b45309; margin-bottom: 16px;">' +
                'Текущее значение не установлено (ожидает решения руководства)' +
              '</div>' +
              '<div class="conflict-candidates-grid">' +
                '<div class="candidate-card">' +
                  '<div class="candidate-title">' +
                    '<span>' + escapeHtml(c.sideA.value) + '</span>' +
                    '<span class="status-badge status-supported sm"><span class="status-glyph">◈</span><span>ПОДТВЕРЖДЕНО</span></span>' +
                  '</div>' +
                  '<div class="candidate-meta">' +
                    '<span>Источник: <strong>' + escapeHtml(c.sideA.sourceSystemRu) + '</strong> (' + escapeHtml(c.sideA.dateRu) + ')</span><br>' +
                    '<span>Автор: ' + escapeHtml(c.sideA.author) + '</span>' +
                  '</div>' +
                  '<div class="candidate-args">' +
                    '<strong>Аргументы:</strong> ' + escapeHtml(c.sideA.argumentRu) +
                  '</div>' +
                '</div>' +
                '<div class="candidate-card">' +
                  '<div class="candidate-title">' +
                    '<span>' + escapeHtml(c.sideB.value) + '</span>' +
                    '<span class="status-badge status-supported sm"><span class="status-glyph">◈</span><span>ПОДТВЕРЖДЕНО</span></span>' +
                  '</div>' +
                  '<div class="candidate-meta">' +
                    '<span>Источник: <strong>' + escapeHtml(c.sideB.sourceSystemRu) + '</strong> (' + escapeHtml(c.sideB.dateRu) + ')</span><br>' +
                    '<span>Автор: ' + escapeHtml(c.sideB.author) + '</span>' +
                  '</div>' +
                  '<div class="candidate-args">' +
                    '<strong>Аргументы:</strong> ' + escapeHtml(c.sideB.argumentRu) +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">' +
                '<button class="btn btn-secondary btn-sm" onclick="MetoDrawer.open(\'' + c.memoDrawerId + '\')">' +
                  '<span>Сверить первоисточники</span>' +
                '</button>' +
                '<button class="btn btn-primary btn-sm" onclick="MetoApp.openResolutionModal()">' +
                  '<span>Утвердить решение техсовета</span>' +
                '</button>' +
              '</div>' +
            '</div>';
          }).join('');
        },

        setupEvents() {
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
              if (MetoDrawer.isOpen) {
                MetoDrawer.close();
                return;
              }
              const modal = document.getElementById('resolution-modal');
              if (modal && modal.classList.contains('open')) {
                this.closeResolutionModal();
                return;
              }
            }

            if (MetoDrawer.isOpen) return;

            if (e.key === '1') MetoRouter.navigate('today');
            if (e.key === '2') MetoRouter.navigate('state');
            if (e.key === '3') MetoRouter.navigate('decisions');
            if (e.key === '4') MetoRouter.navigate('conflicts');
            if (e.key === 'd' || e.key === 'D') MetoDrawer.open('memo-scenario-1');
          });
        },

        handleDrawerAction() {
          if (MetoDrawer.activeId === 'memo-scenario-2') {
            this.openResolutionModal();
          } else {
            this.showToast('Изменение уже зафиксировано в памяти проекта.');
            MetoDrawer.close();
          }
        },

        openResolutionModal() {
          const modal = document.getElementById('resolution-modal');
          if (modal) modal.classList.add('open');
        },

        closeResolutionModal() {
          const modal = document.getElementById('resolution-modal');
          if (modal) modal.classList.remove('open');
        },

        submitResolution() {
          const choice = document.querySelector('input[name="db_choice"]:checked')?.value || 'PostgreSQL 16';
          
          const fact = METO_STORE.facts.find(f => f.id === 'fact-db-engine');
          if (fact) {
            fact.canonicalState = 'CURRENT';
            fact.currentValueDisplay = choice + ' (Утверждено техсоветом)';
          }

          METO_STORE.metrics.activeConflicts = 0;
          document.getElementById('metric-conflicts').textContent = '0';

          this.renderToday();
          this.renderState();
          this.closeResolutionModal();
          MetoDrawer.close();

          this.showToast('Решение утверждено: ' + choice + '. Статус переведён в CURRENT.');
        }
      };

      window.MetoStore = METO_STORE;
      window.MetoDrawer = MetoDrawer;
      window.MetoRouter = MetoRouter;
      window.MetoApp = MetoApp;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MetoApp.init());
      } else {
        MetoApp.init();
      }
    })();