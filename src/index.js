ymaps.modules.define('util.polylabel', [
    'getPolyLabelCenter',
    'util.nodeSize',
    'checkPointPosition'
], function (provide, getPolyLabelCenter, nodeSize, isInside) {
    /**
    * @param {Array} coords - Массив координат полигона.
    * @returns {Object}
    */
    var container = document.createElement('div');
    container.style.display = 'inline-block';
    var text = document.createElement('h6');
    text.innerText = '';
    container.appendChild(text);
    document.body.appendChild(container);

    function getData(coords, zoom) {
        if (!coords instanceof Array) {
            throw new Error('Wrong params');
        }
        var data = getPolyLabelCenter(coords, 1.0);
        isInclude(data.center, coords[data.index], zoom);

        return {
            center: data.center,
            isInclude: isInclude(data.center, coords[data.index], zoom)
        };
    }

    function isInclude(center, coords, zoom) {
        var centerProj = ymaps.projection.sphericalMercator.toGlobalPixels(center, zoom);
        var labelW = text.clientWidth;
        var labelH = text.clientHeight;
        var elemPoints = [];
        elemPoints.push([centerProj[0] - labelW / 2, centerProj[1] - labelH / 2]);
        elemPoints.push([centerProj[0] - labelW / 2, centerProj[1] + labelH / 2]);
        elemPoints.push([centerProj[0] + labelW / 2, centerProj[1] - labelH / 2]);
        elemPoints.push([centerProj[0] + labelW / 2, centerProj[1] + labelH / 2]);

        for (var i = 0; i < elemPoints.length; i++) {
            var point = ymaps.projection.sphericalMercator.fromGlobalPixels(elemPoints[i], zoom);
            if (isInside(point, coords) !== 'INSIDE') {
                return false;
            }
        }
        return true;
    }


    provide(getData);
});
