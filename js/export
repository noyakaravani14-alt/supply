// ייצוא טבלאות ל-Excel (SheetJS, נטען לפי דרישה בלבד)
function loadXLSX(){
  return new Promise((resolve, reject)=>{
    if(typeof XLSX !== 'undefined'){ resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = ()=>resolve();
    s.onerror = ()=>reject(new Error('xlsx load failed'));
    document.head.appendChild(s);
  });
}

function downloadExcel(rows, sheetName){
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0,31));
  XLSX.writeFile(wb, `${sheetName}.xlsx`);
}

async function exportWarehouseToExcel(){
  showToast('מכינה קובץ...');
  try{
    await loadXLSX();
    const rows = state.items.map(it=>({
      'מק"ט': it.sku,
      'שם פריט': it.name,
      'דגם': it.model,
      'יצרן': it.manufacturer,
      'נקלט': state.warehouseReceived[it.id]||0,
      'נופק': state.warehouseIssued[it.id]||0,
      'כמות במלאי': state.warehouseQty[it.id]||0,
      "נקודת הזמנה": it.reorderPoint||0
    }));
    downloadExcel(rows, 'מחסן');
  }catch(e){
    showToast('שגיאה ביצוא לאקסל');
  }
}

async function exportLocationToExcel(loc){
  showToast('מכינה קובץ...');
  try{
    await loadXLSX();
    const rows = unitsOf(loc).map(u=>({
      'מק"ט': lookupRealSku(u.name, u.model),
      'מק"ט ארגוני': u.sku,
      'שם פריט': u.name,
      'דגם': u.model,
      "מס' סיריאלי": u.serial,
      'מחלקה': u.department,
      'בעל תפקיד': u.holderName,
      'אימייל': u.holderEmail,
      'טלפון': u.holderPhone,
      'תאריך קבלה': u.dateReceived,
      'תוקף אחריות': u.warrantyExpiry
    }));
    downloadExcel(rows, loc);
  }catch(e){
    showToast('שגיאה ביצוא לאקסל');
  }
}
