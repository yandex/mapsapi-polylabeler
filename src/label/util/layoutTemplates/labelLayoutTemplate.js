import templateLayoutFactory from 'api/templateLayoutFactory';

const template = templateLayoutFactory.createClass(`
    <div class="ymaps-polylabel-view" {% style %}position: {{options.labelPosition}};
        top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>
        <div class="{{options.labelClassName}}"
            {% style %}font-size: {{options.labelTextSize}}px;
            color: {{options.labelTextColor}}; {% endstyle %}>
                {% include options.labelTemplateLayout %}
        </div>
    </div>`
);

export default template;
