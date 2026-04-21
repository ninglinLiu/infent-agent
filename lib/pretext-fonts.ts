/** Canvas / Pretext font strings must match loaded Next fonts (avoid generic system-ui). */
export function displayFont(fontSize: number, weight = 800) {
  return `${weight} ${fontSize}px Syne, sans-serif`
}

export function bodyFont(fontSize: number, weight = 400) {
  return `${weight} ${fontSize}px "DM Sans", sans-serif`
}
