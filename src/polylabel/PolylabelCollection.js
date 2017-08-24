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
        this._userState = new State(); // складывается все что нужно юзеру
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
     * Возвращает состояние подписи для указанного полигона
     */
    getLabelState(polygon) {
        return this._userState.getState(polygon);
    }

    _init() {
        this._map.geoObjects.add(this._labelsCollection);
        this._firstCalculatePolygons().then(() => {
            this._initMapListeners();
            this._initPolygonCollectionListeners();
            //this._initPolygonsListeners();
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
     * Очистка коллекции подписей
     */
    _clearLabelCollection() {
        this._labelsCollection.removeAll();
        this._labelsCollection.options.set({
            pane: 'phantom'
        });
    }

    /**
     * Уничтожаем каждую подпись у всех полигонов
     */
    _deleteLabelCollection() {
        this._polygonsCollection.each(polygon => {
            const label = this._labelsState.get(polygon, 'label');
            if (label) label.destroy();
        });
        this._clearLabelCollection();
    }

    /**
     * Рассчитывает данные для подписи полигона
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
     * Анализирует данные о подписи полигона и устанавливает параметры подписи
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
     * Устанавливает статус текущей видимости для полигона (автоматически рассчитанный)
     */
    _setCurrentConfiguredVisibility(polygon, type) {
        this._userState.set(polygon, 'currentConfiguredVisibility', type);
    }

    /**
     * Устанавливает статус текущей видимости для полигона
     */
    _setCurrentVisibility(polygon, type) {
        this._userState.set(polygon, 'currentVisibility', ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
    }

    /**
     * Рассчитывает добавленный в коллекцию новый полигон
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
     * Сбрасывает состояние visible всех подписей
     * (на новых зумах оно не конфликтовало с рассчитанными данными, тк у state приоритет выше)
     */
    _clearVisibilityInLabelsState(value) {
        this._polygonsCollection.each(polygon => {
            this._userState.set(polygon, 'visible', value);
        });
    }

    /**
     * Слушатель на изменение состояния видимости подписи у полигона
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

    /* _initPolygonsListeners() {
        this._polygonsCollection.each(polygon => {
            this._initPolygonListener(polygon);
        });
    } */

    /**
     * Создает слушатели событий на полигон
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
     * Создает слушатели событий на коллекцию полигонов
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
     * Делает проброс событий с подписи на соответствующий полигон
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
     * Удаляет слушатель на изменение состояния видимости подписи у полигона
     */
    _deleteLabelStateListener(polygon) {
        const monitor = this._userState.get(polygon, '_labelMonitor');
        if (monitor) monitor.removeAll();
    }

    /**
     * Удаляет слушатели событий с коллекции полигонов
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
     * Удаляет слушатели событий с полигона
     */
    _deletePolygonListener(polygon) {
        polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
        polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
    }
}
