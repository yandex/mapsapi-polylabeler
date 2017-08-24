import calculateArea from 'api/util.calculateArea';
import GeoObject from 'api/GeoObject';

export default function (polygonCoords) {
    if (typeof calculateArea === 'undefined') {
        throw new Error('Didn\'t find calculateArea module');
    }
    let maxArea = Number.MIN_VALUE;
    let indexOfMaxArea = 0;
    for (let i = 0; i < polygonCoords.length; i++) {
        let polygon = new GeoObject({
            geometry: {
                type: 'Polygon', coordinates: [polygonCoords[i]]
            }
        });
        let area = Math.round(calculateArea(polygon));
        if (maxArea < area) {
            maxArea = area;
            indexOfMaxArea = i;
        }
    }
    return polygonCoords[indexOfMaxArea];
}
