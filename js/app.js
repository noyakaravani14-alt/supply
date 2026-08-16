// חשיפת פונקציות ל-onclick + אתחול
/* expose for inline handlers */
Object.assign(window, {setTab, promptAddLocation, editItem, saveItemEdit, openReceiveModal, onReceiveItemChange,
  onReceiveQtyChange, submitReceive, openTransferModal, onTransferChange, submitTransfer, removeUnit,
  editUnit, saveUnitEdit, startScan, closeModal, runHolderSearch, viewLocationHistory, submitLogin});

initApp();