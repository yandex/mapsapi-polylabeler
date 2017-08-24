import templateLayoutFactory from 'api/templateLayoutFactory';

/**
 * Создает пользовательские шаблоны
 */
export default function (labelLayout, labelDotLayout) {
    const dotDefault = `<div {% style %}
        background-color: {{geoObject.options.fillColor|dot-color}};{% endstyle %}
        class="ymaps-polylabel-dot-default"></div>`;
    return {
        label: {
            iconLabelTemplateLayout: templateLayoutFactory.createClass(labelLayout)
        },
        dot: {
            iconLabelDotTemplateLayout: templateLayoutFactory.createClass(labelDotLayout || dotDefault)
        }
    };
}
