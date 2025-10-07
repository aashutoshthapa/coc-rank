import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase setup
const supabaseUrl = 'https://pikwjrgfrqxrklvswvzg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpa3dqcmdmcnF4cmtsdnN3dnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDU3NDksImV4cCI6MjA3NTQyMTc0OX0.CLhGcngTqMYb74DujW_U4VnDAH50HeVd6Fq8kQwyHq4';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elements
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const loadBtn = document.getElementById('loadBtn');
const statusEl = document.getElementById('status');
const resultsBody = document.getElementById('resultsBody');
const resultsTable = document.getElementById('resultsTable');

const tagInput = document.getElementById('tagInput');
const tagSearchBtn = document.getElementById('tagSearchBtn');
const tagStatusEl = document.getElementById('tagStatus');
const tagResultsBody = document.getElementById('tagResultsBody');
const tagResultsTable = document.getElementById('tagResultsTable');

// Escape HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Populate year/month dropdowns
function populateYearSelect() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2016; y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}
function populateMonthSelect() {
  const monthNames = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  monthNames.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    monthSelect.appendChild(opt);
  });
}

// Fetch season data from Supabase
async function fetchSeasonData(season) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('season', season)
    .order('rank', { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

// Render season leaderboard
function renderSeason(players) {
  resultsBody.innerHTML = players.map(p => `
    <tr>
      <td>${p.rank}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.tag}</td>
      <td>${p.clan_name || '-'}</td>
      <td>${p.clan_tag || '-'}</td>
    </tr>
  `).join('');
}

// Render tag appearances
function renderTagAppearances(players) {
  tagResultsBody.innerHTML = players.map(p => `
    <tr>
      <td>${p.season}</td>
      <td>${p.rank}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.tag}</td>
      <td>${p.clan_name || '-'}</td>
      <td>${p.clan_tag || '-'}</td>
    </tr>
  `).join('');
}

// Clear results
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

// Load season
async function loadSeason() {
  clearTagResults();
  resultsTable.style.display = '';
  const season = `${yearSelect.value}-${monthSelect.value}`;
  statusEl.textContent = `Loading ${season}…`;

  const players = await fetchSeasonData(season);
  if (!players.length) statusEl.textContent = `No data for ${season}`;
  else statusEl.textContent = `Showing ${players.length} players for ${season}`;

  renderSeason(players);
}

// Search by tag
async function searchTag() {
  clearSeasonResults();
  tagResultsTable.style.display = '';
  const tag = (tagInput.value || '').trim().toUpperCase();
  if (!tag) { tagStatusEl.textContent = 'Enter valid tag'; return; }
  tagStatusEl.textContent = `Searching ${tag}…`;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tag', tag)
    .order('season', { ascending: true });

  if (error) {
    console.error(error);
    tagStatusEl.textContent = 'Error fetching data';
    return;
  }

  renderTagAppearances(data);
  tagStatusEl.textContent = `Found ${data.length} appearance(s) for ${tag}`;
}

// Normalize tag (optional)
function normalizeTag(input) {
  let tag = (input || '').trim().toUpperCase();
  return tag.startsWith('#') ? tag : `#${tag}`;
}

// Initialize
populateYearSelect();
populateMonthSelect();
loadBtn.addEventListener('click', loadSeason);
tagSearchBtn.addEventListener('click', searchTag);
tagInput.addEventListener('keydown', e => { if(e.key==='Enter') searchTag(); });

// Auto-load previous month
const now = new Date();
const prevMonth = new Date(now.getFullYear(), now.getMonth()-1,1);
yearSelect.value = prevMonth.getFullYear();
monthSelect.value = String(prevMonth.getMonth()+1).padStart(2,'0');
loadSeason();