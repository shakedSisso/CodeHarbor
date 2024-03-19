const Store = require('electron-store');
const store = new Store();

function getValueFromStroe(key){
    return store.get(key);
}

function setValueInStore(key, value){
    store.set(key, value);
}

function initializeStore() {
    store.clear()
}

module.exports = {
    getValueFromStroe,
    setValueInStore,
    initializeStore
}