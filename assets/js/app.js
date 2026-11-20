    // =========================================================================
    // 1. STATE & INITIAL SEED DATA (Synced with 1:1 Screenshot Metrics)
    // =========================================================================
    const STORAGE_KEY = 'luminaed_command_state_v1';

    let appState = loadState();
    let activeView = 'today-command';
    let feedFilter = 'All';
    let searchQuery = '';
    let sortField = 'default';
    let selectedIds = new Set();
    let currentPage = 1;
    const ITEMS_PER_PAGE = 5;
    let isCompactSidebar = false;
    let hasAnimatedCounters = false;

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.items)) return parsed;
        }
      } catch (e) {
        console.warn('Storage read fallback', e);
      }
      return {
        items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
        completedTodayCount: 2, // 2 done out of 10 total = 20% clearing velocity (matches screenshot!)
        weeklyHoursSaved: 4.8
      };
    }

    function persistState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      } catch (e) {
        console.warn('Storage write fallback', e);
      }
    }

    function resetDemoData() {
      localStorage.removeItem(STORAGE_KEY);
      appState = {
        items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
        completedTodayCount: 2,
        weeklyHoursSaved: 4.8
      };
      selectedIds.clear();
      feedFilter = 'All';
      searchQuery = '';
      currentPage = 1;
      hasAnimatedCounters = false;
      renderAll();
      showToast('Data berhasil dikembalikan ke kondisi awal (Default)', 'info');
    }

    // =========================================================================
    // 2. COMPUTED METRICS (Live Sync Between Feed, Sidebar & KPI Cards)
    // =========================================================================
    function getMetrics() {
      const pending = appState.items.filter(i => !i.completed);
      const replyCount = pending.filter(i => i.category === 'Needs Reply').length;
      const gradeCount = pending.filter(i => i.category === 'Grade').length;
      const flagsCount = pending.filter(i => i.category === 'Student Flags').length;
      const highPriorityCount = pending.filter(i => i.priority === 'High').length;
      const totalMinutesSaved = pending.reduce((acc, item) => acc + Number(item.timeSaved || 0), 0);

      const totalDayLoad = pending.length + appState.completedTodayCount;
      const velocityPct = totalDayLoad > 0
        ? Math.min(100, Math.round((appState.completedTodayCount / totalDayLoad) * 100))
        : 100;

      return {
        pending,
        totalPending: pending.length,
        replyCount,
        gradeCount,
        flagsCount,
        highPriorityCount,
        totalMinutesSaved,
        velocityPct,
        weeklyHoursSaved: appState.weeklyHoursSaved
      };
    }

    function padZero(num) {
      return num < 10 ? `0${num}` : `${num}`;
    }

    // =========================================================================
    // 3. NAVIGATION & SIDEBAR RENDERING
    // =========================================================================
    function renderSidebar() {
      const m = getMetrics();
      const navItems = [
        { id: 'today-command', label: 'Today Command', icon: 'layout-grid', badge: m.totalPending, primaryBadge: true },
        { id: 'grading-queue', label: 'Grading Queue', icon: 'check-square', badge: m.gradeCount },
        { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: 12 },
        { id: 'student-flags', label: 'Student Flags', icon: 'flag', badge: m.flagsCount + 5 },
        { id: 'tool-stack', label: 'Tool Stack', icon: 'wrench', badge: null },
        { id: 'class-roster', label: 'Class Roster', icon: 'users', badge: null },
        { id: 'schedule', label: 'Schedule', icon: 'calendar', badge: null },
        { id: 'time-saved', label: 'Time Saved', icon: 'hourglass', badge: 3 },
        { id: 'settings', label: 'Settings', icon: 'settings', badge: null }
      ];

      const navContainer = document.getElementById('sidebarNav');
      navContainer.innerHTML = navItems.map(item => {
        const isActive = activeView === item.id;
        const baseClasses = isActive
          ? 'bg-slate-100/90 text-slate-900 font-semibold shadow-2xs'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium';

        let badgeHtml = '';
        if (item.badge !== null) {
          if (item.primaryBadge) {
            badgeHtml = `<span class="sidebar-label w-5 h-5 rounded-full bg-obsidian text-white text-[11px] font-semibold flex items-center justify-center tabular-nums">${item.badge}</span>`;
          } else {
            badgeHtml = `<span class="sidebar-label text-[11.5px] font-medium text-slate-400 tabular-nums">${item.badge}</span>`;
          }
        }

        return `
          <button
            onclick="switchView('${item.id}')"
            class="w-full px-3 py-2.5 rounded-xl text-[13px] flex items-center justify-between gap-2.5 transition-all ${baseClasses}"
          >
            <span class="flex items-center gap-3 min-w-0">
              <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}"></i>
              <span class="sidebar-label truncate">${item.label}</span>
            </span>
            ${badgeHtml}
          </button>
        `;
      }).join('');
    }

    function switchView(viewId) {
      activeView = viewId;
      toggleMobileSidebar(false);
      renderAll();
      document.getElementById('mainScrollArea').scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleMobileSidebar(open) {
      const sidebar = document.getElementById('appSidebar');
      const backdrop = document.getElementById('mobileBackdrop');
      if (open) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
      } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      }
    }

    function toggleCompactSidebar() {
      isCompactSidebar = !isCompactSidebar;
      const sidebar = document.getElementById('appSidebar');
      const labels = document.querySelectorAll('.sidebar-label');
      const brandTitle = document.getElementById('brandTitle');

      if (isCompactSidebar) {
        sidebar.classList.remove('w-[244px]');
        sidebar.classList.add('w-[76px]');
        labels.forEach(el => el.classList.add('hidden'));
        brandTitle.classList.add('hidden');
      } else {
        sidebar.classList.add('w-[244px]');
        sidebar.classList.remove('w-[76px]');
        labels.forEach(el => el.classList.remove('hidden'));
        brandTitle.classList.remove('hidden');
      }
    }

    // =========================================================================
    // 4. DONUT CHART SVG BUILDER (Exact 3-Segment Rounded Geometry)
    // =========================================================================
    function buildDonutSvg(replyCount, gradeCount, flagsCount, total) {
      const radius = 40;
      const circumference = 2 * Math.PI * radius; // ~251.32
      const safeTotal = Math.max(total, 1);

      const segments = [
        { value: replyCount, color: '#10B981' }, // Emerald Green (Reply)
        { value: gradeCount, color: '#F59E0B' }, // Warm Amber Gold (Grade)
        { value: flagsCount, color: '#F43F5E' }  // Coral Rose (Flags)
      ].filter(s => s.value > 0);

      const gap = segments.length > 1 ? 10 : 0;
      let cumulativeOffset = 0;

      const circlesHtml = segments.map(seg => {
        const rawLength = (seg.value / safeTotal) * circumference;
        const dashLength = Math.max(4, rawLength - gap);
        const dashOffset = -cumulativeOffset;
        cumulativeOffset += rawLength;

        return `
          <circle
            class="donut-segment"
            cx="52"
            cy="52"
            r="${radius}"
            fill="transparent"
            stroke="${seg.color}"
            stroke-width="7.5"
            stroke-linecap="round"
            stroke-dasharray="${dashLength.toFixed(2)} ${circumference.toFixed(2)}"
            stroke-dashoffset="${dashOffset.toFixed(2)}"
          />
        `;
      }).join('');

      return `
        <div class="relative w-[104px] h-[104px] shrink-0 flex items-center justify-center">
          <svg class="w-full h-full -rotate-90" viewBox="0 0 104 104">
            <circle cx="52" cy="52" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="7.5" />
            ${circlesHtml}
          </svg>
          <span class="absolute text-[22px] font-display font-semibold text-slate-900 tabular-nums">${padZero(total)}</span>
        </div>
      `;
    }

    // =========================================================================
    // 5. MAIN DASHBOARD VIEW ("TODAY COMMAND" — 1:1 VISUAL CLONE)
    // =========================================================================
    function renderTodayCommand() {
      const m = getMetrics();

      // Filter, Search & Sort Feed Items
      let filtered = m.pending.filter(item => {
        const matchesCat = feedFilter === 'All' || item.category === feedFilter;
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery = !q ||
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.gradeLevel.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });

      if (sortField === 'priority') {
        const rank = { High: 1, Medium: 2, Low: 3 };
        filtered.sort((a, b) => rank[a.priority] - rank[b.priority]);
      } else if (sortField === 'time') {
        filtered.sort((a, b) => b.timeSaved - a.timeSaved);
      } else if (sortField === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      }

      const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
      if (currentPage > totalPages) currentPage = totalPages;
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

      const priorityPill = (prio) => {
        if (prio === 'High') return 'bg-rose-50 text-rose-600 border border-rose-100';
        if (prio === 'Medium') return 'bg-amber-50 text-amber-600 border border-amber-100';
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      };

      return `
        <!-- Hero Greeting Section -->
        <section class="px-4 sm:px-7 pt-3 pb-6 animate-stagger" style="--stagger-index: 0">
          <p class="text-[12.5px] font-medium text-slate-500">Monday, September 1 2026</p>
          <h1 class="font-display text-[28px] sm:text-[34px] font-semibold tracking-tight text-slate-900 leading-[1.18] mt-1">
            Good morning, Nadia!
          </h1>
          <p class="text-[13.5px] text-slate-500 mt-1.5">
            A few high-priority actions need your attention.
          </p>
        </section>

        <!-- ROW 1: 3-Column KPI & Intelligence Cards -->
        <section class="px-4 sm:px-7 grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <!-- Card 1: Urgent Morning Triage -->
          <div class="kpi-card bg-white rounded-[18px] p-5 border border-slate-100 shadow-card flex flex-col justify-between min-h-[182px] animate-stagger" style="--stagger-index: 1">
            <div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-[12.5px] font-medium text-slate-600">
                  <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
                  <span>Urgent Morning Triage</span>
                </div>
              </div>

              <div class="flex items-baseline gap-2.5 mt-3.5">
                <span id="kpiPendingCount" class="font-display text-[36px] font-semibold tracking-tight text-slate-900 leading-none tabular-nums">
                  ${padZero(m.totalPending)}
                </span>
                <span class="text-[12.5px] text-slate-400">Items pending</span>
              </div>

              <div class="flex flex-wrap items-center gap-1.5 text-[11.5px] text-slate-500 mt-2.5">
                <span>${m.highPriorityCount} high priority</span>
                <span class="text-slate-300">•</span>
                <span>${m.totalMinutesSaved} min saved</span>
                <span class="text-slate-300">•</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium text-[11px]">
                  +12.4% speed
                </span>
              </div>
            </div>

            <div class="pt-4 mt-2">
              <div class="flex items-center justify-between text-[11.5px] mb-1.5">
                <span class="text-slate-500">Today's Triage Clearing Velocity</span>
                <span class="font-semibold text-slate-800 tabular-nums">${m.velocityPct}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-brand-600 rounded-full transition-all duration-500" style="width: ${m.velocityPct}%"></div>
              </div>
            </div>
          </div>

          <!-- Card 2: Workload Category Breakdown -->
          <div class="kpi-card bg-white rounded-[18px] p-5 border border-slate-100 shadow-card flex flex-col justify-between min-h-[182px] animate-stagger" style="--stagger-index: 2">
            <div class="flex items-center gap-2 text-[12.5px] font-medium text-slate-600">
              <i data-lucide="pie-chart" class="w-4 h-4 text-brand-500"></i>
              <span>Workload Category Breakdown</span>
            </div>

            <div class="flex items-center justify-between gap-5 my-auto pt-2">
              ${buildDonutSvg(m.replyCount, m.gradeCount, m.flagsCount, m.totalPending)}

              <div class="flex-1 space-y-2.5">
                <button onclick="setFeedFilter('Needs Reply')" class="w-full flex items-center justify-between group text-left">
                  <span class="flex items-center gap-2 text-[12px] text-slate-500 group-hover:text-slate-900">
                    <span class="w-2.5 h-2.5 rounded-[3px] bg-emerald-500"></span>
                    <span>Reply</span>
                  </span>
                  <span class="text-[15px] font-display font-semibold text-slate-900 tabular-nums">${padZero(m.replyCount)}</span>
                </button>

                <button onclick="setFeedFilter('Grade')" class="w-full flex items-center justify-between group text-left">
                  <span class="flex items-center gap-2 text-[12px] text-slate-500 group-hover:text-slate-900">
                    <span class="w-2.5 h-2.5 rounded-[3px] bg-amber-500"></span>
                    <span>Grade</span>
                  </span>
                  <span class="text-[15px] font-display font-semibold text-slate-900 tabular-nums">${padZero(m.gradeCount)}</span>
                </button>

                <button onclick="setFeedFilter('Student Flags')" class="w-full flex items-center justify-between group text-left">
                  <span class="flex items-center gap-2 text-[12px] text-slate-500 group-hover:text-slate-900">
                    <span class="w-2.5 h-2.5 rounded-[3px] bg-rose-500"></span>
                    <span>Flags</span>
                  </span>
                  <span class="text-[15px] font-display font-semibold text-slate-900 tabular-nums">${padZero(m.flagsCount)}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Card 3: AI Intelligence Brief -->
          <div class="kpi-card bg-white rounded-[18px] p-5 border border-slate-100 shadow-card flex flex-col justify-between min-h-[182px] animate-stagger" style="--stagger-index: 3">
            <div>
              <div class="flex items-center gap-2 text-[12.5px] font-medium text-slate-600">
                <i data-lucide="sparkles" class="w-4 h-4 text-accent-500"></i>
                <span>AI Intelligence Brief</span>
              </div>

              <div class="flex items-baseline gap-2.5 mt-3.5">
                <span id="kpiHoursSaved" class="font-display text-[36px] font-semibold tracking-tight text-slate-900 leading-none tabular-nums">
                  ${m.weeklyHoursSaved.toFixed(1)}h
                </span>
                <span class="text-[12.5px] text-slate-400">Saved This Week</span>
              </div>

              <p class="text-[12px] text-slate-500 leading-relaxed mt-2.5">
                8 EdTech apps, one view: <strong class="font-semibold text-slate-800">${Math.max(1, m.flagsCount + 2)} students</strong> need review, <strong class="font-semibold text-slate-800">${Math.max(1, Math.min(3, m.replyCount))} parent</strong> message awaits a reply.
              </p>
            </div>

            <div class="pt-3">
              <button onclick="toggleAiDrawer(true)" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 text-[12px] font-medium text-slate-700 transition-all">
                <span>View Full Summary</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </section>

        <!-- ROW 2: Today's Teaching Schedule -->
        <section class="mx-4 sm:mx-7 mt-5 bg-white rounded-[18px] p-5 border border-slate-100 shadow-card animate-stagger" style="--stagger-index: 4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <i data-lucide="calendar-days" class="w-4 h-4 text-emerald-500"></i>
              <h2 class="font-display text-[13.5px] font-semibold text-slate-800">Today's Teaching Schedule</h2>
            </div>
            <button onclick="switchView('schedule')" class="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-brand-600 transition-colors">
              <span>Full Schedule</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <div class="flex gap-3.5 overflow-x-auto custom-scrollbar pb-1.5">
            ${TEACHING_SCHEDULE.map(cls => {
              const isOngoing = cls.status === 'Ongoing';
              return `
                <div class="min-w-[248px] flex-1 rounded-[14px] border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-brand-200/80 hover:shadow-xs p-4 transition-all">
                  <div class="flex items-center gap-2 text-[11px]">
                    <span class="font-semibold ${cls.periodColor}">${cls.period}</span>
                    <span class="text-slate-400">${cls.time}</span>
                  </div>

                  <div class="border-l-[2.5px] ${cls.accentBorder} pl-2.5 my-3">
                    <h3 class="text-[13.5px] font-semibold text-slate-900 leading-snug">${cls.course}</h3>
                    <p class="text-[11.5px] text-slate-400 mt-0.5 truncate">${cls.topic}</p>
                  </div>

                  <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
                    <div>
                      <p class="text-[10.5px] text-slate-400">Room</p>
                      <p class="text-[12px] font-medium text-slate-700 mt-0.5">${cls.room}</p>
                    </div>
                    <div>
                      <p class="text-[10.5px] text-slate-400">Status</p>
                      <p class="text-[12px] font-medium mt-0.5 flex items-center gap-1 ${isOngoing ? 'text-emerald-600' : 'text-slate-500'}">
                        <i data-lucide="${isOngoing ? 'play' : 'clock'}" class="w-3 h-3"></i>
                        <span>${cls.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- ROW 3: Today Command Feed (Full CRUD Table) -->
        <section class="mx-4 sm:mx-7 mt-5 bg-white rounded-[18px] p-5 border border-slate-100 shadow-card animate-stagger" style="--stagger-index: 5">
          <!-- Feed Header & Filter Pills -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-2.5">
              <i data-lucide="list-checks" class="w-4 h-4 text-accent-500"></i>
              <h2 class="font-display text-[13.5px] font-semibold text-slate-800">Today Command Feed</h2>
              ${selectedIds.size > 0 ? `
                <button onclick="bulkDeleteSelected()" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-medium transition-colors">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                  <span>Hapus (${selectedIds.size})</span>
                </button>
              ` : ''}
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Filter Pills -->
              ${[
                { key: 'All', label: `All (${padZero(m.totalPending)})` },
                { key: 'Grade', label: `Grade (${padZero(m.gradeCount)})` },
                { key: 'Needs Reply', label: `Needs Reply (${padZero(m.replyCount)})` },
                { key: 'Student Flags', label: `Student Flags (${padZero(m.flagsCount)})` }
              ].map(tab => {
                const active = feedFilter === tab.key;
                return `
                  <button
                    onclick="setFeedFilter('${tab.key}')"
                    class="px-3.5 py-1.5 rounded-full text-[11.5px] font-medium transition-all ${
                      active
                        ? 'bg-obsidian text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/70'
                    }"
                  >
                    ${tab.label}
                  </button>
                `;
              }).join('')}

              <!-- Sort Selector -->
              <div class="relative">
                <select onchange="handleSortChange(this.value)" title="Urutkan Feed" class="appearance-none pl-3 pr-7 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/70 text-[11.5px] font-medium text-slate-600 focus:outline-none cursor-pointer">
                  <option value="default" ${sortField === 'default' ? 'selected' : ''}>Sort: Default</option>
                  <option value="priority" ${sortField === 'priority' ? 'selected' : ''}>Priority</option>
                  <option value="time" ${sortField === 'time' ? 'selected' : ''}>Time Saved</option>
                  <option value="title" ${sortField === 'title' ? 'selected' : ''}>Title A–Z</option>
                </select>
                <i data-lucide="list-filter" class="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              </div>

              <!-- Add New Item Button -->
              <button onclick="openItemModal()" title="Tambah Tugas Baru" class="w-8 h-8 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white flex items-center justify-center transition-colors">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Responsive Horizontal Scroll Table Wrapper -->
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full min-w-[780px] text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[11px] font-medium text-slate-400">
                  <th class="py-2.5 pl-2 pr-2 w-8">
                    <input
                      type="checkbox"
                      onchange="toggleSelectAll(this.checked)"
                      ${paginatedItems.length > 0 && paginatedItems.every(i => selectedIds.has(i.id)) ? 'checked' : ''}
                      class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                  <th class="py-2.5 px-2">Item</th>
                  <th class="py-2.5 px-3">Priority</th>
                  <th class="py-2.5 px-3">Source & Class</th>
                  <th class="py-2.5 px-3">Time Saved</th>
                  <th class="py-2.5 pl-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100/80 text-[13px]">
                ${paginatedItems.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-10 text-center">
                      <div class="inline-flex flex-col items-center">
                        <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                          <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                        </div>
                        <p class="text-[13px] font-medium text-slate-700">Tidak ada item yang cocok</p>
                        <p class="text-[11.5px] text-slate-400 mt-0.5">Ubah filter pencarian atau tambahkan item tugas baru.</p>
                      </div>
                    </td>
                  </tr>
                ` : paginatedItems.map(item => `
                  <tr class="group hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 pl-2 pr-2">
                      <input
                        type="checkbox"
                        onchange="toggleRowSelect('${item.id}', this.checked)"
                        ${selectedIds.has(item.id) ? 'checked' : ''}
                        class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                    <td class="py-3.5 px-2">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full ${item.iconBg || 'bg-brand-50 text-brand-600'} flex items-center justify-center shrink-0">
                          <i data-lucide="${item.icon || 'file-text'}" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0">
                          <p class="font-semibold text-slate-900 text-[13px] leading-snug">${item.title}</p>
                          <p class="text-[11.5px] text-slate-400 mt-0.5">${item.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-3">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${priorityPill(item.priority)}">
                        ${item.priority}
                      </span>
                    </td>
                    <td class="py-3.5 px-3">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[12px] font-medium text-slate-700">${item.gradeLevel}</span>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-[11px] text-slate-600">
                          ${item.source}
                        </span>
                      </div>
                    </td>
                    <td class="py-3.5 px-3">
                      <span class="inline-flex items-center gap-1.5 text-[12px] text-slate-600 tabular-nums">
                        <span class="w-4 h-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                          <i data-lucide="zap" class="w-2.5 h-2.5"></i>
                        </span>
                        +${item.timeSaved} min saved
                      </span>
                    </td>
                    <td class="py-3.5 pl-3 pr-2 text-right">
                      <div class="inline-flex items-center justify-end gap-1.5">
                        <button
                          onclick="completeCommandItem('${item.id}')"
                          class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-brand-600 hover:border-brand-600 hover:text-white text-[12px] font-medium text-slate-800 transition-all shadow-2xs"
                        >
                          <span>${item.actionLabel}</span>
                          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="openItemModal('${item.id}')" title="Edit Item" class="p-1.5 rounded-full text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="promptDeleteItem('${item.id}')" title="Hapus Item" class="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-500">
            <span>Menampilkan <strong class="text-slate-800">${paginatedItems.length}</strong> dari <strong class="text-slate-800">${filtered.length}</strong> item aktif</span>
            <div class="flex items-center gap-1.5">
              <button
                onclick="changePage(${currentPage - 1})"
                ${currentPage <= 1 ? 'disabled' : ''}
                class="px-3 py-1 rounded-full border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                Prev
              </button>
              <span class="px-2.5 py-1 font-semibold text-slate-800">Hal ${currentPage} / ${totalPages}</span>
              <button
                onclick="changePage(${currentPage + 1})"
                ${currentPage >= totalPages ? 'disabled' : ''}
                class="px-3 py-1 rounded-full border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      `;
    }

    // =========================================================================
    // 6. SECONDARY SUB-MENU VIEWS (Complete SPA Experience)
    // =========================================================================
    function renderSubView() {
      const m = getMetrics();

      if (activeView === 'schedule') {
        return `
          <div class="px-4 sm:px-7 pt-3 space-y-5 animate-stagger">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[12px] font-medium text-brand-600">Academic Timetable • Term 1 2026</p>
                <h1 class="font-display text-[26px] font-semibold text-slate-900 mt-0.5">Full Teaching Schedule</h1>
              </div>
              <button onclick="switchView('today-command')" class="px-4 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                ← Kembali ke Today Command
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${TEACHING_SCHEDULE.map(cls => `
                <div class="bg-white rounded-[18px] p-5 border border-slate-100 shadow-card">
                  <div class="flex items-center justify-between">
                    <span class="text-[12px] font-semibold ${cls.periodColor}">${cls.period} • ${cls.time}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cls.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}">${cls.status}</span>
                  </div>
                  <h3 class="font-display text-[17px] font-semibold text-slate-900 mt-2">${cls.course}</h3>
                  <p class="text-[12.5px] text-slate-500 mt-1">${cls.topic}</p>
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
                    <span class="text-slate-500">Ruang: <strong class="text-slate-800">${cls.room}</strong></span>
                    <button onclick="showToast('Lesson plan untuk ${cls.course} siap digunakan!', 'success')" class="text-brand-600 font-medium hover:underline">Buka Lesson Plan →</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (activeView === 'class-roster') {
        return `
          <div class="px-4 sm:px-7 pt-3 space-y-5 animate-stagger">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[12px] font-medium text-brand-600">Student Directory & Performance</p>
                <h1 class="font-display text-[26px] font-semibold text-slate-900 mt-0.5">Class Roster</h1>
              </div>
              <button onclick="switchView('today-command')" class="px-4 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                ← Kembali ke Today Command
              </button>
            </div>
            <div class="bg-white rounded-[18px] p-5 border border-slate-100 shadow-card overflow-x-auto custom-scrollbar">
              <table class="w-full min-w-[640px] text-left">
                <thead>
                  <tr class="border-b border-slate-100 text-[11.5px] text-slate-400">
                    <th class="py-3">Student</th>
                    <th class="py-3">Class</th>
                    <th class="py-3">Grade Avg</th>
                    <th class="py-3">Attendance</th>
                    <th class="py-3">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-[13px]">
                  ${CLASS_ROSTER_DATA.map(st => `
                    <tr class="hover:bg-slate-50/70">
                      <td class="py-3.5 flex items-center gap-3">
                        <img src="${st.avatar}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect width=%2280%22 height=%2280%22 fill=%22%230EA5E9%22/></svg>';" class="w-8 h-8 rounded-full object-cover" alt="${st.name}" />
                        <span class="font-semibold text-slate-900">${st.name}</span>
                      </td>
                      <td class="py-3.5 text-slate-600">${st.grade}</td>
                      <td class="py-3.5 font-semibold text-slate-800">${st.avg}</td>
                      <td class="py-3.5 text-slate-600">${st.attendance}</td>
                      <td class="py-3.5">
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium ${st.status === 'Needs Review' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}">${st.status}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      if (activeView === 'tool-stack') {
        return `
          <div class="px-4 sm:px-7 pt-3 space-y-5 animate-stagger">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[12px] font-medium text-brand-600">Unified EdTech Integrations</p>
                <h1 class="font-display text-[26px] font-semibold text-slate-900 mt-0.5">Connected Tool Stack</h1>
              </div>
              <button onclick="switchView('today-command')" class="px-4 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                ← Kembali ke Today Command
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${EDTECH_TOOLS.map(tool => `
                <div class="bg-white rounded-[18px] p-5 border border-slate-100 shadow-card flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium">${tool.status}</span>
                      <span class="text-[11px] text-slate-400">${tool.lastSync}</span>
                    </div>
                    <h3 class="font-display font-semibold text-[15px] text-slate-900 mt-3">${tool.name}</h3>
                    <p class="text-[12px] text-slate-500 mt-1">${tool.role}</p>
                  </div>
                  <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px]">
                    <span class="text-slate-400">Impact</span>
                    <span class="font-semibold text-brand-600">${tool.saved}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (activeView === 'settings') {
        return `
          <div class="px-4 sm:px-7 pt-3 space-y-5 animate-stagger">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[12px] font-medium text-brand-600">Workspace & Data Controls</p>
                <h1 class="font-display text-[26px] font-semibold text-slate-900 mt-0.5">Settings & Data Persistence</h1>
              </div>
              <button onclick="switchView('today-command')" class="px-4 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
                ← Kembali ke Today Command
              </button>
            </div>
            <div class="bg-white rounded-[18px] p-6 border border-slate-100 shadow-card max-w-2xl space-y-4">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 class="font-semibold text-[14px] text-slate-900">LocalStorage State Synchronization</h3>
                  <p class="text-[12px] text-slate-500 mt-0.5">Seluruh penambahan, pengeditan, dan penyelesaian tugas tersimpan otomatis di browser Anda.</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11.5px] font-medium">Active</span>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div>
                  <h4 class="font-semibold text-[13.5px] text-slate-900">Reset Data Demo</h4>
                  <p class="text-[12px] text-slate-500">Kembalikan seluruh daftar tugas, grafik donat, dan statistik ke kondisi awal.</p>
                </div>
                <button onclick="resetDemoData()" class="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-[12.5px] font-medium transition-colors">
                  Reset Data Awal
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // Filtered Category Views (Grading Queue, Inbox, Student Flags, Time Saved)
      const categoryMap = {
        'grading-queue': { title: 'Grading Queue', cat: 'Grade', desc: 'Evaluasi laporan praktikum dan tugas kelas yang belum dinilai.' },
        'inbox': { title: 'Unified Educator Inbox', cat: 'Needs Reply', desc: 'Pesan orang tua murid, konselor akademik, dan sinkronisasi rekan guru.' },
        'student-flags': { title: 'Student Intervention Flags', cat: 'Student Flags', desc: 'Deteksi dini kehadiran dan penurunan performa akademik siswa.' },
        'time-saved': { title: 'Weekly Time Saved Analytics', cat: 'All', desc: `Total ${m.weeklyHoursSaved.toFixed(1)} jam dihemat minggu ini melalui otomasi LuminaEd AI.` }
      };

      const info = categoryMap[activeView] || categoryMap['grading-queue'];
      const list = info.cat === 'All' ? m.pending : m.pending.filter(i => i.category === info.cat);

      return `
        <div class="px-4 sm:px-7 pt-3 space-y-5 animate-stagger">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[12px] font-medium text-brand-600">LuminaEd Focused Workspace</p>
              <h1 class="font-display text-[26px] font-semibold text-slate-900 mt-0.5">${info.title}</h1>
              <p class="text-[13px] text-slate-500 mt-1">${info.desc}</p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="openItemModal()" class="px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-[12px] font-medium">+ Tambah Item</button>
              <button onclick="switchView('today-command')" class="px-4 py-2 rounded-full bg-white border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-50">← Today Command</button>
            </div>
          </div>

          <div class="bg-white rounded-[18px] p-5 border border-slate-100 shadow-card space-y-3">
            ${list.length === 0 ? `
              <p class="text-center py-8 text-[13px] text-slate-500">Semua item pada kategori ini telah selesai ditangani!</p>
            ` : list.map(item => `
              <div class="p-4 rounded-2xl border border-slate-100 hover:border-brand-200 flex flex-wrap items-center justify-between gap-3 transition-all">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-[13.5px] text-slate-900">${item.title}</span>
                    <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">${item.gradeLevel}</span>
                  </div>
                  <p class="text-[12px] text-slate-500 mt-0.5">${item.subtitle}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="completeCommandItem('${item.id}')" class="px-3.5 py-1.5 rounded-full bg-obsidian hover:bg-brand-600 text-white text-[12px] font-medium transition-colors">
                    ${item.actionLabel} →
                  </button>
                  <button onclick="openItemModal('${item.id}')" class="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="promptDeleteItem('${item.id}')" class="p-2 rounded-full hover:bg-rose-50 text-rose-500">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // =========================================================================
    // 7. CRUD ACTIONS, FILTERING, COUNT-UP ANIMATION & TOASTS
    // =========================================================================
    function setFeedFilter(category) {
      feedFilter = category;
      currentPage = 1;
      renderAll();
    }

    function handleGlobalSearch(val) {
      searchQuery = val;
      currentPage = 1;
      const clearBtn = document.getElementById('clearGlobalSearchBtn');
      if (clearBtn) clearBtn.classList.toggle('hidden', !val);
      renderViewOnly();
    }

    function clearGlobalSearch() {
      const input = document.getElementById('globalSearchInput');
      if (input) input.value = '';
      handleGlobalSearch('');
    }

    function handleSortChange(val) {
      sortField = val;
      renderViewOnly();
    }

    function changePage(page) {
      currentPage = page;
      renderViewOnly();
    }

    function toggleRowSelect(id, checked) {
      if (checked) selectedIds.add(id);
      else selectedIds.delete(id);
      renderViewOnly();
    }

    function toggleSelectAll(checked) {
      const m = getMetrics();
      const filtered = m.pending.filter(i => feedFilter === 'All' || i.category === feedFilter);
      const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
      const pageItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

      pageItems.forEach(item => {
        if (checked) selectedIds.add(item.id);
        else selectedIds.delete(item.id);
      });
      renderViewOnly();
    }

    function bulkDeleteSelected() {
      const count = selectedIds.size;
      if (count === 0) return;
      appState.items = appState.items.filter(item => !selectedIds.has(item.id));
      selectedIds.clear();
      persistState();
      renderAll();
      showToast(`${count} item berhasil dihapus dari feed`, 'info');
    }

    function completeCommandItem(id) {
      const idx = appState.items.findIndex(i => i.id === id);
      if (idx === -1) return;
      const item = appState.items[idx];
      appState.items.splice(idx, 1);
      selectedIds.delete(id);
      appState.completedTodayCount += 1;
      appState.weeklyHoursSaved = Number((appState.weeklyHoursSaved + (item.timeSaved / 60)).toFixed(1));
      persistState();
      renderAll();
      showToast(`Selesai: "${item.title}" (+${item.timeSaved} min saved)`, 'success');
    }

    function openItemModal(editId = null) {
      const modal = document.getElementById('itemModal');
      const titleEl = document.getElementById('itemModalTitle');
      const idInput = document.getElementById('editItemId');

      if (editId) {
        const item = appState.items.find(i => i.id === editId);
        if (!item) return;
        titleEl.textContent = 'Edit Command Item';
        idInput.value = item.id;
        document.getElementById('fieldTitle').value = item.title;
        document.getElementById('fieldSubtitle').value = item.subtitle;
        document.getElementById('fieldCategory').value = item.category;
        document.getElementById('fieldPriority').value = item.priority;
        document.getElementById('fieldGradeLevel').value = item.gradeLevel;
        document.getElementById('fieldSource').value = item.source;
        document.getElementById('fieldMinutes').value = item.timeSaved;
        document.getElementById('fieldActionLabel').value = item.actionLabel;
      } else {
        titleEl.textContent = 'Add Command Item';
        idInput.value = '';
        document.getElementById('itemForm').reset();
        document.getElementById('fieldGradeLevel').value = '8th Grade';
        document.getElementById('fieldMinutes').value = 15;
        document.getElementById('fieldActionLabel').value = 'Review Item';
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeItemModal() {
      const modal = document.getElementById('itemModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function saveCommandItem(e) {
      e.preventDefault();
      const editId = document.getElementById('editItemId').value;
      const category = document.getElementById('fieldCategory').value;

      const catStyles = {
        'Grade': { icon: 'flask-conical', iconBg: 'bg-brand-50 text-brand-600' },
        'Needs Reply': { icon: 'message-square', iconBg: 'bg-emerald-50 text-emerald-600' },
        'Student Flags': { icon: 'flag', iconBg: 'bg-rose-50 text-rose-500' }
      };

      const payload = {
        title: document.getElementById('fieldTitle').value.trim(),
        subtitle: document.getElementById('fieldSubtitle').value.trim(),
        category,
        priority: document.getElementById('fieldPriority').value,
        gradeLevel: document.getElementById('fieldGradeLevel').value.trim(),
        source: document.getElementById('fieldSource').value,
        timeSaved: Math.max(1, parseInt(document.getElementById('fieldMinutes').value, 10) || 15),
        actionLabel: document.getElementById('fieldActionLabel').value.trim(),
        icon: catStyles[category].icon,
        iconBg: catStyles[category].iconBg,
        completed: false
      };

      if (editId) {
        const idx = appState.items.findIndex(i => i.id === editId);
        if (idx !== -1) {
          appState.items[idx] = { ...appState.items[idx], ...payload };
          showToast('Item berhasil diperbarui', 'success');
        }
      } else {
        appState.items.unshift({
          id: 'cmd-' + Date.now(),
          ...payload
        });
        showToast('Tugas baru ditambahkan ke Today Command Feed', 'success');
      }

      persistState();
      closeItemModal();
      renderAll();
    }

    function promptDeleteItem(id) {
      const item = appState.items.find(i => i.id === id);
      if (!item) return;
      const modal = document.getElementById('deleteModal');
      document.getElementById('deleteModalDesc').textContent = `Hapus "${item.title}" dari antrean aktif Anda?`;
      const btn = document.getElementById('confirmDeleteBtn');
      btn.onclick = () => {
        appState.items = appState.items.filter(i => i.id !== id);
        selectedIds.delete(id);
        persistState();
        closeDeleteModal();
        renderAll();
        showToast('Item berhasil dihapus', 'info');
      };
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeDeleteModal() {
      const modal = document.getElementById('deleteModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function toggleAiDrawer(open) {
      const drawer = document.getElementById('aiDrawer');
      if (open) {
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
      } else {
        drawer.classList.add('hidden');
        drawer.classList.remove('flex');
      }
    }

    function toggleNotificationMenu() {
      document.getElementById('notificationDropdown').classList.toggle('hidden');
    }

    function markNotificationsRead() {
      document.getElementById('notifDot').classList.add('hidden');
      document.getElementById('notificationDropdown').classList.add('hidden');
      showToast('Semua notifikasi telah ditandai dibaca', 'info');
    }

    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      const accent = type === 'success' ? 'border-emerald-200 bg-white text-slate-800' : 'border-brand-200 bg-white text-slate-800';
      const dotColor = type === 'success' ? 'bg-emerald-500' : 'bg-brand-600';

      toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${accent} shadow-lg text-[12.5px] font-medium transform translate-y-2 opacity-0 transition-all duration-300`;
      toast.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor}"></span><span>${message}</span>`;
      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });

      setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    }

    function runInitialCountUp() {
      if (hasAnimatedCounters || activeView !== 'today-command') return;
      hasAnimatedCounters = true;
      const m = getMetrics();
      const pendingEl = document.getElementById('kpiPendingCount');
      const hoursEl = document.getElementById('kpiHoursSaved');
      if (!pendingEl || !hoursEl) return;

      const duration = 550;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min(1, (now - start) / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const curPending = Math.round(ease * m.totalPending);
        const curHours = (ease * m.weeklyHoursSaved).toFixed(1);

        pendingEl.textContent = padZero(curPending);
        hoursEl.textContent = `${curHours}h`;

        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function renderViewOnly() {
      const container = document.getElementById('viewContainer');
      container.innerHTML = activeView === 'today-command' ? renderTodayCommand() : renderSubView();
      if (window.lucide) lucide.createIcons();
    }

    function renderAll() {
      renderSidebar();
      renderViewOnly();
      runInitialCountUp();
    }

    // Close notification dropdown on outside click
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notificationDropdown');
      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!e.target.closest('#notificationDropdown') && !e.target.closest('button[onclick="toggleNotificationMenu()"]')) {
          dropdown.classList.add('hidden');
        }
      }
    });

    // Boot Application
    document.addEventListener('DOMContentLoaded', () => {
      renderAll();
    });
