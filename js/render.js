// רינדור כל המסכים/טאבים
/* ---------------- RENDER ---------------- */
function render(){
  const app = document.getElementById('app');
  const totalSkus = state.items.length;
  const totalWarehouseUnits = Object.values(state.warehouseQty).reduce((a,b)=>a+(b||0),0);
  const lowCount = state.items.filter(isLow).length;
  const totalDeployed = state.locations.reduce((sum,l)=>sum+totalUnitsIn(l),0);

  app.innerHTML = `
    <header class="top">
      <div>
        <h1>מעקב ציוד ארגוני</h1>
        <div class="sub">מחסן מרכזי + ${state.locations.length} מיקומים · נשמר אוטומטית</div>
      </div>
      <div class="stats">
        <div class="stat"><div class="num mono">${totalSkus}</div><div class="lbl">פריטים במלאי</div></div>
        <div class="stat"><div class="num mono">${totalWarehouseUnits}</div><div class="lbl">יחידות במחסן</div></div>
        <div class="stat" style="cursor:pointer;" onclick="setTab('__history__')" title="לצפייה בתנועות האחרונות"><div class="num mono">${totalDeployed}</div><div class="lbl">מנופק בסניפים ↗</div></div>
        <div class="stat ${lowCount>0?'warn':''}"><div class="num mono">${lowCount}</div><div class="lbl">מתחת לנקודת הזמנה</div></div>
      </div>
    </header>
    <div class="tabbar" id="tabbar"></div>
    <div class="panel" id="panel"></div>
    <div class="footer-note">מחובר ל-Supabase — כל שינוי נשמר מיידית במסד נתונים אמיתי, נגיש מכל מכשיר.</div>
  `;

  renderTabbar();
  if(activeTab === WAREHOUSE_ID) renderWarehousePanel();
  else if(activeTab === '__history__') renderHistoryPanel();
  else if(activeTab === '__search__') renderSearchPanel();
  else if(activeTab === '__contacts__') renderContactsPanel();
  else renderLocationPanel(activeTab);
}

function renderTabbar(){
  const bar = document.getElementById('tabbar');
  let html = `<div class="tab warehouse ${activeTab===WAREHOUSE_ID?'active':''}" onclick="setTab('${WAREHOUSE_ID}')">📦 מחסן <span class="count">${Object.values(state.warehouseQty).reduce((a,b)=>a+(b||0),0)}</span></div>`;
  state.locations.forEach(loc=>{
    html += `<div class="tab ${activeTab===loc?'active':''}" onclick="setTab('${escAttr(loc)}')">${esc(loc)} <span class="count">${totalUnitsIn(loc)}</span></div>`;
  });
  html += `<div class="tab ${activeTab==='__search__'?'active':''}" onclick="setTab('__search__')" style="font-family:'Rubik',sans-serif;">🔎 חיפוש לפי בעל תפקיד</div>`;
  html += `<div class="tab ${activeTab==='__contacts__'?'active':''}" onclick="setTab('__contacts__')" style="font-family:'Rubik',sans-serif;">👤 אנשי קשר</div>`;
  html += `<div class="tab ${activeTab==='__history__'?'active':''}" onclick="setTab('__history__')" style="font-family:'Rubik',sans-serif;">🕘 היסטוריה</div>`;
  html += `<button class="tab-add" onclick="promptAddLocation()">+ מיקום</button>`;
  bar.innerHTML = html;
}

function setTab(t){ activeTab = t; render(); }

