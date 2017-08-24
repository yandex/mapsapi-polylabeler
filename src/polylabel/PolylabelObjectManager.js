import Monitor from 'api/Monitor';
import ObjectManager from 'api/ObjectManager';
import nextTick from 'api/system.nextTick';
import EventManager from 'api/event.Manager';

import PBase from './PolylabelBase';
import Label from '../label/ObjectManager/Label';
import State from '../util/State';

export default class PolylabelObjectManager extends PBase {
    constructor(map, objectManager) {
        super(map);
        this._map = map;
        this._polygonsObjectManager = objectManager;
        this._labelsObjectManager = new ObjectManager();
        this._labelsState = new State();
        this._userState = new State(); // складывается все что нужно юзеру
        this._polylabelType = 'objectmanager';
        this._init();
    }

    destroy() {
        this._deleteLabelsOverlaysListeners();
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonsObjectsListeners();
        this._deleteLabelsOMListeners();
    }

    /**
     * Возвращает состояние подписи для указанного полигона
     */
    getLabelState(polygon) {
        return this._userState.getState(polygon);
    }

    _init() {
        this._map.geoObjects.add(this._labelsObjectManager);
        this._initLabelsOverlaysListeners();
        this._initPolygonsObjectsListeners();
        this._initPolygonsListeners();
        this._initLabelsOMListeners();

        this._calculatePolygons().then(() => this._initMapListeners());
    }

    /**
     * Устанавливает данные для подписей для текущего зума
     */
    _calculatePolygons() {
        this._polygonsObjectManager.objects.each(polygon => {
            this._calculateNewPolygon(polygon);
        });
        return Promise.resolve();
    }

    /**
     * Рассчитывает данные для подписи полигона
     * Создает подпись
     */
    _calculatePolygonLabelData(polygon, isLabelCreated) {
        const options = this.getConfigOptions(polygon);
        const zoomRangeOptions = this.getConfigZoomRangeOptions(polygon);

        const label = (isLabelCreated) ?
            this._labelsState.get(polygon, 'label') :
            new Label(this._map, polygon, this._labelsObjectManager, this);

        label.createLabelData(options, zoomRangeOptions);
        label.createLayoutTemplates();
        return Promise.resolve(label);
    }

    /**
     * Анализирует данные о подписи полигона и устанавливает параметры подписи
     */
    _setLabelData(polygon, label, visibleState, types) {
        const data = label.setDataByZoom(this._map.getZoom(), types, visibleState);
        this._setCurrentConfiguredVisibility(polygon, data.currentConfiguredVisibileType);
        this._setCurrentVisibility(polygon, data.currentVisibleType);
        this._setCurrentCenter(polygon, data.currentCenter);
    }

    _setCurrentCenter(polygon, center) {
        this._userState.set(polygon, 'center', center);
    }

    _setCurrentConfiguredVisibility(polygon, type) {
        this._userState.set(polygon, 'currentConfiguredVisibility', type);
    }

