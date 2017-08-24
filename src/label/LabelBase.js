import createLayoutTemplates from './util/layoutTemplates/createLayoutTemplates';
import LabelData from './util/LabelData';
import classHelper from './util/classHelper';
import getLayoutSize from './util/getLayoutSize';

export default class LabelBase {
    constructor() {
        this._baseLayoutTemplates = null;
        this._layoutTemplates = null;
    }

    getPolylabelType() {
        return this._polylabel.getPolylabelType();
    }

    getPlacemark(type) {
        return this._placemark[type];
    }

    getLayout(type) {
        return this._layout[type];
    }

    setLayout(type, layout) {
        this._layout[type] = layout;
        this._initLayoutSizeChangeHandler(layout);
    }

    updateLayouts() {
        this.getLabelLayout('label').then(layout => {
            this.setLayout('label', layout);
        });
        this.getLabelLayout('dot').then(layout => {
            this.setLayout('dot', layout);
        });
    }

    _initLayoutSizeChangeHandler(layout) {
        const el = layout.getElement();
        if (!el) return;
        let imgs = Array.prototype.slice.call(el.getElementsByTagName('img'));
        if (imgs.length > 0) {
            const imagesLoaded = Promise.all(imgs.map(img => {
                if (img.complete) {
                    return Promise.resolve();
                }
                return new Promise(resolve => img.onload = resolve);
            }));
            imagesLoaded.then(() => {
                const size = getLayoutSize(layout);
                if (!size) return;
                if (size.width > 0 && size.height > 0) {
                    this._polylabel._setLabelData(this._polygon, this, undefined, ['dot', 'label']);
                }
            });
        }
    }

    getPolygonOptions() {
        if (this.getPolylabelType() === 'collection') {
            return this._polygon.options.getAll();
        }
        return this._polygon.options;
    }

    getLabelOptions() {
        const label = this._placemark.label;
        return (this.getPolylabelType() === 'collection') ? label.options.getAll() : label.options;
    }

    /**
     * Формирует все нужные опции для подписи (из полигона, необходимые распарсенные данные и тп)
     */
    getFormedOptionsForPlacemark(type) {
        const cursors = this._data.getLabelCursors();
        return Object.assign(
            {},
            this.getPolygonOptions(),
            this._layoutTemplates[type],
            cursors[type]
        );
    }

    /**
     * Создаем шаблоны, которые потом будут инклудиться в базовый
     */
    createLayoutTemplates() {
        const polygonOptions = this.getPolygonOptions();
        const label = polygonOptions.labelLayout;
        const dot = polygonOptions.labelDotLayout;

        if (this._prevLayout && this._prevLayout.dot === dot && this._prevLayout.label === label) {
            return;
        }

        this._layoutTemplates = createLayoutTemplates(label, dot);

        this._prevLayout = {
            dot,
            label
        };
    }

    /**
     * Возвращает значение текущей видимости
     */
    analyseVisibility(visibleState, visible, dotVisible) {
        let currState = visibleState && visibleState !== 'auto' ? visibleState : visible;
        if (currState === 'dot' && !dotVisible) currState = 'none';
        return currState;
    }

    /**
     * Устанавливает видимость для подписи
     */
    setVisibility(visibleState, visible, dotVisible) {
        const currState = this.analyseVisibility(visibleState, visible, dotVisible);
        this.setVisibilityForce(currState);
        return currState;
    }

    createLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
        return this._data;
    }

    getLabelData() {
        return this._data;
    }

    analysePane(type, visibleType) {
        return type === visibleType ? 'places' : 'phantom';
    }

    analyseOffset(size, offset) {
        const h = size.height / 2;
        const w = size.width / 2;

        return {
            left: -w + offset[0],
            top: -h + offset[1]
        };
    }

    analyseStyles(data) {
        const labelOptions = this.getLabelOptions();
        let isChange = false;
        Object.keys(data).forEach(key => {
            if (labelOptions[`iconLabel${key[0].toUpperCase()}${key.slice(1)}`] !== data[key]) {
                isChange = true;
            }
        });
        return {
            isChange,
            styles: {
                iconLabelClassName: data.className,
                iconLabelTextSize: data.textSize,
                iconLabelTextColor: data.textColor
            }
        };
    }

    analyseShape(type, size, offset) {
        const h = size.height / 2;
        const w = size.width / 2;
        const dotDefaultShape = (type === 'dot' && this._data.isDotDefault) ? 2 : 0;

        return {
            type: 'Rectangle',
            coordinates: [
                [-w + offset[0] - dotDefaultShape, -h + offset[1] - dotDefaultShape],
                [w + offset[0] + dotDefaultShape, h + offset[1] + dotDefaultShape]
            ]
        };
    }

    addDotClass(className) {
        classHelper.add(this._layout.dot, 'ymaps-polylabel-dot-default', className);
    }

    removeDotClass(className) {
        classHelper.remove(this._layout.dot, 'ymaps-polylabel-dot-default', className);
    }
}
