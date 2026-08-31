// חשיפת פונקציות ל-onclick + אתחול
/* expose for inline handlers */
Object.assign(window, {setTab, promptAddLocation, editItem, saveItemEdit, openReceiveModal, onReceiveItemChange,
  onReceiveQtyChange, submitReceive, openTransferModal, onTransferChange, submitTransfer, removeUnit,
  editUnit, saveUnitEdit, startScan, captureAndRecognize, closeModal, runHolderSearch, viewLocationHistory, submitLogin,
  editHolder, saveHolder, deleteHolder, autofillHolderEmail, scrollToTop, transferHolder, saveHolderTransfer, logout});

/* כפתור "חזרה למעלה" - מופיע רק אחרי שגוללים למטה */
function scrollToTop(){
  window.scrollTo({top:0, behavior:'smooth'});
}
window.addEventListener('scroll', ()=>{
  const btn = document.getElementById('scrollTopBtn');
  if(!btn) return;
  if(window.scrollY > 300) btn.classList.add('show');
  else btn.classList.remove('show');
});

initApp();
