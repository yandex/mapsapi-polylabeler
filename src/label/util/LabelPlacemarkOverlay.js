import overlayPlacemark from 'api/overlay.Placemark';
import GeoObject from 'api/GeoObject';

/**
 * Puts the data into a label from the polygon
 */
export default class LabelPlacemarkOverlay extends overlayPlacemark {
    constructor(geometry, properties, options) {
        super(geometry, properties, options);
    }

    getData() {
        const polygon = this._data.geoObject instanceof GeoObject ?
            this._data.geoObject.properties.get('polygon') :
            this._data.properties.polygon;

        return {
            geoObject: polygon,
            properties: polygon.properties,
            //options: polygon.options, TODO невозможно переопределить опции, потому что https://github.yandex-team.ru/mapsapi/jsapi-v2/blob/master/src/overlay/view/abstract/baseWithLayout/overlay.view.BaseWithLayout.js#L99
            state: polygon.state
        };
    }
}
