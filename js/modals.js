// מודלים: הוספת מיקום, עריכת פריט, קליטה, ניפוק, עריכת יחידה
/* ---------------- LOCATIONS ---------------- */
function promptAddLocation(){
  const name = prompt('שם המיקום/סניף החדש:');
  if(!name) return;
  const clean = name.trim();
  if(!clean) return;
  if(state.locations.includes(clean)){ showToast('המיקום כבר קיים'); activeTab=clean; render(); return; }
  state.locations.push(clean);
  activeTab = clean;
  dbInsertLocation(clean);
  render();
}

/* ---------------- ITEM EDIT ---------------- */
function editItem(id){
  const it = itemById(id);
  if(!it) return;
  openModal(`
    <h3>עריכת פריט</h3>
    <div class="msub">${esc(it.name)}</div>
    <div class="field"><label>שם פריט</label><input id="ei_name" type="text" value="${escAttr(it.name)}"></div>
    <div class="row2">
      <div class="field"><label>מק"ט</label><input id="ei_sku" type="text" class="mono" value="${escAttr(it.sku)}"></div>
      <div class="field"><label>דגם</label><input id="ei_model" type="text" value="${escAttr(it.model)}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>יצרן</label><input id="ei_manufacturer" type="text" value="${escAttr(it.manufacturer)}"></div>
      <div class="field"><label>נקודת הזמנה</label><input id="ei_reorder" type="number" min="0" value="${it.reorderPoint||0}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>נקלט (סה"כ שהתקבל)</label><input id="ei_received" type="number" min="0" value="${state.warehouseReceived[it.id]||0}"></div>
      <div class="field"><label>מופק (סה"כ שיצא)</label><input id="ei_issued" type="number" min="0" value="${state.warehouseIssued[it.id]||0}"></div>
    </div>
    <div class="field"><label>כמות במלאי כרגע</label><input id="ei_qty" type="number" min="0" value="${state.warehouseQty[it.id]||0}"></div>
    <div class="actions" style="justify-content:flex-end;margin-top:10px;">
      <button class="btn-ghost" onclick="closeModal()">ביטול</button>
      <button class="btn-primary" onclick="saveItemEdit('${id}')">שמירה</button>
    </div>
  `);
}
async function saveItemEdit(id){
  const it = itemById(id);
  it.name = document.getElementById('ei_name').value.trim();
  it.sku = document.getElementById('ei_sku').value.trim();
  it.model = document.getElementById('ei_model').value.trim();
  it.manufacturer = document.getElementById('ei_manufacturer').value.trim();
  it.reorderPoint = parseInt(document.getElementById('ei_reorder').value)||0;
  state.warehouseQty[id] = parseInt(document.getElementById('ei_qty').value)||0;
  state.warehouseReceived[id] = parseInt(document.getElementById('ei_received').value)||0;
  state.warehouseIssued[id] = parseInt(document.getElementById('ei_issued').value)||0;
  closeModal();
  await dbUpdateItem(id);
  render();
}

/* ---------------- MODAL SHELL ---------------- */
function openModal(html){
  let ov = document.getElementById('overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'overlay';
    ov.className = 'overlay';
    ov.onclick = (e)=>{ if(e.target===ov) closeModal(); };
    document.body.appendChild(ov);
  }
  ov.innerHTML = `<div class="modal">${html}</div>`;
}
function closeModal(){
  stopScanner();
  const ov = document.getElementById('overlay');
  if(ov) ov.remove();
}

