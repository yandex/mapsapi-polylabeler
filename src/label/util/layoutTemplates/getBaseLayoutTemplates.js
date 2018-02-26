import labelLayoutTemplate from './labelLayoutTemplate';
import dotLayoutTemplate from './dotLayoutTemplate';

/**
 * Returns basic wrappers over templates
 */
export default function () {
    return {
        label: labelLayoutTemplate,
        dot: dotLayoutTemplate
    };
}
