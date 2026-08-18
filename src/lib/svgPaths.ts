// Minimal extractor for the flat, single-fill-color SVGs Figma/Illustrator export
// for line-art illustrations (see src/assets/certificate). Good enough for that
// narrow shape — not a general SVG parser.

import {
  PDFOperator,
  PDFPage,
  clip,
  drawSvgPath,
  endPath,
  fill,
  popGraphicsState,
  pushGraphicsState,
  rotateRadians,
  scale as scaleOp,
  setFillingColor,
  translate,
  type Color,
} from "pdf-lib";
// Not part of pdf-lib's public entry point, but it's a plain exported function in
// the package's own compiled output — see PDFPage.drawSvgPath's implementation,
// which calls this same helper internally to turn an SVG path string into PDF
// path-construction operators (moveTo/lineTo/curve). Reused here so masked groups
// can share one clip + transform instead of drawSvgPath's own self-contained
// push/pop-per-path wrapper. Imported as a real static import (not require()) so
// the bundler resolves it through the same module graph as the `pdf-lib` import
// above — a runtime require() of the package's internals produced a second,
// distinct copy of the PDFOperator class, which failed pdf-lib's own internal
// `instanceof PDFOperator` checks.
import { svgPathToOperators as svgPathToOperatorsEs } from "pdf-lib/es/api/svgPath.js";
// The es/ and cjs/ builds declare structurally-identical but nominally distinct
// PDFOperator types (TS treats classes with private members from different
// declaration files as unrelated) — the runtime objects are the real, matching
// PDFOperator class as long as this stays a static import (see note above).
const svgPathToOperators = svgPathToOperatorsEs as unknown as (path: string) => PDFOperator[];

// pdf-lib's PDFPage.drawSvgPath always fills with the nonzero-winding rule, but
// Figma exports these "stroke as fill" ring shapes (outer boundary + inset inner
// boundary in one path) wound for the even-odd rule — nonzero fill renders them
// as solid blobs instead of hollow outlines. Same operator sequence, swapping the
// fill operator for its even-odd sibling (f*) right before the final graphics-state pop.
export function drawEvenOddSvgPath(
  page: PDFPage,
  path: string,
  options: { x: number; y: number; scale: number; color: Color },
) {
  const ops = drawSvgPath(path, {
    x: options.x,
    y: options.y,
    scale: options.scale,
    color: options.color,
    borderColor: undefined,
    borderWidth: 0,
  });
  ops[ops.length - 2] = PDFOperator.of("f*" as Parameters<typeof PDFOperator.of>[0]);
  page.pushOperators(...ops);
}

export function extractPathsByFill(svg: string, fillHex: string): string[] {
  const paths: string[] = [];
  const re = /<path\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg))) {
    const attrs = match[1];
    const fillMatch = /fill="([^"]*)"/i.exec(attrs);
    if (!fillMatch || fillMatch[1].toLowerCase() !== fillHex.toLowerCase()) continue;
    const dMatch = /\bd="([^"]*)"/i.exec(attrs);
    if (dMatch) paths.push(dMatch[1]);
  }
  return paths;
}

// Every <path> in document order, each with its own fill color. Some Figma
// illustrations (see lamp.svg) draw a solid "white" shape before the colored
// ring on top of it — the white one isn't decorative, it's how overlapping
// shapes punch through each other. Dropping it changes what the ring paths
// appear to overlap, so callers should draw every path in this order, not
// filter down to one color.
export function extractAllPaths(svg: string): { d: string; fill: string }[] {
  const paths: { d: string; fill: string }[] = [];
  const re = /<path\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg))) {
    const attrs = match[1];
    const d = /\bd="([^"]*)"/i.exec(attrs)?.[1];
    const fillHex = /\bfill="([^"]*)"/i.exec(attrs)?.[1];
    if (d && fillHex) paths.push({ d, fill: fillHex });
  }
  return paths;
}

// Draws every path in an SVG (in document order, so "white" punch-through
// shapes correctly sit under the colored paths after them) as real vector
// paths. (x, y, scale) are already in PDF space — same convention as
// drawEvenOddSvgPath — so the caller does its own design-space-to-PDF
// (and any Y-flip) conversion before calling this, same as everywhere else.
export function drawVectorArtwork(
  page: PDFPage,
  svg: string,
  colors: Record<string, Color>,
  x: number,
  y: number,
  scale: number,
) {
  for (const p of extractAllPaths(svg)) {
    const color = colors[p.fill.toLowerCase()];
    if (!color) continue;
    drawEvenOddSvgPath(page, p.d, { x, y, scale, color });
  }
}

export function getViewBox(svg: string): { width: number; height: number } {
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/i.exec(svg);
  if (!match) throw new Error("SVG missing viewBox");
  return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
}

export interface MaskedGroup {
  clipPathD: string;
  paths: { d: string; fill: string }[];
}

// Pulls out <mask>-clipped <g> groups (Figma's way of exporting "this pattern only
// shows inside this shape") along with the plain SVG they were cut from. The
// masked groups get rendered separately via drawMaskedGroup; extractPathsByFill on
// the remainder won't re-encounter their paths even when they share a fill color
// with un-masked siblings.
export function extractMaskedGroups(svg: string): { masked: MaskedGroup[]; remainder: string } {
  const maskPaths = new Map<string, string>();
  const maskRe = /<mask\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/mask>/gi;
  let maskMatch: RegExpExecArray | null;
  while ((maskMatch = maskRe.exec(svg))) {
    const d = /<path[^>]*\bd="([^"]*)"/i.exec(maskMatch[2])?.[1];
    if (d) maskPaths.set(maskMatch[1], d);
  }

  const masked: MaskedGroup[] = [];
  let remainder = svg.replace(
    /<g\s+mask="url\(#([^)]+)\)"[^>]*>([\s\S]*?)<\/g>/gi,
    (whole, maskId: string, inner: string) => {
      const clipPathD = maskPaths.get(maskId);
      if (!clipPathD) return whole;
      const paths: MaskedGroup["paths"] = [];
      const pathRe = /<path\b([^>]*)\/?>/gi;
      let pathMatch: RegExpExecArray | null;
      while ((pathMatch = pathRe.exec(inner))) {
        const d = /\bd="([^"]*)"/i.exec(pathMatch[1])?.[1];
        const fillHex = /\bfill="([^"]*)"/i.exec(pathMatch[1])?.[1];
        if (d && fillHex) paths.push({ d, fill: fillHex });
      }
      masked.push({ clipPathD, paths });
      return "";
    },
  );
  remainder = remainder.replace(/<mask\b[\s\S]*?<\/mask>/gi, "");

  return { masked, remainder };
}

export function drawMaskedGroup(
  page: PDFPage,
  group: MaskedGroup,
  colors: Record<string, Color>,
  x: number,
  y: number,
  scale: number,
) {
  const ops: PDFOperator[] = [
    pushGraphicsState(),
    translate(x, y),
    rotateRadians(0),
    scaleOp(scale, -scale),
    ...svgPathToOperators(group.clipPathD),
    clip(),
    endPath(),
  ];
  for (const p of group.paths) {
    const color = colors[p.fill.toLowerCase()];
    if (!color) continue;
    ops.push(setFillingColor(color), ...svgPathToOperators(p.d), fill());
  }
  ops.push(popGraphicsState());
  page.pushOperators(...ops);
}
