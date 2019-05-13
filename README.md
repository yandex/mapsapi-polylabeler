Yandex.Maps API Polylabeler Plugin
===================

This module allows to set labels inside polygons on the map choosing the suitable position automatically.
It is created for [Yandex.Maps JS API v2.1](https://tech.yandex.ru/maps/doc/jsapi/2.1/quick-start/tasks/quick-start-docpage/) and based on [Polylabel module](https://github.com/mapbox/polylabel)

[Demo1](https://yandex.github.io/mapsapi-polylabeler/docs/example-text/)
[Demo2](https://yandex.github.io/mapsapi-polylabeler/docs/example-img/)

![example img](https://cdn.rawgit.com/yandex/mapsapi-polylabeler/6e240004/docs/res/example1.png)

Loading
============

1. Load [Yandex.Maps JS API 2.1](https://tech.yandex.ru/maps/doc/jsapi/2.1/quick-start/tasks/quick-start-docpage/), Polylabeler Plugin and ([Area calculation plugin](https://github.com/yandex/mapsapi-area)) (It is used by the present module) by adding the following code into the **head** section of your page.

```html
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU" type="text/javascript"></script>
<!-- Change my.cdn.tld to your CDN host name -->
<script src="https://yastatic.net/s3/mapsapi-jslibs/area/0.0.1/util.calculateArea.min.js" type="text/javascript"></script>
<script src="https://yastatic.net/s3/mapsapi-jslibs/polylabeler/1.0.1/polylabel.min.js" type="text/javascript"></script>
```

Simple example
============
#### Example shows, how to create label for one polygon.

```js
ymaps.ready(['polylabel.create']).then(function () {
    const map = new ymaps.Map('map', {
        center: [65, 81],
        zoom: 5
    });
    const objectManager = new ymaps.ObjectManager();

    objectManager.add({
	type: 'Feature',
        id: 1,
        geometry: {
            type: 'Polygon',
            coordinates: [[
    	        [66 , 74],
                [68, 92],
                [59, 88],
                [62, 80],
                [66, 74]
            ]]
	},
        properties: {
  	    name: 'nameOfMyPolygon'
        },
        options: {
            labelDefaults: 'light',
            labelLayout: '{{properties.name}}'
        }
    });
    map.geoObjects.add(objectManager);
    const polylabel = new ymaps.polylabel.create(map, objectManager);
});
```

Launch
============
It is possible to work with two API entities:
* [GeoObjectCollection](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObjectCollection-docpage/)
* [ObjectManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ObjectManager-docpage/)

Get access to the module functions by using [ymaps.modules.require](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/modules.require-docpage/) method:
```js
ymaps.modules.require(['polylabel.create']).then(function (Polylabel) {
    /**
    * @param {Map} map - map instance
    * @param {GeoObjectCollection | ObjectManager} component -
    * instance of a collection or an object manager that contains polygons to be labeled
    */
    const polyLabeler = new Polylabel(map, component);
});
```


Documentation
============
The module works according to the following principle:
Two labels are created for the polygon: a small (**dot**) and a main (**label**).
If the main label can't fit into the polygon, the module tries to place a small one;
If both does not fit, nothing is displayed.

## Methods
| Name | Returns | Description |
|------|---------|-------------|
| [getLabelState(polygon)](#getlabelstate) | [DataManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/data.Manager-docpage/) | label state |

### getLabelState
| Parameter | Type | Default value | Description |
|-----------|------|---------------|-------------|
| polygon | [GeoObject](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObject-docpage/) | - |  Object, describing a polygon. Use GeoObject for the [GeoObjectCollection](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObjectCollection-docpage/) |
| | JSON | - | Use JSON for the [ObjectManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ObjectManager-docpage/) |


```js
const polyLabeler = new Polylabel(map, objectManager);
let state = polyLabeler.getLabelState(polygon);
```

## State

### write/read
| Name | Type | Default value | Value | Description |
|------|------|---------------|-------|-------------|
| visible | string\|undefined | undefined | dot | Show small label |
| | | | label | Show main label |
| | | | none | Hide all labels |
| | | | undefined | Automatic calculation |

With map zoom change the state resets to default.

```js
const polyLabeler = new Polylabel(map, objectManager);
let state = polyLabeler.getLabelState(polygon);
state.set('visible', 'dot');
```

### only read
| Name | Type | Description |
|------|------|-------------|
| center | Array[2]<Number> | Current center of label |
| currentVisibility | string | Label current visibility |
| currentConfiguredVisibility | string | Label visiblity, which configured by module |

```js
const polyLabeler = new Polylabel(map, objectManager);
let state = polyLabeler.getLabelState(polygon);
state.get('center');
```


## Events
Labels events can be accessed through polygons.
List of events can be found in
[GeoObject](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObject-docpage/#events-summary).
For events handling add listener for the desired event with the prefix **"label"** to
[EventManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/event.Manager-docpage/) of [GeoObjectCollection](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObjectCollection-docpage/) or [ObjectManager](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ObjectManager-docpage/).

```js
// In this example, we listen to pointing the cursor at the label and
// moving the cursor off the label
geoObjectCollection.events.add(['labelmouseenter', 'labelmouseleave'], event => {
    // Get the polygon on which the event occured
    var polygon = event.get('target');
    // Get label state
    var state = polyLabeler.getLabelState(polygon);
    // Change the visibility of the label depending on the type of event
    state.set('visible', event.get('type') === 'labelmouseleave' ? undefined : 'label');
});
```


## Polygon options
### The label is controlled via the polygon options
**\* Mandatory option**

| Name | Type | Default value |
|------|------|---------------|
| [labelLayout](#labellayout) *           | string                                                  |     -                  |
| [labelDotLayout](#labeldotlayout)      | string                                                  |   default dot layout   |
| [labelDotVisible](#labeldotvisible)    | boolean                                                 |   true                 |
| [labelDefaults](#labeldefaults)        | string                                                  |     -                  |
| [labelCursor](#labelcursor)            | string                                                  |   'grab'               |
| [labelDotCursor](#labeldotcursor)      | string                                                  |   'grab'               |
| [labelClassName](#labelclassname)      | ZoomRange < string > \|\| string                        |     -                  |
| [labelForceVisible](#labelforcevisible)| ZoomRange < string > \|\| string                        |     -                  |
| [labelTextColor](#labeltextcolor)      | ZoomRange < string > \|\| string                        |     -                  |
| [labelTextSize](#labeltextsize)        | ZoomRange < number > \|\| number                        |     -                  |
| [labelCenterCoords](#labelcentercoords)| ZoomRange < Array[2]< number >> \|\| Array[2]< number > |     -                  |
| [labelOffset](#labeloffset)            | ZoomRange < Array[2]< number >> \|\| Array[2]< number > |  \[0, 0\]              |
| [labelPermissibleInaccuracyOfVisibility](#labelpermissibleinaccuracyofvisibility) | ZoomRange < number > \|\| number | 0  |

Type **ZoomRange< T >**  object allows to set zoom level or zoom range to specify values for the certain scales.
**T** - type of value.</br>
```js
// In this example we specify 'someOptions' value for different zoom levels
// for the 1-st zoom it will be set to 12,
// from 2-nd to 5-th the value is 14, from 6-th to 22-nd it is 16 and on the 23-rd it is 18
someOptions: {
    1: 12,
    '2_5': 14,
    '6_22': 16,
    23: 18
}
// or you can specify same value for all zoom levels
someOptions: 12
// if you skip some zoom levels, they will have a value calculated automatically or they will be simply ignored
someOptions: {
    1: 12,
    '2_3': 13
}
```

### labelLayout
Template that describes the layout of a main label.
[Based on Template](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Template-docpage/)
```js
polygon.options.set({
	labelLayout: '<div class="foo">bar</div>'
});
```

### labelDotLayout
Template that describes the layout of a small label (dot).

**Default behavior:**
    If you do not specify this option, the default dot will be drawn.

```js
polygon.options.set({
        labelDotLayout: `<div style="background: red;
            width: 10px; height: 10px; border-radius: 5px;"></div>`
});
```

### labelDotVisible
Responsible for small labels displaying.
- ***true*** - show
- ***false*** - don't show

**Default behavior:**
    Small labels are displayed.

### labelDefaults
Responsible for the labels default layout

***Values:***
- ***dark*** - dark theme
- ***light*** - light theme

### labelCursor
Cursor type to be displayed when hovering over the main label.
[Possible Values](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/util.cursor.Manager-docpage/#push-param-key)

### labelDotCursor
Cursor type to be displayed when hovering over the small label.
[Possible Values](https://tech.yandex.ru/maps/doc/jsapi/2.1/ref/reference/util.cursor.Manager-docpage/#push-param-key)

### labelClassName
CSS-class name to be applied to the label.
**Important:** if you use *labelDefaults* option, *labelClassName* doesn't work.

```js
// Apply "foo-class" to the label on the first zoom level,
// for others apply 'bar-class"

polygon.options.set({
        labelClassName: {
            1: 'foo-class',
            '2_23': 'bar-class'
        }
});
```

### labelForceVisible
Label type to be displayed.
- ***label*** - show main label
- ***dot*** - show small label
- ***none*** - don't display anything

```js
// On the first two zoom levels, the main label will be always shown.
// On the others - small label will be always shown.

polygon.options.set({
        labelForceVisible: {
            '0_1': 'label',
            '2_23': 'dot'
        }
});
```

**Default behavior:**
    Automatic calculation.

### labelTextColor
Label font color.

```js
//Set '#FCEA00' as labels font color for all zoom levels
polygon.options.set({
        labelTextColor: '#FCEA00'
});
```

### labelTextSize
Label font size.

```js
// On the first five zoom levels, labels font size is '22'.
// On the others - '11'.
polygon.options.set({
        labelTextSize: {
            '0_4': 22,
            '5_23': 11
        }
});
```

### labelCenterCoords
Geographic coordinates where the label will be displayed.

```js
// On the first zoom level coords - [37.0192, 61.01210]
// On the next two - [38.123, 62.9182]
// On the others - Automatic calculation
polygon.options.set({
        labelCenterCoords: {
            0: [37.0192, 61.01210],
            '2_3': [38.123, 62.9182]
        }
});
```

**Default behavior:**
    Automatic calculation.

### labelOffset
Offset in pixels from the current position of the label.
- zero element - left offset.
- first element - top offset.

```js
//Set labels offset to the left as 10px and down as 20px
polygon.options.set({
        labelOffset: [-10, 20]
});
```

**Default behavior:**
    labelOffset: \[0, 0]

### labelPermissibleInaccuracyOfVisibility
The value in pixels describing max area outside of the polygon that could be occupied by the label.

```js
// Allow labels to step out of the polygon for 2px at all zoom levels
polygon.options.set({
        labelPermissibleInaccuracyOfVisibility: 2
});
```

**Default behavior:**
    labelPermissibleInaccuracyOfVisibility: 0


## Used libraries
[https://github.com/mapbox/polylabel](https://github.com/mapbox/polylabel)

## Third party components

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of OpenLayers Contributors.
