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

/* ---------------- HOLDERS DIRECTORY (אנשי קשר) ---------------- */
function editHolder(id){
  const h = id ? holderById(id) : null;
  openModal(`
    <button class="modal-close" onclick="closeModal()">×</button>
    <h3>${h?'עריכת איש קשר':'איש קשר חדש'}</h3>
    <div class="field"><label>שם</label><input id="ho_name" type="text" value="${h?escAttr(h.name):''}"></div>
    <div class="field"><label>אימייל</label><input id="ho_email" type="text" value="${h?escAttr(h.email):''}"></div>
    <div class="actions" style="justify-content:flex-end;margin-top:10px;">
      <button class="btn-ghost" onclick="closeModal()">ביטול</button>
      <button class="btn-primary" onclick="saveHolder(${h?`'${h.id}'`:'null'})">שמירה</button>
    </div>
  `);
}
async function saveHolder(id){
  const name = document.getElementById('ho_name').value.trim();
  const email = document.getElementById('ho_email').value.trim();
  if(!name){ showToast('נא להזין שם'); return; }
  if(id){
    const h = holderById(id);
    h.name = name; h.email = email;
    await dbUpdateHolder(h);
  } else {
    const h = {id: uid(), name, email};
    state.holders.push(h);
    await dbInsertHolder(h);
  }
  closeModal();
  render();
}
async function deleteHolder(id){
  if(!confirm('להסיר את איש הקשר הזה מהמאגר?')) return;
  state.holders = state.holders.filter(h=>h.id!==id);
  await dbDeleteHolder(id);
  render();
}

// מוצא איש קשר קיים לפי שם מדויק, או יוצר חדש במאגר אם יש גם שם וגם אימייל
async function resolveHolder(name, email){
  if(!name) return {id:'', email:''};
  const existing = state.holders.find(h=>h.name===name);
  if(existing){
    if(email && !existing.email){ existing.email = email; await dbUpdateHolder(existing); }
    return {id: existing.id, email: existing.email||email};
  }
  if(email){
    const h = {id: uid(), name, email};
    state.holders.push(h);
    await dbInsertHolder(h);
    return {id: h.id, email};
  }
  return {id:'', email:''};
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
      <div class="field"><label>נופק (סה"כ שיצא)</label><input id="ei_issued" type="number" min="0" value="${state.warehouseIssued[it.id]||0}"></div>
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
      <div class="field"><label>כמות</
