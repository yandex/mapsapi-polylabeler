export default function (layout) {
    let el = layout && layout.getElement();
    if (!el) return;

    el = el.getElementsByClassName('ymaps-polylabel-view')[0];
    if (!el) return;

    const {width, height} = el.getBoundingClientRect();
    return {width, height};
}
