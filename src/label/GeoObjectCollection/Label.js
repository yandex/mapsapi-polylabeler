import Placemark from 'api/Placemark';
import LabelPlacemarkOverlay from '../util/LabelPlacemarkOverlay';
import getBaseLayoutTemplates from '../util/layoutTemplates/getBaseLayoutTemplates';
import LabelBase from '../LabelBase';

/**
 * Класс подписи полигона для геоколлекции
 */
export default class Label extends LabelBase {
    constructor(map, polygon, parentCollection, polylabel) {
        super();

        this._map = map;
        this._polylabel = polylabel;
        this._polygon = polygon;
        this._parentCollection = parentCollection;
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

    removeFromCollection() {
        if (!this._parentCollection) {
            return;
        }
        ['label', 'dot'].forEach(type => {
            if (this._parentCollection.indexOf(this._placemark[type]) === -1) {
                return;
            }
            this._parentCollection.remove(this._placemark[type]);
        });
        this._polygon = null;
        this._parentCollection = null;
        this._placemark = null;
        this._layout = null;
        this._data = null;
    }

    addToCollection() {
        if (!this._parentCollection) {
            return Promise.reject();
        }
        const layouts = ['label', 'dot'].map(type => {
            if (!this._placemark[type].getParent()) {
                this._parentCollection.add(this._placemark[type]);
            }

            return this.getLabelLayout(type).then(layout => {
                this.setLayout(type, layout);
            });
        });
        return Promise.all(layouts);
    }

    getLabelLayout(type) {
        return this._placemark[type].getOverlay().then(overlay => overlay.getLayout());
    }

    _init() {
        this._baseLayoutTemplates = getBaseLayoutTemplates();
    }

    createPlacemarks() {
        ['label', 'dot'].forEach(type => {
            this._placemark[type] = Label._createPlacemark({
                properties: Object.assign({}, {
                    polygon: this._polygon
                }, this._polygon.properties.getAll()),
                options: this.getFormedOptionsForPlacemark(type)
            }, this._baseLayoutTemplates[type], this._data.getCenterCoords(this._map.getZoom()));
        });
    }

    static _createPlacemark(params, layout, coords) {
        const options = Object.assign({}, {
            iconLayout: layout,
            pointOverlay: LabelPlacemarkOverlay,
            iconLabelPosition: 'absolute'
        }, params.options);
        return new Placemark(coords, params.properties, options);
    }

    setDataByZoom(zoom, visibleState) {
        ['dot', 'label'].forEach(type => {
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

    setLayoutTemplate() {
        this.createLayoutTemplates();
        Object.keys(this._layoutTemplates).forEach(type => {
            this._placemark[type].options.set(this._layoutTemplates[type]);
        });
    }

    setNewOptions(newOptions) {
        ['dot', 'label'].forEach(type => {
            this._placemark[type].options.set(newOptions);
        });
    }

    /**
     * Устанавливает координаты для подписи
     */
    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.getCoordinates().toString()) {
            ['dot', 'label'].forEach(type => {
                this._placemark[type].geometry.setCoordinates(coords);
            });
        }
    }

    setVisibilityForce(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = this.analysePane(type, visibleType);
            if (this._placemark[type].options.get('pane') !== pane) {
                this._placemark[type].options.set({pane});
            }
        });
    }

    /**
     * Устанавливает стили для подписи
     */
    setStyles(data) {
        const styles = this.analyseStyles(data);
        if (styles.isChange) {
            this._placemark.label.options.set(styles.styles);
        }
    }

    /**
     * Центрирует подпись и создает ей правильный iconShape
     */
    setOffsetAndIconShape(type, size, offset) {
        const offsetResult = this.analyseOffset(size, offset);
        this._placemark[type].options.set({
            iconShape: this.analyseShape(type, size, offset),
            iconLabelLeft: offsetResult.left,
            iconLabelTop: offsetResult.top
        });
    }

    destroy() {
        this.removeFromCollection();
    }
}
