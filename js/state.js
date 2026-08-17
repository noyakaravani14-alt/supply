// משתני מצב גלובליים ופונקציות עזר
const WAREHOUSE_ID = "__warehouse__";
let state = null;
let activeTab = WAREHOUSE_ID;
let html5Scanner = null;
let historyFilterLoc = null;

function viewLocationHistory(loc){
  historyFilterLoc = loc;
  setTab('__history__');
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}


function itemById(id){ return state.items.find(it=>it.id===id); }
function holderById(id){ return state.holders.find(h=>h.id===id); }
function unitsOf(loc){ return state.branchUnits[loc] || []; }
function totalUnitsIn(loc){ return unitsOf(loc).length; }
function isLow(item){ return item.reorderPoint>0 && (state.warehouseQty[item.id]||0) <= item.reorderPoint; }
function fmtDate(d){ return d || '—'; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function uid(){ return 'u'+Math.random().toString(36).slice(2,10); }

async function addLog(entry){
  const full = Object.assign({id:uid(), date:new Date().toISOString()}, entry);
  state.log.unshift(full);
  await dbInsertTransaction(full);
}
