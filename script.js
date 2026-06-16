/* ===================================================================
   FITCLUB — SCRIPT.JS
   Maneja: navegación, animaciones, auth (login/registro), área de
   socios, panel admin, dashboard con gráficos, reservas, rutinas,
   progreso de peso/medidas, contacto y galería con lightbox.
   Persistencia: LocalStorage.
=================================================================== */

(function () {
  'use strict';

  /* ============ KEYS DE LOCALSTORAGE ============ */
  const LS_USERS = 'fitclub_users';
  const LS_SESSION = 'fitclub_session';
  const LS_BOOKINGS = 'fitclub_bookings';
  const LS_PROGRESS = 'fitclub_progress';
  const LS_HISTORY = 'fitclub_history';
  const LS_ROUTINES = 'fitclub_routines';
  const LS_SCHEDULE = 'fitclub_schedule';
  const LS_DISCIPLINES = 'fitclub_disciplines';

  /* ============ HELPERS DE STORAGE ============ */
  const getData = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  const setData = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ============ SEED INICIAL DE DATOS ============ */
  function seedData() {
    if (!getData(LS_USERS, null)) {
      setData(LS_USERS, [
        {
          id: 'admin-1',
          name: 'Administrador FitClub',
          email: 'admin@fitclub.com',
          password: 'admin123',
          role: 'admin',
          plan: 'Premium',
          since: '2023-01-10'
        },
        {
          id: 'demo-1',
          name: 'Juan Pérez',
          email: 'juan@demo.com',
          password: 'demo123',
          role: 'member',
          plan: 'Plus',
          since: '2024-03-15'
        }
      ]);
    }
    if (!getData(LS_ROUTINES, null)) setData(LS_ROUTINES, {});
    if (!getData(LS_BOOKINGS, null)) setData(LS_BOOKINGS, []);
    if (!getData(LS_PROGRESS, null)) setData(LS_PROGRESS, {});
    if (!getData(LS_HISTORY, null)) setData(LS_HISTORY, {});
    if (!getData(LS_DISCIPLINES, null)) {
      setData(LS_DISCIPLINES, [
        { id: uid(), name: 'Musculación', level: 'Todos los niveles', desc: 'Hipertrofia y fuerza con planificación progresiva.' },
        { id: uid(), name: 'Running', level: 'Intermedio', desc: 'Planes de carrera y técnica de pisada.' },
        { id: uid(), name: 'Cross Training', level: 'Avanzado', desc: 'WODs de alta intensidad.' },
        { id: uid(), name: 'Calistenia', level: 'Intermedio', desc: 'Control corporal y fuerza relativa.' },
        { id: uid(), name: 'Group Training', level: 'Todos los niveles', desc: 'Clases grupales dinámicas.' }
      ]);
    }
    if (!getData(LS_SCHEDULE, null)) {
      setData(LS_SCHEDULE, [
        ['07:00', 'Lun / Mié / Vie', '—', 'Mar / Jue', '—', 'Lun a Sáb'],
        ['09:00', '—', 'Lun / Mié / Vie', '—', 'Mar / Jue', 'Lun a Sáb'],
        ['12:00', '—', '—', 'Lun a Vie', '—', 'Lun a Sáb'],
        ['18:00', 'Mar / Jue', 'Lun / Mié / Vie', '—', 'Lun / Mié / Vie', 'Lun a Sáb'],
        ['20:00', 'Lun / Mié / Vie', 'Mar / Jue', 'Lun / Mié / Vie', 'Sáb', 'Lun a Sáb']
      ]);
    }
    const progress = getData(LS_PROGRESS, {});
    if (!progress['demo-1']) {
      progress['demo-1'] = [
        { date: '2026-04-01', weight: 82, waist: 90, arm: 34 },
        { date: '2026-05-01', weight: 80, waist: 88, arm: 35 },
        { date: '2026-06-01', weight: 78, waist: 86, arm: 35.5 }
      ];
      setData(LS_PROGRESS, progress);
    }
    const history = getData(LS_HISTORY, {});
    if (!history['demo-1']) {
      history['demo-1'] = [
        { date: '2026-06-10', discipline: 'Musculación', notes: 'Tren superior completo' },
        { date: '2026-06-12', discipline: 'Cross Training', notes: 'WOD 18min AMRAP' },
        { date: '2026-06-14', discipline: 'Running', notes: '5km en cinta' }
      ];
      setData(LS_HISTORY, history);
    }
    const routines = getData(LS_ROUTINES, {});
    if (!routines['demo-1']) {
      routines['demo-1'] = 'Lunes: Sentadilla 4x10, Press banca 4x8, Remo 3x12\nMiércoles: Peso muerto 4x6, Press militar 4x8\nViernes: Zancadas 3x12, Dominadas 4x8';
      setData(LS_ROUTINES, routines);
    }
  }
  seedData();

  /* ============ TOAST ============ */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  /* ============ LOADER ============ */
  window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    setTimeout(() => loader.classList.add('hidden'), 350);
  });

  /* ============ NAVBAR SCROLL + ACTIVE LINK ============ */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    let current = 'home';
    sections.forEach((sec) => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  });

  /* ============ MOBILE MENU ============ */
  const hamburger = document.getElementById('hamburger');
  const navLinksWrap = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    const isOpen = navLinksWrap.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });
  navLinksWrap.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinksWrap.classList.remove('open');
      hamburger.classList.remove('active');
    })
  );

  /* ============ SCROLL REVEAL ============ */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ============ HERO STATS COUNTER ============ */
  const statNums = document.querySelectorAll('.stat-num');
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  statNums.forEach((el) => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  /* ============ MODALES GENÉRICOS ============ */
  function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach((m) => closeModal(m.id));
    }
  });

  /* ============ SESIÓN ============ */
  const getSession = () => getData(LS_SESSION, null);
  const setSession = (userId) => setData(LS_SESSION, userId);
  const clearSession = () => localStorage.removeItem(LS_SESSION);

  function findUserById(id) {
    return getData(LS_USERS, []).find((u) => u.id === id);
  }
  function findUserByEmail(email) {
    return getData(LS_USERS, []).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  function openMemberOrAdmin() {
    const session = getSession();
    const user = session && findUserById(session);
    if (!user) { openModal('authModal'); return; }
    if (user.role === 'admin') openAdminArea();
    else openMemberArea(user);
  }

  /* ============ BOTÓN "INICIAR SESIÓN" DEL NAVBAR / HERO ============ */
  document.getElementById('openLoginBtn').addEventListener('click', () => {
    const session = getSession();
    if (session) openMemberOrAdmin();
    else openModal('authModal');
  });
  document.getElementById('heroStartBtn').addEventListener('click', () => {
    const session = getSession();
    if (session) openMemberOrAdmin();
    else openModal('authModal');
  });

  document.querySelectorAll('.auth-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
    });
  });

  /* ============ LOGIN FORM ============ */
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginError');

    const user = findUserByEmail(email);
    if (!user || user.password !== pass) {
      errEl.textContent = 'Email o contraseña incorrectos.';
      return;
    }
    errEl.textContent = '';
    setSession(user.id);
    closeModal('authModal');
    e.target.reset();
    showToast(`¡Bienvenido, ${user.name}!`);
    if (user.role === 'admin') openAdminArea();
    else openMemberArea(user);
  });

  /* ============ REGISTER FORM ============ */
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const plan = document.getElementById('regPlan').value;
    const errEl = document.getElementById('registerError');

    if (findUserByEmail(email)) {
      errEl.textContent = 'Ese email ya está registrado.';
      return;
    }
    errEl.textContent = '';

    const users = getData(LS_USERS, []);
    const newUser = {
      id: uid(),
      name,
      email,
      password: pass,
      role: 'member',
      plan,
      since: new Date().toISOString().slice(0, 10)
    };
    users.push(newUser);
    setData(LS_USERS, users);
    setSession(newUser.id);
    closeModal('authModal');
    e.target.reset();
    showToast(`¡Cuenta creada! Bienvenido a FitClub, ${name}.`);
    openMemberArea(newUser);
  });

  /* ============ PLAN SELECT BUTTONS → abre registro con plan precargado ============ */
  document.querySelectorAll('.plan-select').forEach((btn) => {
    btn.addEventListener('click', () => {
      const session = getSession();
      if (session) {
        showToast('Ya tenés una sesión activa. Gestioná tu plan desde "Mi perfil".');
        openMemberOrAdmin();
        return;
      }
      openModal('authModal');
      document.querySelector('[data-tab="register"]').click();
      document.getElementById('regPlan').value = btn.dataset.plan;
    });
  });

  /* ===================================================================
     ÁREA DE SOCIOS
  =================================================================== */
  const memberArea = document.getElementById('memberArea');
  let currentMemberId = null;
  let weightChartInstance = null;

  function openMemberArea(user) {
    currentMemberId = user.id;
    document.getElementById('memberName').textContent = user.name;
    document.getElementById('memberTopbarName').textContent = user.name;
    document.getElementById('memberPlan').textContent = `Plan ${user.plan}`;
    document.getElementById('memberEmail').textContent = user.email;
    document.getElementById('memberSince').textContent = formatDate(user.since);

    renderRoutine(user.id);
    renderBookings(user.id);
    renderHistory(user.id);
    renderWeightChart(user.id);
    setMinDateBooking();

    memberArea.classList.add('open');
    document.body.style.overflow = 'hidden';
    switchPanel(memberArea, 'memberHome');
  }
  function closeMemberAreaFn() {
    memberArea.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('closeMemberArea').addEventListener('click', closeMemberAreaFn);
  document.getElementById('logoutBtnMember').addEventListener('click', () => {
    clearSession();
    closeMemberAreaFn();
    showToast('Sesión cerrada.');
  });

  function setMinDateBooking() {
    const dayInput = document.getElementById('bookDay');
    dayInput.min = new Date().toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* ---- Rutina (solo lectura para socio) ---- */
  function renderRoutine(userId) {
    const routines = getData(LS_ROUTINES, {});
    document.getElementById('routineContent').textContent = routines[userId] || '';
  }

  /* ---- Reservas ---- */
  document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const discipline = document.getElementById('bookDiscipline').value;
    const day = document.getElementById('bookDay').value;
    const time = document.getElementById('bookTime').value;
    if (!discipline || !day) return;

    const bookings = getData(LS_BOOKINGS, []);
    bookings.push({ id: uid(), userId: currentMemberId, discipline, day, time });
    setData(LS_BOOKINGS, bookings);
    renderBookings(currentMemberId);
    e.target.reset();
    setMinDateBooking();
    showToast('Reserva confirmada.');
  });

  function renderBookings(userId) {
    const bookings = getData(LS_BOOKINGS, []).filter((b) => b.userId === userId);
    const list = document.getElementById('bookingsList');
    list.innerHTML = '';
    if (!bookings.length) {
      list.innerHTML = '<p class="muted">No tenés reservas próximas.</p>';
      return;
    }
    bookings
      .sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time))
      .forEach((b) => {
        const div = document.createElement('div');
        div.className = 'booking-item';
        div.innerHTML = `
          <div><strong>${b.discipline}</strong> <small>· ${formatDate(b.day)} a las ${b.time}</small></div>
          <i class="fa-solid fa-trash delete-icon" data-id="${b.id}"></i>
        `;
        div.querySelector('.delete-icon').addEventListener('click', () => {
          const updated = getData(LS_BOOKINGS, []).filter((x) => x.id !== b.id);
          setData(LS_BOOKINGS, updated);
          renderBookings(userId);
          refreshAdminStatsIfOpen();
          showToast('Reserva cancelada.');
        });
        list.appendChild(div);
      });
  }

  /* ---- Progreso (peso / medidas) ---- */
  document.getElementById('progressForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const weight = parseFloat(document.getElementById('progWeight').value);
    const waist = parseFloat(document.getElementById('progWaist').value) || null;
    const arm = parseFloat(document.getElementById('progArm').value) || null;
    if (!weight) return;

    const progress = getData(LS_PROGRESS, {});
    if (!progress[currentMemberId]) progress[currentMemberId] = [];
    progress[currentMemberId].push({
      date: new Date().toISOString().slice(0, 10),
      weight, waist, arm
    });
    setData(LS_PROGRESS, progress);
    renderWeightChart(currentMemberId);
    e.target.reset();
    showToast('Registro de progreso guardado.');
  });

  function renderWeightChart(userId) {
    const progress = (getData(LS_PROGRESS, {})[userId]) || [];
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    if (weightChartInstance) weightChartInstance.destroy();

    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: progress.map((p) => formatDate(p.date)),
        datasets: [{
          label: 'Peso (kg)',
          data: progress.map((p) => p.weight),
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255,215,0,0.15)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#FFD700',
          pointRadius: 4
        }]
      },
      options: chartBaseOptions()
    });
  }

  /* ---- Historial ---- */
  function renderHistory(userId) {
    const history = (getData(LS_HISTORY, {})[userId]) || [];
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    if (!history.length) {
      list.innerHTML = '<p class="muted">Todavía no hay entrenamientos registrados.</p>';
      return;
    }
    history
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((h) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<div><strong>${h.discipline}</strong> <small>· ${formatDate(h.date)}</small></div><small>${h.notes || ''}</small>`;
        list.appendChild(div);
      });
  }

  /* ===================================================================
     PANEL ADMINISTRADOR
  =================================================================== */
  const adminArea = document.getElementById('adminArea');
  let charts = {};

  function openAdminArea() {
    adminArea.classList.add('open');
    document.body.style.overflow = 'hidden';
    switchPanel(adminArea, 'adminDashboard');
    renderAdminStats();
    renderAdminCharts();
    renderUsersTable();
    renderRoutineUserSelect();
    renderAdminSchedule();
    renderDisciplinesTable();
  }
  function closeAdminAreaFn() {
    adminArea.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('closeAdminArea').addEventListener('click', closeAdminAreaFn);
  document.getElementById('logoutBtnAdmin').addEventListener('click', () => {
    clearSession();
    closeAdminAreaFn();
    showToast('Sesión cerrada.');
  });

  function refreshAdminStatsIfOpen() {
    if (adminArea.classList.contains('open')) {
      renderAdminStats();
      renderAdminCharts();
    }
  }

  /* ---- Panel switching (sidebar nav) compartido por member + admin ---- */
  function switchPanel(root, panelId) {
    root.querySelectorAll('.app-nav-link').forEach((b) => b.classList.toggle('active', b.dataset.panel === panelId));
    root.querySelectorAll('.app-panel').forEach((p) => p.classList.toggle('active', p.id === panelId));
  }
  document.querySelectorAll('.app-nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const root = btn.closest('.app-overlay');
      switchPanel(root, btn.dataset.panel);
    });
  });

  /* ---- Stats generales ---- */
  function renderAdminStats() {
    const users = getData(LS_USERS, []).filter((u) => u.role === 'member');
    const bookings = getData(LS_BOOKINGS, []);
    const routines = getData(LS_ROUTINES, {});
    document.getElementById('statUsers').textContent = users.length;
    document.getElementById('statBookings').textContent = bookings.length;
    document.getElementById('statRoutines').textContent = Object.keys(routines).filter((k) => routines[k]).length;
    document.getElementById('statDisciplines').textContent = getData(LS_DISCIPLINES, []).length;
  }

  /* ---- Charts base options ---- */
  function chartBaseOptions(extra) {
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b3b3b3', font: { family: 'Inter' } } }
      },
      scales: {
        x: { ticks: { color: '#b3b3b3' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: { ticks: { color: '#b3b3b3' }, grid: { color: 'rgba(255,255,255,0.06)' } }
      }
    };
    return Object.assign(base, extra || {});
  }

  function renderAdminCharts() {
    Object.values(charts).forEach((c) => c.destroy());
    charts = {};

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const attendanceData = [180, 210, 195, 240, 260, 300];
    charts.attendance = new Chart(document.getElementById('attendanceChart'), {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{ label: 'Visitas', data: attendanceData, backgroundColor: '#FFD700', borderRadius: 6 }]
      },
      options: chartBaseOptions({ plugins: { legend: { display: false } } })
    });

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weeklyData = [45, 38, 50, 40, 55, 30, 10];
    charts.weekly = new Chart(document.getElementById('weeklyActivityChart'), {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Asistentes', data: weeklyData, borderColor: '#FFD700',
          backgroundColor: 'rgba(255,215,0,0.15)', tension: 0.35, fill: true, pointBackgroundColor: '#FFD700'
        }]
      },
      options: chartBaseOptions({ plugins: { legend: { display: false } } })
    });

    const allHistory = getData(LS_HISTORY, {});
    const disciplineCounts = {};
    Object.values(allHistory).flat().forEach((h) => {
      disciplineCounts[h.discipline] = (disciplineCounts[h.discipline] || 0) + 1;
    });
    if (!Object.keys(disciplineCounts).length) {
      ['Musculación', 'Running', 'Cross Training', 'Calistenia', 'Group Training'].forEach((d) => (disciplineCounts[d] = 1));
    }
    charts.discipline = new Chart(document.getElementById('disciplineChart'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(disciplineCounts),
        datasets: [{
          data: Object.values(disciplineCounts),
          backgroundColor: ['#FFD700', '#e0bb00', '#8a7400', '#4d4400', '#2D2D2D']
        }]
      },
      options: chartBaseOptions({ scales: {} })
    });

    const users = getData(LS_USERS, []).filter((u) => u.role === 'member');
    const planCounts = { 'Básico': 0, 'Plus': 0, 'Premium': 0 };
    users.forEach((u) => { planCounts[u.plan] = (planCounts[u.plan] || 0) + 1; });
    charts.plans = new Chart(document.getElementById('plansChart'), {
      type: 'pie',
      data: {
        labels: Object.keys(planCounts),
        datasets: [{ data: Object.values(planCounts), backgroundColor: ['#3d3d3d', '#FFD700', '#e0bb00'] }]
      },
      options: chartBaseOptions({ scales: {} })
    });
  }

  /* ---- Tabla de usuarios (CRUD) ---- */
  function renderUsersTable() {
    const users = getData(LS_USERS, []);
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    users.forEach((u) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.plan}</td>
        <td><span class="role-badge ${u.role}">${u.role === 'admin' ? 'Admin' : 'Socio'}</span></td>
        <td class="table-actions">
          <i class="fa-solid fa-pen edit-user" data-id="${u.id}" title="Editar"></i>
          <i class="fa-solid fa-trash del del-user" data-id="${u.id}" title="Eliminar"></i>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.edit-user').forEach((btn) =>
      btn.addEventListener('click', () => openUserModal(btn.dataset.id))
    );
    tbody.querySelectorAll('.del-user').forEach((btn) =>
      btn.addEventListener('click', () => deleteUser(btn.dataset.id))
    );
  }

  function deleteUser(id) {
    const user = findUserById(id);
    if (user && user.role === 'admin') {
      const admins = getData(LS_USERS, []).filter((u) => u.role === 'admin');
      if (admins.length <= 1) {
        showToast('No podés eliminar al único administrador.');
        return;
      }
    }
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    const users = getData(LS_USERS, []).filter((u) => u.id !== id);
    setData(LS_USERS, users);
    renderUsersTable();
    renderRoutineUserSelect();
    renderAdminStats();
    renderAdminCharts();
    showToast('Usuario eliminado.');
  }

  document.getElementById('addUserBtn').addEventListener('click', () => openUserModal(null));

  function openUserModal(id) {
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');
    form.reset();
    document.getElementById('userFormId').value = id || '';

    if (id) {
      const user = findUserById(id);
      title.textContent = 'Editar usuario';
      document.getElementById('userFormName').value = user.name;
      document.getElementById('userFormEmail').value = user.email;
      document.getElementById('userFormPlan').value = user.plan;
      document.getElementById('userFormRole').value = user.role;
    } else {
      title.textContent = 'Nuevo usuario';
    }
    openModal('userModal');
  }

  document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('userFormId').value;
    const name = document.getElementById('userFormName').value.trim();
    const email = document.getElementById('userFormEmail').value.trim();
    const pass = document.getElementById('userFormPass').value;
    const plan = document.getElementById('userFormPlan').value;
    const role = document.getElementById('userFormRole').value;

    const users = getData(LS_USERS, []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
    if (existing) {
      showToast('Ya existe un usuario con ese email.');
      return;
    }

    if (id) {
      const idx = users.findIndex((u) => u.id === id);
      users[idx] = { ...users[idx], name, email, plan, role, password: pass ? pass : users[idx].password };
      showToast('Usuario actualizado.');
    } else {
      users.push({
        id: uid(), name, email, plan, role,
        password: pass || 'fitclub123',
        since: new Date().toISOString().slice(0, 10)
      });
      showToast('Usuario creado.');
    }
    setData(LS_USERS, users);
    closeModal('userModal');
    renderUsersTable();
    renderRoutineUserSelect();
    renderAdminStats();
    renderAdminCharts();
  });

  /* ---- Asignar rutinas ---- */
  function renderRoutineUserSelect() {
    const select = document.getElementById('routineUserSelect');
    const members = getData(LS_USERS, []).filter((u) => u.role === 'member');
    select.innerHTML = members.map((u) => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
    if (members.length) {
      document.getElementById('routineText').value = getData(LS_ROUTINES, {})[select.value] || '';
    }
  }
  document.getElementById('routineUserSelect').addEventListener('change', (e) => {
    document.getElementById('routineText').value = getData(LS_ROUTINES, {})[e.target.value] || '';
  });
  document.getElementById('routineForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = document.getElementById('routineUserSelect').value;
    const text = document.getElementById('routineText').value;
    const routines = getData(LS_ROUTINES, {});
    routines[userId] = text;
    setData(LS_ROUTINES, routines);
    renderAdminStats();
    showToast('Rutina asignada correctamente.');
  });

  /* ---- Gestionar horarios (tabla editable) ---- */
  const SCHEDULE_HEADERS = ['Hora', 'Running', 'Cross Training', 'Calistenia', 'Group Training', 'Musculación'];

  function renderAdminSchedule() {
    const schedule = getData(LS_SCHEDULE, []);
    const table = document.getElementById('adminScheduleTable');
    table.innerHTML = `
      <thead><tr>${SCHEDULE_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
        ${schedule.map((row, rIdx) => `
          <tr>
            ${row.map((cell, cIdx) => `<td contenteditable="${cIdx !== 0}" data-r="${rIdx}" data-c="${cIdx}">${cell}</td>`).join('')}
          </tr>`).join('')}
      </tbody>`;

    table.querySelectorAll('td[contenteditable="true"]').forEach((td) => {
      td.addEventListener('blur', () => saveScheduleCell(td));
      td.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); td.blur(); }
      });
    });
  }
  function saveScheduleCell(td) {
    const r = parseInt(td.dataset.r, 10);
    const c = parseInt(td.dataset.c, 10);
    const schedule = getData(LS_SCHEDULE, []);
    schedule[r][c] = td.textContent.trim();
    setData(LS_SCHEDULE, schedule);
    syncPublicScheduleTable();
    showToast('Horario actualizado.');
  }
  function syncPublicScheduleTable() {
    const schedule = getData(LS_SCHEDULE, []);
    const rows = document.querySelectorAll('#scheduleTable tbody tr');
    rows.forEach((row, rIdx) => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, cIdx) => {
        if (schedule[rIdx]) cell.textContent = schedule[rIdx][cIdx];
      });
    });
  }
  syncPublicScheduleTable();

  /* ---- Gestionar disciplinas ---- */
  function renderDisciplinesTable() {
    const disciplines = getData(LS_DISCIPLINES, []);
    const tbody = document.querySelector('#disciplinesTable tbody');
    tbody.innerHTML = '';
    disciplines.forEach((d) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.name}</td>
        <td>${d.level}</td>
        <td>${d.desc}</td>
        <td class="table-actions">
          <i class="fa-solid fa-pen edit-disc" data-id="${d.id}" title="Editar"></i>
          <i class="fa-solid fa-trash del del-disc" data-id="${d.id}" title="Eliminar"></i>
        </td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.edit-disc').forEach((btn) => btn.addEventListener('click', () => openDisciplineModal(btn.dataset.id)));
    tbody.querySelectorAll('.del-disc').forEach((btn) => btn.addEventListener('click', () => deleteDiscipline(btn.dataset.id)));
  }
  function deleteDiscipline(id) {
    if (!confirm('¿Eliminar esta disciplina?')) return;
    setData(LS_DISCIPLINES, getData(LS_DISCIPLINES, []).filter((d) => d.id !== id));
    renderDisciplinesTable();
    renderAdminStats();
    showToast('Disciplina eliminada.');
  }
  document.getElementById('addDisciplineBtn').addEventListener('click', () => openDisciplineModal(null));
  function openDisciplineModal(id) {
    const title = document.getElementById('disciplineModalTitle');
    const form = document.getElementById('disciplineForm');
    form.reset();
    document.getElementById('discFormId').value = id || '';
    if (id) {
      const d = getData(LS_DISCIPLINES, []).find((x) => x.id === id);
      title.textContent = 'Editar disciplina';
      document.getElementById('discFormName').value = d.name;
      document.getElementById('discFormLevel').value = d.level;
      document.getElementById('discFormDesc').value = d.desc;
    } else {
      title.textContent = 'Nueva disciplina';
    }
    openModal('disciplineModal');
  }
  document.getElementById('disciplineForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('discFormId').value;
    const name = document.getElementById('discFormName').value.trim();
    const level = document.getElementById('discFormLevel').value;
    const desc = document.getElementById('discFormDesc').value.trim();
    const disciplines = getData(LS_DISCIPLINES, []);
    if (id) {
      const idx = disciplines.findIndex((d) => d.id === id);
      disciplines[idx] = { ...disciplines[idx], name, level, desc };
      showToast('Disciplina actualizada.');
    } else {
      disciplines.push({ id: uid(), name, level, desc });
      showToast('Disciplina creada.');
    }
    setData(LS_DISCIPLINES, disciplines);
    closeModal('disciplineModal');
    renderDisciplinesTable();
    renderAdminStats();
  });

  /* ===================================================================
     GALERÍA — LIGHTBOX
  =================================================================== */
  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.getElementById('lightboxImg').src = item.dataset.full;
      openModal('lightboxModal');
    });
  });

  /* ===================================================================
     FORMULARIO DE CONTACTO
  =================================================================== */
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const successEl = document.getElementById('formSuccess');
    successEl.textContent = '¡Gracias! Te vamos a contactar a la brevedad.';
    e.target.reset();
    setTimeout(() => (successEl.textContent = ''), 5000);
  });

  /* ============ FOOTER YEAR ============ */
  document.getElementById('year').textContent = new Date().getFullYear();

})();
