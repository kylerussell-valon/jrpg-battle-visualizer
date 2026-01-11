declare module 'gifenc' {
  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: number[][];
        delay?: number;
        dispose?: number;
        transparent?: boolean;
        transparentIndex?: number;
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    buffer: ArrayBuffer;
    stream: ReadableStream;
  }

  function GIFEncoder(opts?: { auto?: boolean }): GIFEncoderInstance;

  function quantize(rgba: Uint8Array, maxColors: number, options?: object): number[][];

  function applyPalette(rgba: Uint8Array, palette: number[][]): Uint8Array;

  function nearestColorIndex(palette: number[][], color: number[]): number;

  function nearestColorIndexWithDistance(
    palette: number[][],
    color: number[]
  ): [number, number];

  function snapColorsToPalette(palette: number[][], colors: number[][], threshold?: number): void;

  function prequantize(rgba: Uint8Array, options?: { roundRGB?: number; roundAlpha?: number }): void;

  const _default: {
    GIFEncoder: typeof GIFEncoder;
    quantize: typeof quantize;
    applyPalette: typeof applyPalette;
    nearestColorIndex: typeof nearestColorIndex;
    nearestColorIndexWithDistance: typeof nearestColorIndexWithDistance;
    snapColorsToPalette: typeof snapColorsToPalette;
    prequantize: typeof prequantize;
  };

  export default _default;
  export { GIFEncoder, quantize, applyPalette, nearestColorIndex, nearestColorIndexWithDistance, snapColorsToPalette, prequantize };
}
