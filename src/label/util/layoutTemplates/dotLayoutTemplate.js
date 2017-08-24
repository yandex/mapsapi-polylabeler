import templateLayoutFactory from 'api/templateLayoutFactory';

const template = templateLayoutFactory.createClass(
    `<div class="ymaps-polylabel-view" {% style %}position: {{options.labelPosition}};
        top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>
            {% include options.labelDotTemplateLayout %}
    </div>`
);

export default template;
