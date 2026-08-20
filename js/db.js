// טעינה מ-Supabase ופעולות כתיבה (insert/update/delete)
async function loadData(){
  try{
    const [itemsRes, locsRes, unitsRes, txRes, holdersRes] = await Promise.all([
      sb.from('items').select('*'),
      sb.from('locations').select('name').order('created_at'),
      sb.from('branch_units').select('*'),
      sb.from('transactions').select('*').order('created_at', {ascending:false}),
      sb.from('holders').select('*').order('name')
    ]);
    if(itemsRes.error) throw itemsRes.error;
    if(locsRes.error) throw locsRes.error;
    if(unitsRes.error) throw unitsRes.error;
    if(txRes.error) throw txRes.error;
    if(holdersRes.error) throw holdersRes.error;

    const warehouseQty = {}, warehouseReceived = {}, warehouseIssued = {};
    const items = itemsRes.data.map(r=>{
      warehouseQty[r.id] = r.qty_warehouse||0;
      warehouseReceived[r.id] = r.received||0;
      warehouseIssued[r.id] = r.issued||0;
      return {id:r.id, sku:r.sku||'', name:r.name, model:r.model||'', manufacturer:r.manufacturer||'', reorderPoint:r.reorder_point||0};
    });

    const holders = holdersRes.data.map(r=>({id:r.id, name:r.name, email:r.email||''}));

    const branchUnits = {};
    unitsRes.data.forEach(r=>{
      if(!branchUnits[r.location]) branchUnits[r.location] = [];
      branchUnits[r.location].push({
        id:r.id, sku:r.sku||'', name:r.name, model:r.model||'', manufacturer:r.manufacturer||'',
        serial:r.serial||'', department:r.department||'', orgSku:r.org_sku||'', holderId:r.holder_id||'', holderName:r.holder_name||'',
        holderEmail:r.holder_email||'', holderPhone:r.holder_phone||'', dateReceived:r.date_received||'', warrantyExpiry:r.warranty_expiry||''
      });
    });

    const log = txRes.data.map(r=>({id:r.id, date:r.created_at, type:r.type, name:r.item_name, qty:r.qty, from:r.from_location, to:r.to_location, serial:r.serial||''}));

    state = {
      items, warehouseQty, warehouseReceived, warehouseIssued,
      locations: locsRes.data.map(r=>r.name),
      branchUnits, log, holders
    };
  }catch(e){
    console.error('Supabase load error', e);
    document.getElementById('app').innerHTML = `<div class="empty"><div class="big">⚠️</div>לא ניתן להתחבר ל-Supabase.<br>ודאו שמילאתם SUPABASE_URL ו-SUPABASE_ANON_KEY בקובץ, ושהרצתם את schema.sql.<br><span class="mono" style="font-size:11px;">${esc(e.message||String(e))}</span></div>`;
    return;
  }
  render();
}

/* ---------------- Supabase write helpers ---------------- */
async function dbInsertItem(it){
  const {error} = await sb.from('items').insert({id:it.id, sku:it.sku, name:it.name, model:it.model, manufacturer:it.manufacturer, reorder_point:it.reorderPoint||0, qty_warehouse:state.warehouseQty[it.id]||0, received:state.warehouseReceived[it.id]||0, issued:state.warehouseIssued[it.id]||0});
  if(error){ console.error(error); showToast('שגיאה בשמירת הפריט'); }
}
async function dbUpdateItem(id){
  const it = itemById(id);
  const {error} = await sb.from('items').update({
    sku:it.sku, name:it.name, model:it.model, manufacturer:it.manufacturer, reorder_point:it.reorderPoint||0,
    qty_warehouse: state.warehouseQty[id]||0, received: state.warehouseReceived[id]||0, issued: state.warehouseIssued[id]||0
  }).eq('id', id);
  if(error){ console.error(error); showToast('שגיאה בשמירה'); } else showToast('נשמר');
}
async function dbInsertLocation(name){
  const {error} = await sb.from('locations').insert({name});
  if(error){ console.error(error); showToast('שגיאה בהוספת המיקום'); }
}
async function dbInsertBranchUnit(loc, u){
  const {error} = await sb.from('branch_units').insert({
    id:u.id, location:loc, sku:u.sku, name:u.name, model:u.model, manufacturer:u.manufacturer,
    serial:u.serial, department:u.department, org_sku:u.orgSku||'', holder_id:u.holderId||null, holder_name:u.holderName, holder_email:u.holderEmail||'', holder_phone:u.holderPhone,
    date_received: u.dateReceived||null, warranty_expiry: u.warrantyExpiry||null
  });
  if(error){ console.error(error); showToast('שגיאה בשמירת היחידה'); }
}
async function dbUpdateBranchUnit(u){
  const {error} = await sb.from('branch_units').update({
    sku:u.sku, name:u.name, model:u.model, manufacturer:u.manufacturer, serial:u.serial, department:u.department,
    holder_id:u.holderId||null, holder_name:u.holderName, holder_email:u.holderEmail||'', holder_phone:u.holderPhone, org_sku:u.orgSku||'', date_received:u.dateReceived||null, warranty_expiry:u.warrantyExpiry||null
  }).eq('id', u.id);
  if(error){ console.error(error); showToast('שגיאה בשמירה'); } else showToast('נשמר');
}
async function dbDeleteBranchUnit(id){
  const {error} = await sb.from('branch_units').delete().eq('id', id);
  if(error){ console.error(error); showToast('שגיאה במחיקה'); }
}
async function dbInsertTransaction(entry){
  const {error} = await sb.from('transactions').insert({type:entry.type, item_name:entry.name, qty:entry.qty, from_location:entry.from||'', to_location:entry.to||'', serial:entry.serial||''});
  if(error){ console.error(error); showToast('שגיאה בשמירת התנועה'); }
}
async function dbInsertHolder(h){
  const {error} = await sb.from('holders').insert({id:h.id, name:h.name, email:h.email||''});
  if(error){ console.error(error); showToast('שגיאה בהוספת איש קשר'); }
}
async function dbUpdateHolder(h){
  const {error} = await sb.from('holders').update({name:h.name, email:h.email||''}).eq('id', h.id);
  if(error){ console.error(error); showToast('שגיאה בשמירה'); } else showToast('נשמר');
}
async function dbDeleteHolder(id){
  const {error} = await sb.from('holders').delete().eq('id', id);
  if(error){ console.error(error); showToast('שגיאה במחיקה - ייתכן שאיש הקשר משויך ליחידות קיימות'); }
}
