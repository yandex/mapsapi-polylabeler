import transformHexToRGB from '../transformHexToRGB';
import CONFIG from '../../config';

export default function (data, dateString) {
    return transformHexToRGB(dateString || CONFIG.DEFAULT_POLYGON_FILL_COLOR, 0.9);
}
