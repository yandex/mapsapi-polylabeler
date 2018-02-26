import templateFiltersStorage from 'api/template.filtersStorage';

import CONFIG from '../config';
import dotColorFilterStorage from '../util/templateFilterStorage/dotColor';

export default class PolylabelBased {
    constructor(map) {
        this._map = map;
        templateFiltersStorage.add('dot-color', dotColorFilterStorage);
    }

    getPolylabelType() {
        return this._polylabelType;
    }

    initMapListeners(callback) {
        this._mapCallback = callback;
        this._map.events.add(['boundschange', 'actionbegin', 'actionend'], this._mapEventsHandler, this);
    }

    destroyMapListeners() {
        this._map.events.remove(['boundschange', 'actionbegin', 'actionend'], this._mapEventsHandler, this);
    }

    _mapEventsHandler(event) {
        switch (event.get('type')) {
            case 'actionbegin': {
                const action = event.originalEvent.action;
                action.events.add('tick', this._actionTickHandler, this);
                break;
            }
            case 'actionend': {
                const action = event.originalEvent.action;
                action.events.remove('tick', this._actionTickHandler, this);

                if (this._zoomed) {
                    this._mapCallback('actionendzoomchange');
                    this._zoomed = false;
                }
                break;
            }
        }
    }

    _actionTickHandler(event) {
        const tick = event.get('tick');
        if (tick.zoom !== this._map.getZoom()) {
            if (!this._zoomed) this._mapCallback('actionbeginzoomchange');
            this._zoomed = true;
        }
    }

    /**
     * Returns all polygon options
     */
    getOptions(polygon) {
        if (this.getPolylabelType() === 'collection') {
            return polygon.options.getAll();
        } else {
            return polygon.options;
        }
    }

    /**
     * Returns the options required to create a label
     */
    getConfigOptions(polygon) {
        return CONFIG.options.reduce((result, key) => {
            result[key] = this.getPolylabelType() === 'collection' ? polygon.options.get(key) : polygon.options[key];
            return result;
        }, {});
    }

    /**
     * Returns options (type zoomRange) that are required to create a label
     */
    getConfigZoomRangeOptions(polygon) {
        return CONFIG.zoomRangeOptions.reduce((result, key) => {
            result[key] = this.getPolylabelType() === 'collection' ? polygon.options.get(key) : polygon.options[key];
            return result;
        }, {});
    }

    /**
     * Returns the properties that are required to create a label
     */
    getConfigProperties(polygon) {
        return CONFIG.properties.reduce((result, key) => {
            result[key] = this.getPolylabelType() === 'collection' ?
                polygon.properties.get(key) :
                polygon.properties[key];
            return result;
        }, {});
    }
}
