// סריקת ברקוד/QR במצלמה
/* ---------------- BARCODE SCAN ---------------- */
function startScan(targetInputId){
  const box = document.getElementById('scanBox');
  if(!box){ showToast('לא ניתן לפתוח מצלמה כאן'); return; }
  if(typeof Html5Qrcode === 'undefined'){
    showToast('סורק הברקוד לא נטען - ניתן להזין ידנית');
    return;
  }
  box.style.display = 'block';
  box.innerHTML = '<div id="qr-reader" style="width:100%"></div>';
  stopScanner();
  html5Scanner = new Html5Qrcode("qr-reader");
  html5Scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 220 },
    (decodedText)=>{
      const el = document.getElementById(targetInputId);
      if(el) el.value = decodedText;
      stopScanner();
      showToast('נסרק בהצלחה');
    },
    ()=>{}
  ).catch(()=>{
    showToast('לא ניתן לגשת למצלמה - נא הזנה ידנית');
  });
}
function stopScanner(){
  if(html5Scanner){
    try{ html5Scanner.stop().then(()=>html5Scanner.clear()).catch(()=>{}); }catch(e){}
    html5Scanner = null;
  }
  const box = document.getElementById('scanBox');
  if(box){ box.style.display='none'; box.innerHTML=''; }
}