/* ---------------- RECEIVE (קליטה) ---------------- */
function openReceiveModal(presetLocation){
  const itemOptions = state.items.map(it=>`<option value="${it.id}">${esc(it.name)} ${it.model?`(${esc(it.model)})`:''} — מק"ט ${esc(it.sku)||'—'}</option>`).join('');
  const locOptions = ['<option value="__warehouse__">מחסן ראשי</option>'].concat(
    state.locations.map(l=>`<option value="${escAttr(l)}" ${presetLocation===l?'selected':''}>${esc(l)}</option>`)
  ).join('');

  openModal(`
    <button class="modal-close" onclick="closeModal()">×</button>
    <h3>📥 קליטת ציוד</h3>
    <div class="msub">הוספת ציוד חדש או קיים למלאי</div>
    <div class="field">
      <label>פריט</label>
      <select id="rc_item" onchange="onReceiveItemChange()">
        <option value="__new__">+ פריט חדש</option>
        ${itemOptions}
      </select>
    </div>
    <div id="rc_newFields" style="display:none;">
      <div class="row2">
        <div class="field"><label>שם פריט</label><input id="rc_new_name" type="text"></div>
        <div class="field"><label>דגם</label><input id="rc_new_model" type="text"></div>
      </div>
      <div class="field"><label>יצרן</label><input id="rc_new_manufacturer" type="text"></div>
    </div>
    <div class="field">
      <label>מק"ט (ניתן לסרוק)</label>
      <div class="scan-row">
        <input id="rc_sku" type="text" class="mono" placeholder="מק&quot;ט פנימי">
        <button class="btn-secondary" onclick="startScan('rc_sku')">📷 סרוק</button>
      </div>
      <div id="scanBox"></div>
    </div>
    <div class="row2">
      <div class="field"><label>יעד</label><select id="rc_dest">${locOptions}</select></div>
      <div class="field"><label>כמות</label><input id="rc_qty" type="number" min="1" value="1" onchange="onReceiveQtyChange()"></div>
    </div>
    <div id="rc_units"></div>
    <div class="actions" style="justify-content:flex-end;margin-top:10px;">
      <button class="btn-ghost" onclick="closeModal()">ביטול</button>
      <button class="btn-primary" onclick="submitReceive()">קליטה</button>
    </div>
  `);
  onReceiveItemChange();
  document.getElementById('rc_dest').addEventListener('change', onReceiveQtyChange);
  onReceiveQtyChange();
}

function onReceiveItemChange(){
  const isNew = document.getElementById('rc_item').value === '__new__';
  document.getElementById('rc_newFields').style.display = isNew ? 'block' : 'none';
}

function onReceiveQtyChange(){
  const dest = document.getElementById('rc_dest').value;
  const qty = Math.max(1, parseInt(document.getElementById('rc_qty').value)||1);
  const box = document.getElementById('rc_units');
  if(dest === '__warehouse__'){
    box.innerHTML = `<div class="banner">קליטה למחסן מוסיפה לכמות הכללית בלבד — לא נדרשים פרטי סיריאל.</div>`;
    return;
  }
  let html = `<div class="banner">קליטה ישירה לסניף דורשת פרטים לכל יחידה בנפרד.</div>`;
  for(let i=0;i<qty;i++){
    html += unitCardHtml('rc', i);
  }
  box.innerHTML = html;
}

function unitCardHtml(prefix, i){
  return `
  <div class="unit-card">
    <div class="row2">
      <div class="field"><label>מספר סיריאלי #${i+1}</label>
        <div class="scan-row"><input id="${prefix}_serial_${i}" type="text" class="mono"><button class="btn-secondary btn-sm" onclick="startScan('${prefix}_serial_${i}')">📷</button></div>
      </div>
      <div class="field"><label>מחלקה</label><input id="${prefix}_dept_${i}" type="text"></div>
    </div>
    <div class="row2">
      <div class="field"><label>שם בעל תפקיד</label><input id="${prefix}_holder_${i}" type="text"></div>
      <div class="field"><label>טלפון בעל תפקיד</label><input id="${prefix}_phone_${i}" type="tel"></div>
    </div>
    <div class="row2">
      <div class="field"><label>תאריך קבלת ציוד</label><input id="${prefix}_date_${i}" type="date" value="${todayISO()}"></div>
      <div class="field"><label>תוקף אחריות</label><input id="${prefix}_warranty_${i}" type="date"></div>
    </div>
  </div>`;
}

