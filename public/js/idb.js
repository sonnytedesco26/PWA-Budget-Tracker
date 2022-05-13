let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {

    const db = event.target.result;
    db.createObjectStore('pendingResult', { autoIncrement: true });
  };
  
  request.onsuccess = function(event) {
    // when db is successfully created with createObjectStore, saves reference to db
    db = event.target.result;
  
    // checks if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        checkDatabase();
    }
  };
  
  request.onerror = function(event) {
    console.log(event.target.errorCode);
  };
  
  function saveRecord(record) {
    const transaction = db.transaction(['pendingResult'], 'readwrite');
  
    const store = transaction.objectStore('pendingResult');
  
    // add record to your store
    store.add(record);
  }
  
  function checkDatabase() {
    // open a transaction on pendingResult db
    const transaction = db.transaction(['pendingResult'], 'readwrite');
  
    // access your pendingResult objectStore
    const store = transaction.objectStore('pendingResult');
  
    // get all records from store and set to variable
    const getAll = store.getAll();
  
    getAll.onsuccess = function() {
      // if there was data in indexedDb store, send it to the api
      if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
          method: 'POST',
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(serverResponse => {
            if (serverResponse.message) {
              throw new Error(serverResponse);
            }
            //opens transaction on pendingResult database
            const transaction = db.transaction(['pendingResult'], 'readwrite');
            const store = transaction.objectStore('pendingResult');
            // clears all items in store when done
            store.clear();
          })
          .catch(err => {
            console.log(err);
          });
      }
    };
  }
  
  // listens for app to come back online
  window.addEventListener('online', checkDatabase);
  
