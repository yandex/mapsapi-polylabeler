/**
     * Check if the point is inside the polygon.
     * @param {Array[2]} point
     * @param {Array} coords - Polygon coords.
     */
export default function isInside(point, coords) {
    let parity = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        let e = [coords[i], coords[i + 1]];
        switch (edgeType(point, e)) {
            case 'TOUCHING':
                return 'BOUNDARY';
            case 'CROSSING':
                parity = 1 - parity;
        }
    }
    return (parity ? 'INSIDE' : 'OUTSIDE');
}

/**
 * Determines the position of the point relative to the edge.
 * @param {Array[2]} p - The investigated point.
 * @param {Array[2]} p0 - The first point of the edge.
 * @param {Array[2]} p1 - The second point of the edge.
 */
function pointClassify(p, p0, p1) {
    const a = pointMinus(p1, p0);
    const b = pointMinus(p, p0);
    const sa = a[0] * b[1] - b[0] * a[1];
    if (sa > 0) {
        return 'LEFT';
    }
    if (sa < 0) {
        return 'RIGHT';
    }
    if ((a[0] * b[0] < 0) || (a[1] * b[1] < 0)) {
        return 'BEHIND';
    }
    if (pointLength(a) < pointLength(b)) {
        return 'BEYOND';
    }
    if (pointEquals(p0, p)) {
        return 'ORIGIN';
    }
    if (pointEquals(p1, p)) {
        return 'DESTINATION';
    }
    return 'BETWEEN';
}

function pointMinus(p1, p2) {
    return [p1[0] - p2[0], p1[1] - p2[1]];
}

function pointLength(p) {
    return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2));
}

function pointEquals(p1, p2) {
    return p1[0] === p2[0] && p1[1] === p2[1];
}

/**
 * Determines the positions of the ray released from the point relative to the edge (Crosses, Affects, Neutral).
 * @param {Arrya[2]} point - The investigated point.
 * @param {Array} edge - Edge.
 */
function edgeType(point, edge) {
    const v = edge[0];
    const w = edge[1];
    switch (pointClassify(point, v, w)) {
        case 'LEFT': {
            return ((v[1] < point[1]) && (point[1] <= w[1])) ? 'CROSSING' : 'INESSENTIAL';
        }
        case 'RIGHT': {
            return ((w[1] < point[1]) && (point[1] <= v[1])) ? 'CROSSING' : 'INESSENTIAL';
        }
        case 'BETWEEN':
        case 'ORIGIN':
        case 'DESTINATION':
            return 'TOUCHING';
        default: {
            return 'INESSENTIAL';
        }
    }
}
