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
        <button class="btn-ghost btn-sm" onclick="logout()" style="align-self:flex-start;">🚪 התנתקות</button>
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