    _setCurrentVisibility(polygon, type) {
        this._userState.set(polygon, 'currentVisibility', ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
    }

    /**
     * Слушатель на изменение состояния видимости подписи у полигона
     */
    _initLabelStateListener(polygon) {
        const monitor = new Monitor(this._userState.getState(polygon));
        this._userState.set(polygon, '_labelMonitor', monitor);
        monitor.add('visible', newValue => {
            if (!polygon) return;
            this._setLabelData(
                polygon,
                this._labelsState.get(polygon, 'label'),
                newValue,
                ['dot', 'label']
            );
        });
    }

    _initLabelsOverlaysListeners() {
        this._labelsObjectManager.objects.overlays.events.add(
            ['add', 'remove'], this._labelsOverlaysEventHandler, this
        );
    }

    _getLabelType(labelId) {
        return labelId.indexOf('label#') !== -1 ? 'label' : 'dot';
    }

    _labelOverlaysGeometryChangeHandler(event) {
        const overlay = event.get('target');
        const labelId = overlay._data.id;

        overlay.getLayout().then(layout => {
            const labelType = this._getLabelType(labelId);
            const label = this._labelsObjectManager.objects.getById(labelId);
            if (!label) return;

            const polygon = label.properties.polygon;
            const labelInst = this._labelsState.get(polygon, 'label');
            labelInst.setLayout(labelType, layout);
            this._setLabelData(polygon, labelInst, undefined, [labelType]);
        });
    }

    _labelsOverlaysEventHandler(event) {
        const labelId = event.get('objectId');
        const labelType = this._getLabelType(labelId);
        const overlay = event.get('overlay');

        switch (event.get('type')) {
            case 'add': {
                overlay.events.add('geometrychange', this._labelOverlaysGeometryChangeHandler, this);
                nextTick(() => { // overlay добавляется на карту на следующем тике
                    if (!overlay) return;
                    overlay.getLayout().then(layout => {
                        if (!layout) return;
                        const label = this._labelsObjectManager.objects.getById(labelId);
                        if (!label) return;

                        const polygon = label.properties.polygon;
                        const labelInst = this._labelsState.get(polygon, 'label');
                        labelInst.setLayout(labelType, layout);
                        this._setLabelData(polygon, labelInst, undefined, [labelType]);
                    });
                });
                break;
            }
            case 'remove': {
                overlay.events.remove('geometrychange', this._labelOverlaysGeometryChangeHandler, this);
                break;
            }
        }
    }

    _clearVisibilityInLabelsState(value) {
        this._polygonsObjectManager.objects.each(polygon => {
            this._userState.set(polygon, 'visible', value);
        });
    }

    _initMapListeners() {
        this.initMapListeners(type => {
            if (type === 'actionendzoomchange') {
                this._clearVisibilityInLabelsState();
            } else if (type === 'actionbeginzoomchange') {
                this._clearVisibilityInLabelsState('none');
            }
        });
    }

    _initPolygonsObjectsListeners() {
        this._polygonsObjectManager.objects.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _polygonCollectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add': {
                const polygon = event.get('child');
                this._calculateNewPolygon(polygon);
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

    _calculateNewPolygon(polygon) {
        if (polygon.geometry.type === 'Polygon') {
            this._calculatePolygonLabelData(polygon).then(label => {
                this._labelsState.set(polygon, 'label', label);
                this._initLabelStateListener(polygon);
                label.createPlacemarks();
                label.addToObjectManager();
            });
        }
    }

    _initPolygonsListeners() {
        this._polygonsObjectManager.objects.events.add(
            ['optionschange', 'objectoptionschange'],
            this._onPolygonOptionsChangeHandler,
            this
        );
    }

    _onPolygonOptionsChangeHandler(event) {
        const polygon = this._polygonsObjectManager.objects.getById(event.get('objectId'));
        if (!polygon) return;

        this._calculatePolygonLabelData(polygon, true).then(label => {
            label.setVisibilityForce('none');
            this._labelsState.set(polygon, 'label', label);

            label.setLayoutTemplate();
            label.updateOptions();
            label.updateLayouts();
            this._setLabelData(polygon, this._labelsState.get(polygon, 'label'), undefined, ['dot', 'label']);
        });
    }

    _initLabelsOMListeners() {
        let controller = {
            onBeforeEventFiring: (events, type, event) => {
                const labelId = event.get('objectId');
                if (!labelId) return false;

                let polygonId = labelId.split('#')[1];
                polygonId = isNaN(Number(polygonId)) ? polygonId : Number(polygonId);

                const polygon = this._polygonsObjectManager.objects.getById(polygonId);
                const label = this._labelsObjectManager.objects.getById(labelId);
                if (label && label.options.pane === 'phantom' || !polygon) return false;

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

                this._polygonsObjectManager.events.fire(`label${type}`, {
                    objectId: polygonId,
                    type: `label${type}`
                });

                return false;
            }
        };
        let eventManager = new EventManager({
            controllers: [controller]
        });
        this._labelsObjectManager.events.setParent(eventManager);
    }

    _deleteLabelStateListeners() {
        this._polygonsObjectManager.objects.each(polygon => {
            if (polygon.geometry.type === 'Polygon') {
                this._deleteLabelStateListener(polygon);
            }
        });
    }

    _deleteLabelStateListener(polygon) {
        const monitor = this._userState.get(polygon, '_labelMonitor');
        if (monitor) monitor.removeAll();
    }

    _deleteLabelsOverlaysListeners() {
        this._labelsObjectManager.objects.overlays.events.remove(
            ['add', 'remove'], this._labelsOverlaysEventHandler, this
        );
    }

    _deletePolygonsListeners() {
        this._polygonsObjectManager.objects.events.remove(['optionschange', 'objectoptionschange'],
            this._onPolygonOptionsChangeHandler, this);
    }

    _deletePolygonsObjectsListeners() {
        this._polygonsObjectManager.objects.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
        this.destroyMapListeners();
    }

    /**
     * Уничтожаем каждую подпись у всех полигонов
     */
    _deleteLabelsOMListeners() {
        this._polygonsObjectManager.objects.each(polygon => {
            const label = this._labelsState.get(polygon, 'label');
            if (polygon.geometry.type === 'Polygon' && label) {
                label.destroy();
            }
        });
        this._clearLabels();
    }

    _clearLabels() {
        this._labelsObjectManager.removeAll();
    }
}
