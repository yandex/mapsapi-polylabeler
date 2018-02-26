// these functions are needed to transform the coordinates of the polygon,
// because there are transitions from 180 to -180,
// that violates the function of calculating the center
const methods = {
    polygon: polygon,
    point: point
};

function point(coords, isPositivePart) {
    const key = getKey(coords);
    return transformPoint(isPositivePart, key, coords);
}

function polygon(coords) {
    let result = [];
    let isPositivePart = true; // true = positive, false = negative
    for (let i = 0; i < coords.length; i++) {
        const pointCoords = coords[i];
        if (i === 0) {
            isPositivePart = pointCoords[1] >= 0 ? true : false;
        }
        const key = getKey(pointCoords);
        result.push(transformPoint(isPositivePart, key, pointCoords));
    }
    return {
        coords: result,
        isPositivePart
    };
}

function transformPoint(isPositivePart, key, pointCoords) {
    return isPositivePart ? transformPositive(key, pointCoords) : transformNegative(key, pointCoords);
}

/**
 * Gets the key, which says which of the seams is closer
 */
function getKey(p) {
    const arr = [
        {
            key: '180',
            distance: 180 - p[1]
        },
        {
            key: '-180',
            distance: Math.abs(-180 - p[1])
        },
        {
            key: '0',
            distance: Math.abs(p[1])
        }
    ];
    return arr.sort(comparator)[0].key;
}

function transformPositive(key, point) {
    return (key === '-180') ? [point[0], 360 + point[1]] : point;
}

function transformNegative(key, point) {
    return (key === '180') ? [point[0], -360 + point[1]] : point;
}

function comparator(a, b) {
    return a.distance - b.distance;
}

export default methods;
