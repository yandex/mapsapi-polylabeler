import DataManager from 'api/data.Manager';

export default class State {
    constructor() {
        this._state = new WeakMap();
    }

    _getDataManager(polygon) {
        let dataManager = this._state.get(polygon);
        if (!dataManager) {
            dataManager = new DataManager();
            this._state.set(polygon, dataManager);
        }
        return dataManager;
    }

    set(polygon, key, value) {
        const dataManager = this._getDataManager(polygon);
        dataManager.set(key, value);
    }

    get(polygon, key) {
        const dataManager = this._getDataManager(polygon);
        if (dataManager) {
            return dataManager.get(key);
        }
    }

    getState(polygon) {
        return this._getDataManager(polygon);
    }
}