function renderWarehousePanel(){
  const panel = document.getElementById('panel');
  const rows = state.items.map(it=>{
    const qty = state.warehouseQty[it.id]||0;
    const received = state.warehouseReceived[it.id]||0;
    const issued = state.warehouseIssued[it.id]||0;
    return `<tr class="${isLow(it)?'low-stock':''}">
      <td data-label="מק&quot;ט"><span class="mono">${esc(it.sku)||'—'}</span></td>
      <td data-label="שם פריט">${esc(it.name)}</td>
      <td data-label="דגם">${esc(it.model)||'—'}</td>
      <td data-label="יצרן">${esc(it.manufacturer)||'—'}</td>
      <td data-label="נקלט" class="mono">${received}</td>
      <td data-label="נופק" class="mono">${issued}</td>
      <td data-label="כמות במלאי"><b class="mono">${qty}</b></td>
      <td data-label="נקודת הזמנה" class="mono">${it.reorderPoint||'—'}</td>
      <td data-label=""><button class="btn-ghost btn-sm" onclick="editItem('${it.id}')">עריכה</button></td>
    </tr>`;
  }).join('');

  panel.innerHTML = `
    <div class="panel-head">
      <div><h2>מחסן ראשי</h2><div class="desc">כל הפריטים והכמויות הזמינות למשלוח</div></div>
      <div class="actions">
        <button class="btn-secondary" onclick="openReceiveModal()">📥 קליטת ציוד</button>
        <button class="btn-primary" onclick="openTransferModal()">📤 ניפוק / העברה לסניף</button>
      </div>
    </div>
    ${state.items.length===0?`<div class="empty"><div class="big">🗄️</div>אין פריטים עדיין. התחילי בקליטת ציוד.</div>`:`
    <table><thead><tr>
      <th>מק"ט</th><th>שם פריט</th><th>דגם</th><th>יצרן</th><th>נקלט</th><th>נופק</th><th>כמות במלאי</th><th>נק' הזמנה</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`}
  `;
}

function lookupRealSku(name, model){
  const match = state.items.find(it => it.name===name && (it.model||'')===(model||''));
  return match ? match.sku : '';
}

function renderLocationPanel(loc){
  const panel = document.getElementById('panel');
  const units = unitsOf(loc);
  const rows = units.map(u=>`
    <tr>
      <td data-label="מק&quot;ט"><span class="mono">${esc(lookupRealSku(u.name, u.model))||'—'}</span></td>
      <td data-label="מק&quot;ט ארגוני"><span class="mono">${esc(u.sku)||'—'}</span></td>
      <td data-label="שם פריט">${esc(u.name)}</td>
      <td data-label="דגם">${esc(u.model)||'—'}</td>
      <td data-label="מס' סיריאלי"><span class="tag">${esc(u.serial)||'—'}</span></td>
      <td data-label="מחלקה">${esc(u.department)||'—'}</td>
      <td data-label="בעל תפקיד">${esc(u.holderName)||'—'}</td>
      <td data-label="אימייל">${esc(u.holderEmail)||'—'}</td>
      <td data-label="טלפון">${esc(u.holderPhone)||'—'}</td>
      <td data-label="תאריך קבלה">${fmtDate(u.dateReceived)}</td>
      <td data-label="תוקף אחריות">${fmtDate(u.warrantyExpiry)}</td>
      <td data-label=""><button class="btn-ghost btn-sm" onclick="editUnit('${escAttr(loc)}','${u.id}')">עריכה</button> <button class="btn-ghost btn-sm" onclick="transferHolder('${escAttr(loc)}','${u.id}')" title="העברה לעובד חדש">🤝</button> <button class="btn-ghost btn-sm" onclick="removeUnit('${escAttr(loc)}','${u.id}')">הסרה</button></td>
    </tr>`).join('');

  panel.innerHTML = `
    <div class="panel-head">
      <div><h2>${esc(loc)}</h2><div class="desc">${units.length} יחידות רשומות במיקום זה · <a href="#" onclick="viewLocationHistory('${escAttr(loc)}');return false;" style="color:var(--accent);">תנועות אחרונות לסניף זה ↗</a></div></div>
      <div class="actions">
        <button class="btn-secondary" onclick="openReceiveModal('${escAttr(loc)}')">📥 קליטה ישירה למיקום זה</button>
        <button class="btn-primary" onclick="openTransferModal('${escAttr(loc)}')">📤 ניפוק ממחסן ליעד זה</button>
      </div>
    </div>
    ${units.length===0?`<div class="empty"><div class="big">📍</div>אין עדיין ציוד רשום כאן.</div>`:`
    <table><thead><tr>
      <th>מק"ט</th><th>מק"ט ארגוני</th><th>שם פריט</th><th>דגם</th><th>סיריאלי</th><th>מחלקה</th><th>בעל תפקיד</th><th>אימייל</th><th>טלפון</th><th>קבלה</th><th>אחריות</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`}
  `;
}

function renderHistoryPanel(){
  const panel = document.getElementById('panel');
  const monthLabel = new Date().toLocaleDateString('he-IL', {month:'long', year:'2-digit'});
  const entries = historyFilterLoc ? state.log.filter(l=>l.to===historyFilterLoc) : state.log;
  const rows = entries.map(l=>`
    <tr>
      <td data-label="פריט"><b>${esc(l.name)}</b></td>
      <td data-label="כמות" class="mono">${l.qty}</td>
      <td data-label="ניפוק">${l.type==='receive'?`<span class="tag">קליטה ← ${esc(l.to)}</span>`:l.type==='handover'?`<span class="tag">🤝 ${esc(l.fromHolder)} ← ${esc(l.toHolder)}</span>`:`<span class="tag">${esc(l.to)}</span>`}</td>
      <td data-label="מספר סיריאלי" class="mono">${esc(l.serial)||'—'}</td>
      <td data-label="תאריך">${new Date(l.date).toLocaleDateString('he-IL')}</td>
    </tr>`).join('');
  panel.innerHTML = `
    <div class="panel-head">
      <div><h2>תנועות אחרונות ${historyFilterLoc?`— ${esc(historyFilterLoc)}`:''}</h2><div class="desc">כל הקליטות והניפוקים לסניפים, מהחדש לישן · ${esc(monthLabel)}</div></div>
      ${historyFilterLoc?`<button class="btn-ghost btn-sm" onclick="historyFilterLoc=null;render();">נקה סינון</button>`:''}
    </div>
    ${entries.length===0?`<div class="empty"><div class="big">🕘</div>עדיין אין תנועות רשומות.</div>`:`
    <table><thead><tr><th>פריט</th><th>כמות</th><th>ניפוק</th><th>מספר סיריאלי</th><th>תאריך</th></tr></thead>
    <tbody>${rows}</tbody></table>`}
  `;
}

function renderSearchPanel(){
  const panel = document.getElementById('panel');
  panel.innerHTML = `
    <div class="panel-head">
      <div><h2>חיפוש ציוד לפי בעל תפקיד</h2><div class="desc">מחפש בכל הסניפים יחד</div></div>
    </div>
    <div class="search-wrap">
      <input id="searchHolder" type="text" list="holdersList" placeholder="הקלידי שם (למשל: דיאנה, רפאל פליגל...)" oninput="runHolderSearch()">
      <datalist id="holdersList">${state.holders.map(h=>`<option value="${escAttr(h.name)}">`).join('')}</datalist>
    </div>
    <div id="searchResults"></div>
  `;
  document.getElementById('searchHolder').focus();
  runHolderSearch();
}

function runHolderSearch(){
  const q = (document.getElementById('searchHolder').value || '').trim();
  const box = document.getElementById('searchResults');
  let results = [];
  state.locations.forEach(loc=>{
    (state.branchUnits[loc]||[]).forEach(u=>{
      if(!q || (u.holderName||'').includes(q)){
        results.push(Object.assign({loc}, u));
      }
    });
  });

  if(!q){
    box.innerHTML = `<div class="empty"><div class="big">🔎</div>הקלידי שם של בעל תפקיד כדי לראות איזה ציוד רשום עליו.</div>`;
    return;
  }
  if(results.length===0){
    box.innerHTML = `<div class="empty"><div class="big">🤷</div>לא נמצא ציוד עבור "${esc(q)}".</div>`;
    return;
  }
  const rows = results.map(u=>`
    <tr>
      <td data-label="בעל תפקיד"><b>${esc(u.holderName)}</b></td>
      <td data-label="אימייל">${esc(u.holderEmail)||'—'}</td>
      <td data-label="מיקום"><span class="tag">${esc(u.loc)}</span></td>
      <td data-label="שם פריט">${esc(u.name)}</td>
      <td data-label="דגם">${esc(u.model)||'—'}</td>
      <td data-label="מס' סיריאלי" class="mono">${esc(u.serial)||'—'}</td>
      <td data-label="מחלקה">${esc(u.department)||'—'}</td>
      <td data-label="טלפון">${esc(u.holderPhone)||'—'}</td>
      <td data-label=""><button class="btn-ghost btn-sm" onclick="setTab('${escAttr(u.loc)}')">לגיליון המיקום</button></td>
    </tr>`).join('');
  box.innerHTML = `
    <div class="desc" style="margin-bottom:8px;">${results.length} פריטים נמצאו</div>
    <table><thead><tr>
      <th>בעל תפקיד</th><th>אימייל</th><th>מיקום</th><th>שם פריט</th><th>דגם</th><th>סיריאלי</th><th>מחלקה</th><th>טלפון</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}
function renderContactsPanel(){
  const panel = document.getElementById('panel');
  const rows = state.holders.map(h=>`
    <tr>
      <td data-label="שם"><b>${esc(h.name)}</b></td>
      <td data-label="אימייל">${esc(h.email)||'—'}</td>
      <td data-label=""><button class="btn-ghost btn-sm" onclick="editHolder('${h.id}')">עריכה</button> <button class="btn-ghost btn-sm" onclick="deleteHolder('${h.id}')">הסרה</button></td>
    </tr>`).join('');
  panel.innerHTML = `
    <div class="panel-head">
      <div><h2>אנשי קשר</h2><div class="desc">מאגר שמות ואימיילים לקישור לבעלי תפקיד בקליטה/ניפוק</div></div>
      <div class="actions"><button class="btn-primary" onclick="editHolder()">+ איש קשר חדש</button></div>
    </div>
    ${state.holders.length===0?`<div class="empty"><div class="big">👤</div>עדיין אין אנשי קשר במאגר.</div>`:`
    <table><thead><tr><th>שם</th><th>אימייל</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table>`}
  `;
}

function esc(s){ return (s===undefined||s===null) ? '' : String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s){ return esc(s).replace(/'/g,"&#39;"); }
