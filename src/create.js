import PCollection from './polylabel/PolylabelCollection';
import PObjectManager from './polylabel/PolylabelObjectManager';
import ObjectManager from 'api/ObjectManager';

export default function (map, data) {
    initStyles();
    return data instanceof ObjectManager ?
        new PObjectManager(map, data) :
        new PCollection(map, data);
}

function initStyles() {
    const style = document.createElement('style');
    style.innerText = `
        .ymaps-polylabel-dot-default {
            border: 1px solid rgba(255, 255, 255, 0.8);
            height: 4px;
            width: 4px;
            border-radius: 3px;
        }
        .ymaps-polylabel-dot-default_hover {
            border: 1px solid rgba(255, 255, 255, 1);
        }
        .ymaps-polylabel-label-default {
            font-family: Arial, Helvetica, sans-serif;
            text-align: center;
        }
        .ymaps-polylabel-dark-label {
            color: #06264f;
            -webkit-font-smoothing: subpixel-antialiased;
            text-shadow:
            0 -1px 0 rgba( 255, 255, 255, 0.4 ),
            0 -1px 0 rgba( 255, 255, 255, 0.4 ),
            0 1px 0 rgba( 255, 255, 255, 0.4 ),
            0 1px 0 rgba( 255, 255, 255, 0.4 ),
            -1px 0 0 rgba( 255, 255, 255, 0.4 ),
            1px 0 0 rgba( 255, 255, 255, 0.4 ),
            -1px 0 0 rgba( 255, 255, 255, 0.4 ),
            1px 0 0 rgba( 255, 255, 255, 0.4 ),
            -1px -1px 0 rgba( 255, 255, 255, 0.4 ),
            1px -1px 0 rgba( 255, 255, 255, 0.4 ),
            -1px 1px 0 rgba( 255, 255, 255, 0.4 ),
            1px 1px 0 rgba( 255, 255, 255, 0.4 ),
            -1px -1px 0 rgba( 255, 255, 255, 0.4 ),
            1px -1px 0 rgba( 255, 255, 255, 0.4 ),
            -1px 1px 0 rgba( 255, 255, 255, 0.4 ),
            1px 1px 0 rgba( 255, 255, 255, 0.4 );
            opacity: 0.9;
        }
        .ymaps-polylabel-light-label {
            color: rgba(255, 255, 255, 1);
            text-shadow: 0 0 2px rgba(0, 0, 0, 1), 0 0 2px rgba(0, 0, 0, 1);
        }
    `;
    document.head.appendChild(style);
}
