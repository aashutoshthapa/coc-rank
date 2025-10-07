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
const resultsTableWrapper = resultsBody.closest('.table-wrapper'); 

const tagInput = document.getElementById('tagInput');
const tagSearchBtn = document.getElementById('tagSearchBtn');
const tagStatusEl = document.getElementById('tagStatus');
const tagResultsBody = document.getElementById('tagResultsBody');
const tagResultsTableWrapper = tagResultsBody.closest('.table-wrapper'); 

// --- Utility Functions ---

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Disable/Enable buttons during load (with loading spinner UX)
function setControlsDisabled(disabled) {
  loadBtn.disabled = disabled;
  tagSearchBtn.disabled = disabled;
  yearSelect.disabled = disabled;
  monthSelect.disabled = disabled;
  tagInput.disabled = disabled;
  
  loadBtn.classList.toggle('loading', disabled);
  tagSearchBtn.classList.toggle('loading', disabled);
}

// --- Dropdown Population ---

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

// --- Data Fetching ---

async function fetchSeasonData(season) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('season', season)
    .order('rank', { ascending: true })
    .limit(1000);

  if (error) {
    console.error(error);
    statusEl.textContent = 'Error fetching data. Check console.';
    return [];
  }
  
  return data || [];
}

async function fetchTagData(tag) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tag', tag)
    .order('season', { ascending: true })
    .limit(1000);

  if (error) {
    console.error(error);
    tagStatusEl.textContent = 'Error fetching data. Check console.';
    return [];
  }
  
  return data || [];
}

// --- Rendering ---

function renderSeason(players) {
  resultsBody.innerHTML = players.map(p => `
    <tr>
      <td>${p.rank}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.tag}</td>
      <td>${p.clan_name ? escapeHtml(p.clan_name) : '-'}</td>
      <td>${p.clan_tag || '-'}</td>
    </tr>
  `).join('');
  resultsTableWrapper.style.display = 'block';
}

function renderTagAppearances(players) {
  tagResultsBody.innerHTML = players.map(p => `
    <tr>
      <td>${p.season}</td>
      <td>${p.rank}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.tag}</td>
      <td>${p.clan_name ? escapeHtml(p.clan_name) : '-'}</td>
      <td>${p.clan_tag || '-'}</td>
    </tr>
  `).join('');
  tagResultsTableWrapper.style.display = 'block';
}

// --- Clear & Hide ---

function clearSeasonResults() {
  resultsBody.innerHTML = '';
  statusEl.textContent = '';
  resultsTableWrapper.style.display = 'none';
}

function clearTagResults() {
  tagResultsBody.innerHTML = '';
  tagStatusEl.textContent = '';
  tagResultsTableWrapper.style.display = 'none';
}

// --- Main Logic ---

async function loadSeason() {
  clearTagResults();
  const season = `${yearSelect.value}-${monthSelect.value}`;
  statusEl.textContent = `Loading ${season}...`;
  
  setControlsDisabled(true);
  const players = await fetchSeasonData(season);
  setControlsDisabled(false);

  if (!players.length) {
    statusEl.textContent = `🚫 No data found for ${season}.`;
    resultsTableWrapper.style.display = 'none';
  } else {
    statusEl.textContent = `✅ Showing top ${players.length} players for ${season}.`;
    renderSeason(players);
  }
}

async function searchTag() {
  clearSeasonResults();
  let tag = (tagInput.value || '').trim().toUpperCase();
  tag = tag.startsWith('#') ? tag : `#${tag}`;
  tagInput.value = tag;

  if (tag.length < 4) { 
    tagStatusEl.textContent = 'Enter a valid player tag (e.g., #ABC123).'; 
    return; 
  }

  tagStatusEl.textContent = `Searching ${tag}...`;
  setControlsDisabled(true);
  const data = await fetchTagData(tag);
  setControlsDisabled(false);

  if (!data.length) {
    tagStatusEl.textContent = `❌ No season appearances found for ${tag}.`;
    tagResultsTableWrapper.style.display = 'none';
  } else {
    tagStatusEl.textContent = `✅ Found ${data.length} appearance(s) for ${tag}.`;
    renderTagAppearances(data);
  }
}

// --- Initialization ---

function init() {
  populateYearSelect();
  populateMonthSelect();

  loadBtn.addEventListener('click', loadSeason);
  tagSearchBtn.addEventListener('click', searchTag);
  tagInput.addEventListener('keydown', e => { if(e.key==='Enter') searchTag(); });

  // Set dropdowns to current month/year
  const now = new Date();
  yearSelect.value = now.getFullYear();
  monthSelect.value = String(now.getMonth() + 1).padStart(2, '0');

  // Hide tables initially
  clearSeasonResults();
  clearTagResults();
}

init();