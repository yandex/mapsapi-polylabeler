import isInside from '../checkPointPosition';
import CONFIG from '../../config';

export default function (map, center, coords, size, offset, resolvedInaccuracy) {
    let {MIN_ZOOM: i, MAX_ZOOM: j} = CONFIG;
    let zoom;
    while (i < j) {
        zoom = Math.floor((i + j) / 2);
        const ri = isNaN(Number(resolvedInaccuracy)) ? 0 : Number(resolvedInaccuracy);
        const elemPoints = getElemPoints(map, center, zoom, size, offset || [0, 0], ri);
        if (checkIsInside(map, coords, elemPoints.normal, zoom) ||
            (ri !== 0 && checkIsInside(map, coords, elemPoints.withInaccuracy, zoom))) {
            j = zoom;
        } else {
            i = zoom + 1;
        }
    }
    return i;
}

function getElemPoints(map, center, zoom, size, offset, ri) {
    const centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
    let {width: w, height: h} = size;

    centerProj[0] += offset[0];
    centerProj[1] += offset[1];

    let elemPoints = [];
    let elemPointsWithInaccuracy = [];
    elemPoints.push(
        [centerProj[0] - w / 2, centerProj[1] - h / 2],
        [centerProj[0] - w / 2, centerProj[1] + h / 2],
        [centerProj[0] + w / 2, centerProj[1] - h / 2],
        [centerProj[0] + w / 2, centerProj[1] + h / 2]
    );
    elemPointsWithInaccuracy.push(
        [
            elemPoints[0][0] + ri > centerProj[0] ? centerProj[0] : elemPoints[0][0] + ri,
            elemPoints[0][1] + ri > centerProj[1] ? centerProj[1] : elemPoints[0][1] + ri
        ],
        [
            elemPoints[1][0] + ri > centerProj[0] ? centerProj[0] : elemPoints[1][0] + ri,
            elemPoints[1][1] - ri < centerProj[1] ? centerProj[1] : elemPoints[1][1] - ri
        ],
        [
            elemPoints[2][0] - ri < centerProj[0] ? centerProj[0] : elemPoints[2][0] - ri,
            elemPoints[2][1] + ri > centerProj[1] ? centerProj[1] : elemPoints[2][1] + ri
        ],
        [
            elemPoints[3][0] - ri < centerProj[0] ? centerProj[0] : elemPoints[3][0] - ri,
            elemPoints[3][1] - ri < centerProj[1] ? centerProj[1] : elemPoints[3][1] - ri
        ]
    );
    return {
        normal: elemPoints,
        withInaccuracy: elemPointsWithInaccuracy
    };
}

function checkIsInside(map, coords, elemPoints, zoom) {
    for (let i = 0; i < elemPoints.length; i++) {
        const point = map.options.get('projection').fromGlobalPixels(elemPoints[i], zoom);
        if (isInside(point, coords) !== 'INSIDE') {
            return false;
        }
    }
    return true;
}
