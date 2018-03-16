import GeoObjectCollection from 'api/GeoObjectCollection';
import Monitor from 'api/Monitor';
import nextTick from 'api/system.nextTick';
import EventManager from 'api/event.Manager';
import Event from 'api/Event';

import PBase from './PolylabelBase';
import Label from '../label/GeoObjectCollection/Label';
import State from '../util/State';

export default class PolylabelCollection extends PBase {
    constructor(map, polygonsCollection) {
        super(map);

        this._map = map;
        this._labelsCollection = new GeoObjectCollection();
        this._labelsState = new State();
        this._userState = new State(); // everything that needs to be added to the user
        this._polygonsCollection = polygonsCollection;
        this._isPolygonParentChange = new WeakMap();
        this._polylabelType = 'collection';
        this._init();
    }

    destroy() {
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonCollectionListeners();
        this._deleteLabelCollection();
        this._map.geoObjects.remove(this._labelsCollection);
    }

    /**
     * Returns the status of the label for the specified polygon
     */
    getLabelState(polygon) {
        return this._userState.getState(polygon);
    }

    _init() {
        this._map.geoObjects.add(this._labelsCollection);
        this._firstCalculatePolygons().then(() => {
            this._initMapListeners();
            this._initPolygonCollectionListeners();
            this._initLabelCollectionListeners();
        });
    }

    _firstCalculatePolygons() {
        this._clearLabelCollection();
        this._polygonsCollection.each(polygon => {
            this._calculateNewPolygon(polygon).then(label => {
                this._setLabelData(polygon, label);
            });
        });
        return Promise.resolve();
    }

    _calculatePolygons() {
        let promises = [];
        this._polygonsCollection.each(polygon => {
            if (polygon.geometry.getType() === 'Polygon') {
                const label = this._labelsState.get(polygon, 'label');
                if (label) promises.push(this._setLabelData(polygon, label));
            }
        });
        return Promise.all(promises);
    }

    /**
     * Cleaning the collection of labels
     */
    _clearLabelCollection() {
        this._labelsCollection.removeAll();
        this._labelsCollection.options.set({
            pane: 'phantom'
        });
    }

    /**
     * Destroy each label from all polygons
     */
    _deleteLabelCollection() {
        this._polygonsCollection.each(polygon => {
            const label = this._labelsState.get(polygon, 'label');
            if (label) label.destroy();
        });
        this._clearLabelCollection();
    }

    /**
     * Calculates data for the polygon label
     */
    _calculatePolygonLabelData(polygon, isLabelCreated) {
        const options = this.getConfigOptions(polygon);
        const zoomRangeOptions = this.getConfigZoomRangeOptions(polygon);

        const label = (isLabelCreated) ?
            this._labelsState.get(polygon, 'label') :
            new Label(this._map, polygon, this._labelsCollection, this);

        label.createLabelData(options, zoomRangeOptions);
        label.createLayoutTemplates();
        return Promise.resolve(label);
    }

    /**
     * Analyzes data about the label of the polygon and establishes the parameters of the label
     */
    _setLabelData(polygon, label, visibleState) {
        const data = label.setDataByZoom(this._map.getZoom(), visibleState);
        this._setCurrentConfiguredVisibility(polygon, data.currentConfiguredVisibileType);
        this._setCurrentVisibility(polygon, data.currentVisibleType);
        this._setCurrentCenter(polygon, data.currentCenter);
    }

    _setCurrentCenter(polygon, center) {
        this._userState.set(polygon, 'center', center);
    }

    /**
     * Sets the current visibility status for the polygon (automatically calculated)
     */
    _setCurrentConfiguredVisibility(polygon, type) {
        this._userState.set(polygon, 'currentConfiguredVisibility', type);
    }

