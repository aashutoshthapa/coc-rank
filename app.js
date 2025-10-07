'use strict';
const LOCAL_DATA_DIR = '/json_files';

const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const loadBtn = document.getElementById('loadBtn');
const statusEl = document.getElementById('status');
const resultsBody = document.getElementById('resultsBody');
const resultsTable = document.getElementById('resultsTable'); // season table
const tagInput = document.getElementById('tagInput');
const tagSearchBtn = document.getElementById('tagSearchBtn');
const tagStatusEl = document.getElementById('tagStatus');
const tagResultsBody = document.getElementById('tagResultsBody');
const tagResultsTable = document.getElementById('tagResultsTable'); // tag history table

// Escape HTML
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;')
                    .replace(/'/g,'&#39;');
}

// Populate dropdowns
function populateYearSelect() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2016; y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

function populateMonthSelect() {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  monthNames.forEach((name, i) => {
    const opt = document.createElement('option');
    const mm = String(i+1).padStart(2,'0');
    opt.value = mm; opt.textContent = `${name} (${mm})`;
    monthSelect.appendChild(opt);
  });
}

// Fetch season data
async function fetchSeasonData(season) {
  try {
    const resp = await fetch(`${LOCAL_DATA_DIR}/${season}.json`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.items || [];
  } catch {
    return [];
  }
}

// Render season leaderboard
function renderSeason(players) {
  resultsBody.innerHTML = players.map(p => `
    <tr>
      <td>${p.rank}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.tag}</td>
      <td>${p.clan?.name || '-'}</td>
      <td>${p.clan?.tag || '-'}</td>
    </tr>`).join('');
}

// Render tag appearances
function renderTagAppearances(appearances) {
  tagResultsBody.innerHTML = appearances.map(a => `
    <tr>
      <td>${a.season}</td>
      <td>${a.rank}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${a.tag}</td>
      <td>${a.clan?.name || '-'}</td>
      <td>${a.clan?.tag || '-'}</td>
    </tr>`).join('');
}

// Normalize player tag
function normalizeTag(input) {
  let tag = (input || '').trim().toUpperCase();
  return tag.startsWith('#') ? tag : `#${tag}`;
}

// Clear/hide sections
function clearSeasonResults() {
  resultsBody.innerHTML = '';
  statusEl.textContent = '';
  resultsTable.style.display = 'none';
}

function clearTagResults() {
  tagResultsBody.innerHTML = '';
  tagStatusEl.textContent = '';
  tagResultsTable.style.display = 'none';
}

// Load season leaderboard
async function loadSeason() {
  clearTagResults();             // hide tag table
  resultsTable.style.display = ''; // show season table

  const season = `${yearSelect.value}-${monthSelect.value}`;
  statusEl.textContent = `Loading ${season}…`;

  const players = await fetchSeasonData(season);
  if (!players.length) statusEl.textContent = `No data for ${season}`;
  else statusEl.textContent = `Showing ${players.length} players for ${season}`;

  renderSeason(players);
}

// Search for player tag
async function searchTag() {
  clearSeasonResults();          // hide season table
  tagResultsTable.style.display = ''; // show tag table

  const tag = normalizeTag(tagInput.value);
  if (!tag) { tagStatusEl.textContent = 'Enter valid tag'; return; }
  tagStatusEl.textContent = `Searching ${tag}…`;

  const seasons = [];
  for (let y = 2016; y <= new Date().getFullYear(); y++) {
    for (let m = 1; m <= 12; m++) {
      seasons.push(`${y}-${String(m).padStart(2,'0')}`);
    }
  }

  const appearances = [];
  for (const season of seasons) {
    const players = await fetchSeasonData(season);
    const player = players.find(p => p.tag.toUpperCase() === tag);
    if (player) appearances.push({ season, ...player });
  }

  renderTagAppearances(appearances);
  tagStatusEl.textContent = `Found ${appearances.length} appearance(s) for ${tag}`;
}

// Initialize
populateYearSelect();
populateMonthSelect();

loadBtn.addEventListener('click', loadSeason);
tagSearchBtn.addEventListener('click', searchTag);
tagInput.addEventListener('keydown', e => { if(e.key==='Enter') searchTag(); });

// Auto-load previous month
const now = new Date();
const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
yearSelect.value = prevMonth.getFullYear();
monthSelect.value = String(prevMonth.getMonth()+1).padStart(2,'0');
loadSeason();