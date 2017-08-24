import LabelPlacemarkOverlay from '../util/LabelPlacemarkOverlay';
import getBaseLayoutTemplates from '../util/layoutTemplates/getBaseLayoutTemplates';
import LabelBase from '../LabelBase';

/**
 * Класс подписи полигона для ObjectManager
 */
export default class Label extends LabelBase {
    constructor(map, polygon, objectManager, polylabel) {
        super();
        this._map = map;
        this._polylabel = polylabel;
        this._polygon = polygon;
        this._objectManager = objectManager;
        this._placemark = {
            label: null,
            dot: null
        };
        this._layout = {
            label: null,
            dot: null
        };
        this._init();
    }

    destroy() {
        this.removeFromObjectManager();
    }

    addToObjectManager() {
        this.setLayoutTemplate();
        ['label', 'dot'].forEach(type => {
            this._objectManager.add(this._placemark[type]);
        });
    }

    removeFromObjectManager() {
        ['label', 'dot'].forEach(type => {
            this._objectManager.remove(this._placemark[type]);
        });
        this._polygon = null;
        this._objectManager = null;
        this._placemark = null;
        this._layout = null;
        this._data = null;
    }

    _init() {
        this._baseLayoutTemplates = getBaseLayoutTemplates();
    }

    getLabelLayout(type) {
        const overlay = this._objectManager.objects.overlays.getById(this._placemark[type].id);
        if (!overlay) return Promise.reject();
        return overlay.getLayout();
    }

    createPlacemarks() {
        ['label', 'dot'].forEach(type => {
            this._placemark[type] = Label._createPlacemark(`${type}#${this._polygon.id}`, {
                properties: Object.assign({}, {
                    polygon: this._polygon
                }, this._polygon.properties),
                options: this.getFormedOptionsForPlacemark(type)
            }, this._baseLayoutTemplates[type], this._data.getCenterCoords(this._map.getZoom()));
        });
    }

    static _createPlacemark(id, params, layout, coordinates) {
        const options = Object.assign({}, {
            iconLayout: layout,
            iconLabelPosition: 'absolute',
            overlay: LabelPlacemarkOverlay,
            pane: 'phantom'
        }, params.options);
        return {
            type: 'Feature',
            id,
            options,
            properties: params.properties,
            geometry: {
                type: 'Point',
                coordinates
            }
        };
    }

    _updateOptions(id, options) {
        this._objectManager.objects.setObjectOptions(id, options);
    }

    setLayoutTemplate() {
        Object.keys(this._layoutTemplates).forEach(type => {
            this._updateOptions(this._placemark[type].id, this._layoutTemplates[type]);
        });
    }

    /**
     * Обновляет все возможные опции в подписи
     */
    updateOptions() {
        ['dot', 'label'].forEach(type => {
            Object.assign(this._placemark[type].options, this.getFormedOptionsForPlacemark(type));
            this._updateOptions(
                this._placemark[type].id,
                this._placemark[type].options
            );
        });
    }

    setDataByZoom(zoom, types, visibleState) {
        types.forEach(type => {
            if (type === 'label') {
                const styles = this._data.getStyles(zoom);
                this.setStyles({
                    className: styles.className,
                    textSize: styles.textSize,
                    textColor: styles.textColor
                });
            }
            this.setVisibilityForce('none');
            this._data.setVisible(zoom, type, this._layout[type]);
        });

        const currentVisibleType = this.setVisibility(
            visibleState,
            this._data.getVisibility(zoom),
            this._data.getData('dotVisible')
        );

        const currentCenter = this._data.getCenterCoords(zoom);
        if (['label', 'dot'].indexOf(currentVisibleType) !== -1 &&
            this._data.getSize(zoom, currentVisibleType)) {
            this.setCoordinates(currentCenter);
            this.setOffsetAndIconShape(
                currentVisibleType,
                this._data.getSize(zoom, currentVisibleType),
                this._data.getOffset(zoom)
            );
        }

        return {
            currentVisibleType,
            currentConfiguredVisibileType: this._data.getVisibility(zoom),
            currentCenter
        };
    }

    setOffsetAndIconShape(type, size, offset) {
        const offsetResult = this.analyseOffset(size, offset);
        this._updateOptions(this._placemark[type].id, {
            iconShape: this.analyseShape(type, size, offset),
            iconLabelLeft: offsetResult.left,
            iconLabelTop: offsetResult.top
        });
    }

    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.coordinates.toString()) {
            ['dot', 'label'].forEach(type => {
                this._objectManager.remove(this._placemark[type]);
                this._generateNewPlacemark(type);
                this._placemark[type].geometry.coordinates = coords;
                this._objectManager.add(this._placemark[type]);
            });
        }
    }

    setStyles(data) {
        const styles = this.analyseStyles(data);
        if (styles.isChange) {
            this._updateOptions(this._placemark.label.id, styles.styles);
        }
    }

    setVisibilityForce(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = this.analysePane(type, visibleType);
            const label = this._objectManager.objects.getById(this._placemark[type].id);
            if (label && label.options.pane !== pane) {
                this._updateOptions(this._placemark[type].id, {pane});
            }
        });
    }

    _generateNewPlacemark(type) {
        this._placemark[type] = Object.assign({}, this._placemark[type]);
        const id = this._placemark[type].id;
        this._placemark[type].id = id[0] === '_' ? id.slice(1) : `_${id}`;
    }
}