    /**
     * Sets the current visibility status for the polygon
     */
    _setCurrentVisibility(polygon, type) {
        this._userState.set(polygon, 'currentVisibility', ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
    }

    /**
     * Calculates the new polygon added to the collection
     */
    _calculateNewPolygon(polygon) {
        if (polygon.geometry.getType() !== 'Polygon') {
            return Promise.reject();
        }

        return new Promise(resolve => {
            this._calculatePolygonLabelData(polygon).then(label => {
                this._labelsState.set(polygon, 'label', label);
                this._initUserStateListener(polygon);
                this._initPolygonListener(polygon);
                label.createPlacemarks();
                label.addToCollection().then(() => {
                    resolve(label);
                });
            });
        });
    }

    /**
     * Clears the status of visible all label
     * (on new zoom it did not conflict with the calculated data, since state priority is higher)
     */
    _clearVisibilityInLabelsState(value) {
        this._polygonsCollection.each(polygon => {
            this._userState.set(polygon, 'visible', value);
        });
    }

    /**
     * Listener for changing the visibility state of the label at the polygon
     */
    _initUserStateListener(polygon) {
        const monitor = new Monitor(this._userState.getState(polygon));
        this._userState.set(polygon, '_labelMonitor', monitor);
        monitor.add('visible', newValue => {
            this._setLabelData(
                polygon,
                this._labelsState.get(polygon, 'label'),
                newValue
            );
        });
    }

    /**
     * Creates listener events on the polygon
     */
    _initPolygonListener(polygon) {
        if (polygon.geometry.getType() === 'Polygon') {
            polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
        }
    }

    _onPolygonParentChangeHandler(event) {
        this._isPolygonParentChange.set(event.get('target'), true);
    }

    _onPolygonOptionsChangeHandler(event) {
        nextTick(() => { // тк может произойти удаление объекта и optionschange тоже дернется
            // сделан nextTick чтобы до этого проверить был ли parentchange, тк он происходит до optionschange
            const polygon = event.get('target');
            const label = this._labelsState.get(polygon, 'label');

            const curr = this._isPolygonParentChange.get(polygon);
            if (curr || !label) return;

            label.setVisibilityForce('none');
            label.setLayoutTemplate();

            this._calculatePolygonLabelData(polygon, true).then(label => {
                label.updateLayouts();
                this._labelsState.set(polygon, 'label', label);
                this._setLabelData(polygon, label);
            });
        });
    }

    /**
     * Creates listener events for a collection of polygons
     */
    _initPolygonCollectionListeners() {
        this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _polygonCollectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add': {
                const polygon = event.get('child');
                this._calculateNewPolygon(polygon).then(label => {
                    this._setLabelData(polygon, label);
                });
                break;
            }
            case 'remove': {
                const polygon = event.get('child');
                this._deleteLabelStateListener(polygon);
                const label = this._labelsState.get(polygon, 'label');
                if (label) label.destroy();
                break;
            }
        }
    }

    /**
     * Makes the transfer of events from the label to the corresponding polygon
     */
    _initLabelCollectionListeners() {
        const controller = {
            onBeforeEventFiring: (events, type, event) => {
                if (event.get('target').options.get('pane') === 'phantom') return false;

                let polygon = event.get('target').properties.get('polygon');
                if (!polygon) return false;

                if (type === 'mouseenter' || type === 'mouseleave') {
                    const labelInst = this._labelsState.get(polygon, 'label');
                    if (labelInst && labelInst.getLabelData().isDotDefault) {
                        if (type === 'mouseenter') {
                            labelInst.addDotClass('ymaps-polylabel-dot-default_hover');
                        } else {
                            labelInst.removeDotClass('ymaps-polylabel-dot-default_hover');
                        }
                    }
                }

                let newEvent = new Event({
                    target: polygon,
                    type: `label${type}`
                }, event);

                polygon.events.fire(`label${type}`, newEvent);
                return false;
            }
        };
        const eventManager = new EventManager({
            controllers: [controller]
        });
        this._labelsCollection.events.setParent(eventManager);
    }

    _initMapListeners() {
        this.initMapListeners((type) => {
            if (type === 'actionendzoomchange') {
                this._clearVisibilityInLabelsState();
                this._calculatePolygons();
            } else if (type === 'actionbeginzoomchange') {
                this._clearVisibilityInLabelsState('none');
            }
        });
    }

    _deleteLabelStateListeners() {
        this._polygonsCollection.each(polygon => {
            this._deleteLabelStateListener(polygon);
        });
    }

    /**
     * Removes the listener for changing the visibility state of the label at the polygon
     */
    _deleteLabelStateListener(polygon) {
        const monitor = this._userState.get(polygon, '_labelMonitor');
        if (monitor) monitor.removeAll();
    }

    /**
     * Removes listener from the polygon collection
     */
    _deletePolygonCollectionListeners() {
        this._polygonsCollection.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
        this.destroyMapListeners();
    }

    _deletePolygonsListeners() {
        this._polygonsCollection.each((polygon) => {
            this._deletePolygonListener(polygon);
        });
    }

    /**
     * Removes event listeners from a polygon
     */
    _deletePolygonListener(polygon) {
        polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
        polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
    }
}
