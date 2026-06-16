// ===== Configuration =====
const SITE_DATA_URL = '/data';
const MEMBERS_PATH = '/data/members';
const ACTIVITIES_PATH = '/data/activities';
const SETTINGS_PATH = '/data/settings.json';
const PAGES_PATH = '/data/pages';

// ===== Language Detection =====
function getCurrentLang() {
  const path = window.location.pathname;
  if (path.startsWith('/ar/')) return 'ar';
  if (path.startsWith('/en/')) return 'en';
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('ar') ? 'ar' : 'en';
}

const LANG = getCurrentLang();

// ===== Helpers =====
function t(arText, enText) {
  return LANG === 'ar' ? arText : enText;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  if (LANG === 'ar') {
    return date.toLocaleDateString('ar-SA', options);
  }
  return date.toLocaleDateString('en-US', options);
}

// ===== Fetch Data =====
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch:', url, err);
    return null;
  }
}

async function fetchMarkdown(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    return await res.text();
  } catch (err) {
    console.warn('Could not fetch:', url, err);
    return null;
  }
}

// ===== Settings =====
async function loadSettings() {
  const settings = await fetchJSON(SETTINGS_PATH);
  if (!settings) return;

  const title = LANG === 'ar' ? settings.site_title_ar : settings.site_title_en;
  document.querySelectorAll('[data-setting="site-title"]').forEach(el => {
    el.textContent = title;
  });
  document.title = title;

  if (settings.logo) {
    document.querySelectorAll('[data-setting="logo"]').forEach(el => {
      el.src = settings.logo;
      el.style.display = '';
    });
  }

  document.querySelectorAll('[data-setting="email"]').forEach(el => {
    el.href = 'mailto:' + settings.email;
    el.textContent = settings.email;
  });

  document.querySelectorAll('[data-setting="phone"]').forEach(el => {
    el.href = 'tel:' + settings.phone;
    el.textContent = settings.phone;
  });

  if (settings.whatsapp) {
    const waLink = 'https://wa.me/' + settings.whatsapp;
    document.querySelectorAll('[data-setting="whatsapp"]').forEach(el => {
      el.href = waLink;
    });
  }

  if (settings.facebook) {
    document.querySelectorAll('[data-setting="facebook"]').forEach(el => {
      el.href = settings.facebook;
    });
  }

  if (settings.telegram) {
    document.querySelectorAll('[data-setting="telegram"]').forEach(el => {
      el.href = settings.telegram;
    });
  }

  const address = LANG === 'ar' ? settings.address_ar : settings.address_en;
  document.querySelectorAll('[data-setting="address"]').forEach(el => {
    el.textContent = address;
  });

  if (settings.map_url) {
    document.querySelectorAll('[data-setting="map"]').forEach(el => {
      el.src = settings.map_url;
    });
  }
}

// ===== Members =====
async function loadMembers() {
  const container = document.getElementById('members-container');
  if (!container) return;

  // Fetch member index
  const membersList = await fetchJSON(MEMBERS_PATH + '/index.json');
  if (!membersList || !membersList.length) {
    container.innerHTML = '<p>' + t('لا يوجد أعضاء بعد.', 'No members yet.') + '</p>';
    return;
  }

  // Sort members by order, then by name
  membersList.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const nameA = (LANG === 'ar' ? a.name_ar : a.name_en) || '';
    const nameB = (LANG === 'ar' ? b.name_ar : b.name_en) || '';
    return nameA.localeCompare(nameB);
  });

  // Group by team
  const teams = {};
  const noTeam = [];
  membersList.forEach(m => {
    const team = LANG === 'ar' ? (m.team_ar || '') : (m.team_en || '');
    if (team.trim()) {
      if (!teams[team]) teams[team] = [];
      teams[team].push(m);
    } else {
      noTeam.push(m);
    }
  });

  let html = '';

  // Render teams
  for (const [teamName, members] of Object.entries(teams)) {
    html += '<div class="team-group fade-in-up">';
    html += '<h3 class="team-group-title">' + teamName + '</h3>';
    html += '<div class="members-grid">';
    html += members.map(m => renderMemberCard(m)).join('');
    html += '</div></div>';
  }

  // Render members without team
  if (noTeam.length) {
    if (Object.keys(teams).length) {
      html += '<div class="team-group fade-in-up">';
      html += '<h3 class="team-group-title">' + t('آخرون', 'Others') + '</h3>';
      html += '<div class="members-grid">';
      html += noTeam.map(m => renderMemberCard(m)).join('');
      html += '</div></div>';
    } else {
      html += '<div class="members-grid">';
      html += noTeam.map(m => renderMemberCard(m)).join('');
      html += '</div>';
    }
  }

  container.innerHTML = html;
}

