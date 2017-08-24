export default function (hex, opacity) {
    if (!hex) return;
    if (hex.indexOf('rgb') !== -1) return hex;
    hex = hex[0] !== '#' ? `#${hex}` : hex;
    hex = hex.slice(0, 7);
    let c;
    if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return;

    c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')}, ${opacity || 1})`;
}
