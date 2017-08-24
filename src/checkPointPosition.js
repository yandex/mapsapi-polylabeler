ymaps.modules.define('checkPointPosition', [], function (provide) {

    /**
     * Проверятет находится ли точка внутри геометрии
     * @param {Array[2]} point 
     * @param {Array} coords 
     */
    function isInside(point, coords) {
        var parity = 0;
        for (var i = 0; i < coords.length - 1; i++) {
            var e = [coords[i], coords[i + 1]];
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
     * Определяет положение точки относительно ребра
     * @param {Array[2]} p - исследуемая точка
     * @param {Array[2]} p0 - точка ребра
     * @param {Array[2]} p1 - точка ребра
     */
    function pointClassify(p, p0, p1) {
        var a = pointMinus(p1, p0);
        var b = pointMinus(p, p0);
        var sa = a[0] * b[1] - b[0] * a[1];
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
     * Определяет как луч из точки взаимодействет с ребром (Пересекает, Касается, нейтральна)
     * @param {Arrya[2]} point - исследуемая точка
     * @param {Array} edge - ребро
     */
    function edgeType(point, edge) {
        var v = edge[0];
        var w = edge[1];
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
    provide(isInside);
});