function renderMemberCard(member) {
  const name = LANG === 'ar' ? member.name_ar : member.name_en;
  const title = LANG === 'ar' ? member.title_ar : member.title_en;
  const specialty = LANG === 'ar' ? member.specialty_ar : member.specialty_en;
  const team = LANG === 'ar' ? member.team_ar : member.team_en;
  const photo = member.photo || '/assets/images/placeholder-avatar.png';

  return `
    <div class="card member-card fade-in-up">
      <img src="${photo}" alt="${name}" loading="lazy">
      <h3>${name}</h3>
      ${title ? '<p class="member-title">' + title + '</p>' : ''}
      ${specialty ? '<p class="member-specialty">' + specialty + '</p>' : ''}
      ${team ? '<span class="member-team">' + team + '</span>' : ''}
    </div>
  `;
}

// ===== Activities =====
async function loadActivities() {
  const container = document.getElementById('activities-container');
  if (!container) return;

  const activitiesList = await fetchJSON(ACTIVITIES_PATH + '/index.json');
  if (!activitiesList || !activitiesList.length) {
    container.innerHTML = '<p>' + t('لا توجد أنشطة بعد.', 'No activities yet.') + '</p>';
    return;
  }

  // Sort by date descending
  activitiesList.sort((a, b) => new Date(b.date) - new Date(a.date));

  const html = activitiesList.map(a => renderActivityCard(a)).join('');
  container.innerHTML = html;
}

function renderActivityCard(activity) {
  const title = LANG === 'ar' ? activity.title_ar : activity.title_en;
  const summary = LANG === 'ar' ? activity.summary_ar : activity.summary_en;
  const image = activity.image;
  const date = formatDate(activity.date);

  let imageHtml;
  if (image) {
    imageHtml = '<div class="activity-card-image"><img src="' + image + '" alt="' + title + '" loading="lazy"></div>';
  } else {
    imageHtml = '<div class="activity-card-image activity-card-placeholder">' + date.split(' ')[0] + '</div>';
  }

  return `
    <div class="card activity-card fade-in-up">
      ${imageHtml}
      <div class="activity-card-body">
        <span class="activity-date">${date}</span>
        <h3>${title}</h3>
        ${summary ? '<p>' + summary + '</p>' : ''}
      </div>
    </div>
  `;
}

// ===== About Page =====
async function loadAbout() {
  const container = document.getElementById('about-content');
  if (!container) return;

  const aboutData = await fetchJSON(PAGES_PATH + '/about_' + LANG + '.json');
  if (aboutData) {
    container.innerHTML = '<h2>' + aboutData.title + '</h2>' + aboutData.body;
  }
}

// ===== Contact Page =====
async function loadContact() {
  const container = document.getElementById('contact-content');
  if (!container) return;

  const contactData = await fetchJSON(PAGES_PATH + '/contact_' + LANG + '.json');
  if (contactData) {
    container.innerHTML = '<h2>' + contactData.title + '</h2>' + contactData.body;
  }
}

// ===== Export Data =====
function setupExport() {
  const exportContainer = document.getElementById('export-section');
  if (!exportContainer) return;

  document.getElementById('export-members')?.addEventListener('click', async () => {
    const data = await fetchJSON(MEMBERS_PATH + '/index.json');
    if (data) downloadCSV(data, 'members.csv');
  });

  document.getElementById('export-activities')?.addEventListener('click', async () => {
    const data = await fetchJSON(ACTIVITIES_PATH + '/index.json');
    if (data) downloadCSV(data, 'activities.csv');
  });
}

function downloadCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  let csv = keys.join(',') + '\n';
  data.forEach(row => {
    const values = keys.map(k => {
      let val = (row[k] || '').toString();
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    csv += values.join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== Mobile Menu =====
function setupMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

// ===== Active Nav Link =====
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.main-nav a').forEach(link => {
    if (link.getAttribute('href') === path || path.startsWith(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadMembers();
  loadActivities();
  loadAbout();
  loadContact();
  setupExport();
  setupMobileMenu();
  setActiveNav();
});