async function submitReceive(){
  const itemSel = document.getElementById('rc_item').value;
  const dest = document.getElementById('rc_dest').value;
  const qty = Math.max(1, parseInt(document.getElementById('rc_qty').value)||1);
  const skuVal = document.getElementById('rc_sku').value.trim();
  let item, isNewItem = false;

  if(itemSel === '__new__'){
    const name = document.getElementById('rc_new_name').value.trim();
    if(!name){ showToast('נא להזין שם פריט'); return; }
    item = {
      id: uid(), sku: skuVal,
      name, model: document.getElementById('rc_new_model').value.trim(),
      manufacturer: document.getElementById('rc_new_manufacturer').value.trim(),
      reorderPoint: 0
    };
    state.items.push(item);
    state.warehouseQty[item.id] = 0;
    state.warehouseReceived[item.id] = 0;
    state.warehouseIssued[item.id] = 0;
    isNewItem = true;
  } else {
    item = itemById(itemSel);
    if(skuVal) item.sku = skuVal;
  }

  if(dest === '__warehouse__'){
    state.warehouseQty[item.id] = (state.warehouseQty[item.id]||0) + qty;
    state.warehouseReceived[item.id] = (state.warehouseReceived[item.id]||0) + qty;
    if(isNewItem) await dbInsertItem(item); else await dbUpdateItem(item.id);
    await addLog({type:'receive', name:item.name, qty, from:'ספק/חיצוני', to:'מחסן ראשי', serial:''});
  } else {
    if(isNewItem) await dbInsertItem(item);
    if(!state.branchUnits[dest]) state.branchUnits[dest] = [];
    for(let i=0;i<qty;i++){
      const unit = {
        id: uid(), sku: item.sku, name:item.name, model:item.model, manufacturer:item.manufacturer,
        serial: (document.getElementById(`rc_serial_${i}`)||{}).value?.trim() || '',
        department: (document.getElementById(`rc_dept_${i}`)||{}).value?.trim() || '',
        holderName: (document.getElementById(`rc_holder_${i}`)||{}).value?.trim() || '',
        holderPhone: (document.getElementById(`rc_phone_${i}`)||{}).value?.trim() || '',
        dateReceived: (document.getElementById(`rc_date_${i}`)||{}).value || todayISO(),
        warrantyExpiry: (document.getElementById(`rc_warranty_${i}`)||{}).value || ''
      };
      state.branchUnits[dest].push(unit);
      await dbInsertBranchUnit(dest, unit);
      await addLog({type:'receive', name:item.name, qty:1, from:'ספק/חיצוני', to:dest, serial:unit.serial});
    }
  }

  closeModal();
  activeTab = dest;
  render();
  showToast('נקלט בהצלחה');
}

/* ---------------- TRANSFER (ניפוק/העברה) ---------------- */
function openTransferModal(presetLocation){
  const available = state.items.filter(it=>(state.warehouseQty[it.id]||0) > 0);
  if(available.length===0){
    openModal(`<button class="modal-close" onclick="closeModal()">×</button><h3>📤 ניפוק / העברה</h3><div class="empty">אין כרגע פריטים זמינים במחסן לניפוק.</div>`);
    return;
  }
  const itemOptions = available.map(it=>`<option value="${it.id}">${esc(it.name)} ${it.model?`(${esc(it.model)})`:''} — זמין: ${state.warehouseQty[it.id]}</option>`).join('');
  const locOptions = state.locations.map(l=>`<option value="${escAttr(l)}" ${presetLocation===l?'selected':''}>${esc(l)}</option>`).join('');

  openModal(`
    <button class="modal-close" onclick="closeModal()">×</button>
    <h3>📤 ניפוק / העברה לסניף</h3>
    <div class="msub">מוריד כמות מהמחסן ומוסיף את הפריטים המסופקים ליעד שנבחר</div>
    <div class="field"><label>פריט (מהמחסן)</label><select id="tr_item" onchange="onTransferChange()">${itemOptions}</select></div>
    <div class="row2">
      <div class="field"><label>יעד</label><select id="tr_dest" onchange="onTransferChange()">${locOptions}</select></div>
      <div class="field"><label>כמות לניפוק</label><input id="tr_qty" type="number" min="1" value="1" onchange="onTransferChange()"></div>
    </div>
    <div id="tr_units"></div>
    <div class="actions" style="justify-content:flex-end;margin-top:10px;">
      <button class="btn-ghost" onclick="closeModal()">ביטול</button>
      <button class="btn-primary" onclick="submitTransfer()">ניפוק</button>
    </div>
  `);
  onTransferChange();
}

function onTransferChange(){
  const itemId = document.getElementById('tr_item').value;
  const max = state.warehouseQty[itemId] || 0;
  const qtyInput = document.getElementById('tr_qty');
  let qty = Math.max(1, parseInt(qtyInput.value)||1);
  if(qty > max){ qty = max; qtyInput.value = max; }
  const box = document.getElementById('tr_units');
  let html = `<div class="banner">זמין במחסן: ${max} יחידות. יש להזין פרטי סיריאל לכל יחידה מנופקת.</div>`;
  for(let i=0;i<qty;i++){ html += unitCardHtml('tr', i); }
  box.innerHTML = html;
}

