import CONFIG from '../../config';
import parseZoomData from '../../util/zoom/parseZoomData';
import getPolylabelCenter from '../../util/getPolesOfInaccessibility';
import setZoomVisibility from '../../util/zoom.setZoomVisibility';
import transformPolygonCoords from '../../util/transformPolygonCoords';
import getPolygonWithMaxArea from '../../util/getPolygonWithMaxArea';
import transformHexToRGB from '../../util/transformHexToRGB';

const {
    MIN_ZOOM,
    MAX_ZOOM,
    DEFAULT_POLYGON_FILL_COLOR
} = CONFIG;

const LABEL_CLASS_DEFAULT = 'ymaps-polylabel-label-default';
const LABEL_CLASS_LIGHT = 'ymaps-polylabel-light-label';
const LABEL_CLASS_DARK = 'ymaps-polylabel-dark-label';
const LABEL_SIZE_DEFAULT = parseZoomData({'1_6': 12, '7_18': 14});

export default class LabelData {
    constructor(polygon, options, zoomRangeOptions, map, label) {
        this._map = map;
        this._label = label;
        this._polygon = polygon;
        this._data = {
            zoomInfo: {}, // Объект с информацией для каждого зума
            autoCenter: [0, 0],
            dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
        };
        this.parsedOptions = LabelData._parseOptions(zoomRangeOptions);
        this._polygonCoordsWithMaxArea = transformPolygonCoords.polygon(getPolygonWithMaxArea(this.getPolygonCoords()));
        this.updateDotDefaultFlag();
        this._init();
    }

    setData(key, val) {
        this._data[key] = val;
    }

    getData(key) {
        return this._data[key];
    }

    setZoomInfo(zoom, key, value) {
        this._data.zoomInfo[zoom][key] = value;
    }

    getZoomInfo(zoom) {
        if (zoom || typeof zoom === 'number' && zoom === 0) {
            return this._data.zoomInfo[zoom];
        }
        return this._data.zoomInfo;
    }

    getPolygonCoords() {
        return this._label.getPolylabelType() === 'collection' ?
            this._polygon.geometry.getCoordinates() :
            this._polygon.geometry.coordinates;
    }

    getLabelCursors() {
        const DEFAULT = 'grab';
        const result = {
            dot: {},
            label: {}
        };
        if (this._label.getPolylabelType() === 'collection') {
            result.label.cursor = this._polygon.options.get('labelCursor') || DEFAULT;
            result.dot.cursor = this._polygon.options.get('labelDotCursor') || DEFAULT;
        } else {
            result.label.cursor = this._polygon.options.labelCursor || DEFAULT;
            result.dot.cursor = this._polygon.options.labelDotCursor || DEFAULT;
        }
        return result;
    }

    getLabelDefaults(zoom) {
        const defaults = this._label.getPolylabelType() === 'collection' ?
            this._polygon.options.get('labelDefaults') :
            this._polygon.options.labelDefaults;
        if (!defaults) return;
        return {
            className: defaults === 'dark' ?
                `${LABEL_CLASS_DEFAULT} ${LABEL_CLASS_DARK}` :
                `${LABEL_CLASS_DEFAULT} ${LABEL_CLASS_LIGHT}`,
            textSize: LABEL_SIZE_DEFAULT[zoom]
        };
    }

    getCenterCoords(zoom) {
        return this.parsedOptions.labelCenterCoords &&
            this.parsedOptions.labelCenterCoords[zoom] || this._data.autoCenter;
    }

    getStyles(zoom) {
        const defaults = this.getLabelDefaults(zoom);
        if (defaults) {
            return {
                className: defaults.className,
                textSize: defaults.textSize
            };
        }
        return {
            className: this.parsedOptions.labelClassName && this.parsedOptions.labelClassName[zoom],
            textSize: this.parsedOptions.labelTextSize && this.parsedOptions.labelTextSize[zoom],
            textColor: this.parsedOptions.labelTextColor && this.parsedOptions.labelTextColor[zoom]
        };
    }

    getPolygonFillColor() {
        const color = this._label.getPolylabelType() === 'collection' ?
            this._polygon.options.get('fillColor') :
            this._polygon.options.fillColor;
        return color || DEFAULT_POLYGON_FILL_COLOR;
    }

    getDotColorByPolygonColor() {
        let color = this.getPolygonFillColor();
        let checkColor = transformHexToRGB(color, 0.9);
        if (checkColor) color = checkColor;
        return color;
    }

    getVisibility(zoom) {
        return this.parsedOptions.labelForceVisible && this.parsedOptions.labelForceVisible[zoom] ||
            this._data.zoomInfo[zoom].visible;
    }

    getOffset(zoom) {
        return this.parsedOptions.labelOffset && this.parsedOptions.labelOffset[zoom] || [0, 0];
    }

    updateDotDefaultFlag() {
        this.isDotDefault = this._label.getPolygonOptions().labelDotLayout ? false : true;
    }

    getPermissibleInaccuracyOfVisibility(zoom) {
        return this.parsedOptions.labelPermissibleInaccuracyOfVisibility &&
            this.parsedOptions.labelPermissibleInaccuracyOfVisibility[zoom] || 0;
    }

    getSize(zoom, type) {
        return this._data.zoomInfo[zoom][`${type}Size`];
    }

    setSize(zoom, type, size) {
        if (size.height > 0 && size.width > 0) {
            this._data.zoomInfo[zoom][`${type}Size`] = size;
        }
    }

    setVisible(zoom, type, layout) {
        if (this.getSize(zoom, type)) return;
        const zoomData = setZoomVisibility(
            type,
            this._map,
            zoom,
            this._data.zoomInfo[zoom].visible,
            layout,
            transformPolygonCoords.point(this.getCenterCoords(zoom), this._polygonCoordsWithMaxArea.isPositivePart),
            this._polygonCoordsWithMaxArea.coords,
            this.getOffset(zoom),
            this.getPermissibleInaccuracyOfVisibility(zoom)
        );
        if (!zoomData) return;

        this._data.zoomInfo[zoom].visible = zoomData.visible;
        this.setSize(zoom, type, zoomData.size);
    }

    _checkParams() {
        if (!this._label.getPolygonOptions().labelLayout) {
            const errText = 'Не указан шаблон для подписи (labelLayout)';
            console.error(errText);
            throw new Error(errText);
        }
    }

    _init() {
        this._checkParams();
        const autoCenter = getPolylabelCenter(this._polygonCoordsWithMaxArea.coords, 1.0);
        this._data.autoCenter = autoCenter;

        for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
            this._data.zoomInfo[z] = LabelData._createDefaultZoomInfo(z);
        }
    }

    static _parseOptions(options) {
        let result = {};
        Object.keys(options).forEach(key => {
            result[key] = parseZoomData(options[key]);
        });
        return result;
    }

    static _createDefaultZoomInfo() {
        return {
            visible: 'none', // label | dot | none,
            dotSize: undefined,
            labelSize: undefined
        };
    }
}
