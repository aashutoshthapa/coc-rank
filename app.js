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

// Caching constant (5 minutes)
const CACHE_LIFETIME_MS = 300000; 

// --- Utility Functions ---

// Escape HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Get cached data if it hasn't expired
function getCache(key) {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const { timestamp, data } = JSON.parse(item);
    // Check if the cache is older than CACHE_LIFETIME_MS
    if (Date.now() - timestamp < CACHE_LIFETIME_MS) {
      return data;
    }
  } catch (e) {
    console.error("Error parsing cache:", e);
    localStorage.removeItem(key); // Clear corrupted cache
  }
  return null;
}

// Store data in cache with a timestamp
function setCache(key, data) {
  const item = JSON.stringify({
    timestamp: Date.now(),
    data: data,
  });
  localStorage.setItem(key, item);
}

// Disable/Enable buttons during load (with loading spinner UX)
function setControlsDisabled(disabled) {
  loadBtn.disabled = disabled;
  tagSearchBtn.disabled = disabled;
  yearSelect.disabled = disabled;
  monthSelect.disabled = disabled;
  tagInput.disabled = disabled;
  
  // Toggle loading class for spinner (assuming CSS is set up)
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

// --- Data Fetching (CONSOLIDATED & IMPROVED) ---

async function fetchSeasonData(season) {
  const cacheKey = `season-${season}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    statusEl.textContent = `✅ Showing ${cachedData.length} players for ${season} (from cache)`;
    return cachedData;
  }
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('season', season)
    .order('rank', { ascending: true })
    .limit(1000); // Added limit for safety

  if (error) {
    console.error(error);
    statusEl.textContent = 'Error fetching data. Check console.';
    return [];
  }
  
  if (data) setCache(cacheKey, data); // Store successful fetch
  return data || [];
}

async function fetchTagData(tag) {
  const cacheKey = `tag-${tag}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    tagStatusEl.textContent = `✅ Found ${cachedData.length} appearance(s) for ${tag} (from cache)`;
    return cachedData;
  }
  
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tag', tag)
    .order('season', { ascending: true })
    .limit(1000); // Added limit for safety

  if (error) {
    console.error(error);
    tagStatusEl.textContent = 'Error fetching data. Check console.';
    return [];
  }
  
  if (data) setCache(cacheKey, data); // Store successful fetch
  return data || [];
}

// --- Rendering ---
// (These remain unchanged)
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
}

// --- Clear & Hide Functions ---
// (These remain unchanged)
function clearSeasonResults() {
  resultsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--muted);">Select a year and month, then click "Load Season".</td></tr>';
  statusEl.textContent = '';
  resultsTableWrapper.style.display = 'block'; 
}

function clearTagResults() {
  tagResultsBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--muted);">Enter a player tag and click "Search Tag".</td></tr>';
  tagStatusEl.textContent = '';
  tagResultsTableWrapper.style.display = 'block'; 
}

// --- Main Logic ---

async function loadSeason() {
  clearTagResults();
  const season = `${yearSelect.value}-${monthSelect.value}`;
  
  // Set initial status unless data is coming from cache
  if (!getCache(`season-${season}`)) {
    statusEl.textContent = `Loading ${season}...`;
  }
  
  setControlsDisabled(true);

  const players = await fetchSeasonData(season);
  setControlsDisabled(false);

  // If status message already includes '(from cache)', don't overwrite it here
  if (!statusEl.textContent.includes('(from cache)')) {
      if (!players.length) {
          statusEl.textContent = `🚫 No data found for ${season}.`;
          resultsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--muted);">No data found for ${season}.</td></tr>`;
      } else {
          statusEl.textContent = `✅ Showing top ${players.length} players for ${season}.`;
          renderSeason(players);
      }
  } else {
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
  
  // Set initial status unless data is coming from cache
  if (!getCache(`tag-${tag}`)) {
      tagStatusEl.textContent = `Searching ${tag}...`;
  }

  setControlsDisabled(true);

  const data = await fetchTagData(tag);
  setControlsDisabled(false);

  // If status message already includes '(from cache)', don't overwrite it here
  if (!tagStatusEl.textContent.includes('(from cache)')) {
      if (!data.length) {
          tagStatusEl.textContent = `❌ No season appearances found for ${tag}.`;
          tagResultsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--muted);">No appearances found for ${tag}.</td></tr>`;
      } else {
          tagStatusEl.textContent = `✅ Found ${data.length} appearance(s) for ${tag}.`;
          renderTagAppearances(data);
      }
  } else {
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

  // Set dropdowns to the current month/year
  const now = new Date();
  yearSelect.value = now.getFullYear();
  monthSelect.value = String(now.getMonth() + 1).padStart(2, '0');
  
  // Set initial empty states with instructions
  clearSeasonResults();
  clearTagResults();
}

init();