async function submitTransfer(){
  const itemId = document.getElementById('tr_item').value;
  const dest = document.getElementById('tr_dest').value;
  const item = itemById(itemId);
  const qty = Math.max(1, parseInt(document.getElementById('tr_qty').value)||1);
  const avail = state.warehouseQty[itemId]||0;
  if(qty > avail){ showToast('הכמות עולה על הזמין במחסן'); return; }
  if(!dest){ showToast('נא לבחור יעד'); return; }

  state.warehouseQty[itemId] = avail - qty;
  state.warehouseIssued[itemId] = (state.warehouseIssued[itemId]||0) + qty;
  await dbUpdateItem(itemId);
  if(!state.branchUnits[dest]) state.branchUnits[dest] = [];
  for(let i=0;i<qty;i++){
    const unit = {
      id: uid(), sku:item.sku, name:item.name, model:item.model, manufacturer:item.manufacturer,
      serial: (document.getElementById(`tr_serial_${i}`)||{}).value?.trim() || '',
      department: (document.getElementById(`tr_dept_${i}`)||{}).value?.trim() || '',
      holderName: (document.getElementById(`tr_holder_${i}`)||{}).value?.trim() || '',
      holderPhone: (document.getElementById(`tr_phone_${i}`)||{}).value?.trim() || '',
      dateReceived: (document.getElementById(`tr_date_${i}`)||{}).value || todayISO(),
      warrantyExpiry: (document.getElementById(`tr_warranty_${i}`)||{}).value || ''
    };
    state.branchUnits[dest].push(unit);
    await dbInsertBranchUnit(dest, unit);
    await addLog({type:'transfer', name:item.name, qty:1, from:'מחסן ראשי', to:dest, serial:unit.serial});
  }

  closeModal();
  activeTab = dest;
  render();
  showToast('הניפוק בוצע בהצלחה');
}

function editUnit(loc, unitId){
  const u = (state.branchUnits[loc]||[]).find(x=>x.id===unitId);
  if(!u) return;
  openModal(`
    <button class="modal-close" onclick="closeModal()">×</button>
    <h3>עריכת יחידה</h3>
    <div class="msub">${esc(loc)}</div>
    <div class="row2">
      <div class="field"><label>שם פריט</label><input id="eu_name" type="text" value="${escAttr(u.name)}"></div>
      <div class="field"><label>דגם</label><input id="eu_model" type="text" value="${escAttr(u.model)}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>יצרן</label><input id="eu_manufacturer" type="text" value="${escAttr(u.manufacturer)}"></div>
      <div class="field"><label>מק"ט</label><input id="eu_sku" type="text" class="mono" value="${escAttr(u.sku)}"></div>
    </div>
    <div class="field">
      <label>מספר סיריאלי</label>
      <div class="scan-row"><input id="eu_serial" type="text" class="mono" value="${escAttr(u.serial)}"><button class="btn-secondary" onclick="startScan('eu_serial')">📷</button></div>
      <div id="scanBox"></div>
    </div>
    <div class="row2">
      <div class="field"><label>מחלקה</label><input id="eu_department" type="text" value="${escAttr(u.department)}"></div>
      <div class="field"><label>שם בעל תפקיד</label><input id="eu_holder" type="text" value="${escAttr(u.holderName)}"></div>
    </div>
    <div class="row2">
      <div class="field"><label>טלפון בעל תפקיד</label><input id="eu_phone" type="tel" value="${escAttr(u.holderPhone)}"></div>
      <div class="field"><label>תאריך קבלת ציוד</label><input id="eu_date" type="date" value="${escAttr(u.dateReceived)}"></div>
    </div>
    <div class="field"><label>תוקף אחריות</label><input id="eu_warranty" type="date" value="${escAttr(u.warrantyExpiry)}"></div>
    <div class="actions" style="justify-content:flex-end;margin-top:10px;">
      <button class="btn-ghost" onclick="closeModal()">ביטול</button>
      <button class="btn-primary" onclick="saveUnitEdit('${escAttr(loc)}','${unitId}')">שמירה</button>
    </div>
  `);
}
async function saveUnitEdit(loc, unitId){
  const u = (state.branchUnits[loc]||[]).find(x=>x.id===unitId);
  if(!u) return;
  u.name = document.getElementById('eu_name').value.trim();
  u.model = document.getElementById('eu_model').value.trim();
  u.manufacturer = document.getElementById('eu_manufacturer').value.trim();
  u.sku = document.getElementById('eu_sku').value.trim();
  u.serial = document.getElementById('eu_serial').value.trim();
  u.department = document.getElementById('eu_department').value.trim();
  u.holderName = document.getElementById('eu_holder').value.trim();
  u.holderPhone = document.getElementById('eu_phone').value.trim();
  u.dateReceived = document.getElementById('eu_date').value;
  u.warrantyExpiry = document.getElementById('eu_warranty').value;
  closeModal();
  await dbUpdateBranchUnit(u);
  render();
}
async function removeUnit(loc, unitId){
  if(!confirm('להסיר את היחידה הזו מהרשימה?')) return;
  state.branchUnits[loc] = (state.branchUnits[loc]||[]).filter(u=>u.id!==unitId);
  await dbDeleteBranchUnit(unitId);
  render();
}