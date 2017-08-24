/**
 * @param {*} layout
 * @param {*} className - класс по которому находим элемент
 * @param {*} newClassName - новый класс
 */
function add(layout, className, newClassName) {
    const el = getElemByClass(layout, className);
    if (!el) return;

    el.classList.add(newClassName);
}

/**
 * @param {*} layout
 * @param {*} className - класс по которому находим элемент
 * @param {*} removeClassName - удаляемый класс
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
