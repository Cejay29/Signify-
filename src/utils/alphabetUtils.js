// utils/alphabetUtils.js
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function getSignImage(sign) {
    if (!sign) return "/img/signs/placeholder.png";
    return `/img/signs/${String(sign).toLowerCase()}.png`;
}

export function getAllSigns() {
    return [...ALPHABET, ...NUMBERS];
}
