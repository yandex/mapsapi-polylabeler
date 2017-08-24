import getFirstZoomInside from './getFirstZoomInside';
import getLayoutSize from '../../label/util/getLayoutSize';

export default function (
    labelType, map, zoom, currVisible, layout, center,
    polygonCoordinates, labelOffset, permissibleInaccuracyOfVisibility
) {
    return analyze(
        labelType,
        map,
        zoom,
        currVisible,
        layout,
        center,
        polygonCoordinates,
        labelOffset,
        permissibleInaccuracyOfVisibility
    );
}

function getVisible(currentType, newType, newIsVisible) {
    let types = ['none', 'dot', 'label'];
    let result = currentType;
    if (newIsVisible) {
        result = types.indexOf(newType) > types.indexOf(currentType) ? newType : currentType;
    }
    return result;
}

function analyze(type, map, zoom, currVisible, layout, center,
    polygonCoordinates, labelOffset, permissibleInaccuracyOfVisibility) {
    const size = getLayoutSize(layout);
    if (!size || size.width === 0 || size.height === 0) return;

    const firstZoomInside = getFirstZoomInside(
        map,
        center,
        polygonCoordinates,
        size,
        labelOffset,
        permissibleInaccuracyOfVisibility
    );

    return {
        visible: getVisible(currVisible, type, zoom >= firstZoomInside),
        size
    };
}
