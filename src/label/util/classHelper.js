/**
 * @param {*} layout
 * @param {*} className - class by which we find the element
 * @param {*} newClassName - new class
 */
function add(layout, className, newClassName) {
    const el = getElemByClass(layout, className);
    if (!el) return;

    el.classList.add(newClassName);
}

/**
 * @param {*} layout
 * @param {*} className - class by which we find the element
 * @param {*} removeClassName - class to remove
 */
function remove(layout, className, removeClassName) {
    const el = getElemByClass(layout, className);
    if (!el) return;

    el.classList.remove(removeClassName);
}

function getElemByClass(layout, className) {
    if (!layout) return;
    let el = layout.getElement();
    if (!el) return;

    return el.getElementsByClassName(className)[0];
}

export default {
    add,
    remove
};
