import labelLayoutTemplate from './labelLayoutTemplate';
import dotLayoutTemplate from './dotLayoutTemplate';

/**
 * Возвращает базовые обертки над шаблонами
 */
export default function () {
    return {
        label: labelLayoutTemplate,
        dot: dotLayoutTemplate
    };
}
