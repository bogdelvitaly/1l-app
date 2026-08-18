import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { drawMaskedGroup, drawVectorArtwork, extractMaskedGroups, getViewBox } from "@/lib/svgPaths";

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");
const ART_DIR = path.join(process.cwd(), "src/assets/certificate");

// Design canvas matches the Figma template (node 27:5565, "Сертификат)шаблон"),
// which is authored at 1300x900px. PDF points are that canvas scaled down by SCALE,
// so every coordinate below can be copied straight from Figma without conversion.
const DESIGN_W = 1300;
const DESIGN_H = 900;
const SCALE = 0.5;

const INK = rgb(0x9e / 255, 0x65 / 255, 0x4b / 255); // #9e654b — title/amount/number
const LAMP_COLOR = rgb(0x9e / 255, 0x65 / 255, 0x4b / 255); // #9e654b — lamp illustration
const LOGO_COLOR = rgb(0xb5 / 255, 0x81 / 255, 0x5e / 255); // #b5815e — corner mark
const TRIM_COLOR = rgb(0xc5 / 255, 0xa3 / 255, 0x93 / 255); // #c5a393 — bottom trim (dots + chevrons)
const WHITE = rgb(1, 1, 1); // the source SVGs punch white shapes under the rings where lines overlap

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/certificates/[id]/pdf">) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;
  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (!certificate) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.addPage([DESIGN_W * SCALE, DESIGN_H * SCALE]);

  const [titleFontBytes, amountFontBytes, lampSvg, logoSvg] = await Promise.all([
    readFile(path.join(FONT_DIR, "AlegreyaSans-Regular.ttf")),
    readFile(path.join(FONT_DIR, "PYRA-Bold.otf")),
    readFile(path.join(ART_DIR, "lamp.svg"), "utf-8"),
    readFile(path.join(ART_DIR, "logo.svg"), "utf-8"),
  ]);
  const titleFont = await pdfDoc.embedFont(titleFontBytes);
  const amountFont = await pdfDoc.embedFont(amountFontBytes);

  // Draws a Figma-exported line-art SVG as real vector paths — not a raster — so
  // it prints crisply at any size, preserving every path's own fill (including
  // the "white" shapes some of these illustrations use to punch through
  // overlapping lines) in original document order. (x, y) is the top-left corner
  // in design space (1300x900, Figma's own coordinates); targetW scales the SVG's
  // own viewBox to fit, preserving aspect ratio.
  const drawVectorArt = (svg: string, colors: Record<string, typeof INK>, x: number, y: number, targetW: number) => {
    const viewBox = getViewBox(svg);
    const scale = (targetW / viewBox.width) * SCALE;
    drawVectorArtwork(page, svg, colors, x * SCALE, (DESIGN_H - y) * SCALE, scale);
  };

  // Lamp illustration, centered horizontally. The source SVG's own body outline
  // extends above y=0 (bleeding off the top edge) — the page boundary clips it.
  const LAMP_W = getViewBox(lampSvg).width;
  drawVectorArt(lampSvg, { white: WHITE, "#9e654b": LAMP_COLOR }, (DESIGN_W - LAMP_W) / 2, 0, LAMP_W);

  // Corner mark, top-left. The sunburst rays are clipped to the diamond via an SVG
  // <mask> — reproduced here as a real PDF clip path so the full artwork (rays
  // included) renders instead of just the un-masked outline paths.
  const LOGO_W = getViewBox(logoSvg).width;
  const { masked: logoMasked, remainder: logoRemainder } = extractMaskedGroups(logoSvg);
  for (const group of logoMasked) {
    drawMaskedGroup(page, group, { "#b5815e": LOGO_COLOR }, 52 * SCALE, (DESIGN_H - 40) * SCALE, SCALE);
  }
  drawVectorArt(logoRemainder, { "#b5815e": LOGO_COLOR }, 52, 40, LOGO_W);

  // Bottom trim: the Figma frame tiles a 92px unit (one chevron + one dot) across
  // the card width. Reproduced here as real vector primitives (two lines + a
  // stroked circle) at the same 92px period, instead of stretching a raster strip.
  const TRIM_PERIOD = 92;
  const TRIM_TOP = 842; // design-space y where the 57px-tall trim band starts
  for (let i = -1; i * TRIM_PERIOD < DESIGN_W + TRIM_PERIOD; i++) {
    const unitX = i * TRIM_PERIOD - 14;
    page.drawLine({
      start: { x: (unitX + 0.71) * SCALE, y: (DESIGN_H - (TRIM_TOP + 10 + 0.71)) * SCALE },
      end: { x: (unitX + 47.71) * SCALE, y: (DESIGN_H - (TRIM_TOP + 10 + 47.71)) * SCALE },
      thickness: 2 * SCALE,
      color: TRIM_COLOR,
    });
    page.drawLine({
      start: { x: (unitX + 92.71) * SCALE, y: (DESIGN_H - (TRIM_TOP + 10 + 2.12)) * SCALE },
      end: { x: (unitX + 46.71) * SCALE, y: (DESIGN_H - (TRIM_TOP + 10 + 48.12)) * SCALE },
      thickness: 2 * SCALE,
      color: TRIM_COLOR,
    });
    const dotX = i * TRIM_PERIOD + 73;
    page.drawCircle({
      x: (dotX + 6.5) * SCALE,
      y: (DESIGN_H - (TRIM_TOP + 40 + 6.5)) * SCALE,
      size: 5.5 * SCALE,
      borderColor: TRIM_COLOR,
      borderWidth: 2 * SCALE,
    });
  }

  const drawCentered = (text: string, baselineY: number, font: PDFFont, size: number, tracking = 0) => {
    const tracked = tracking * (text.length - 1);
    const w = font.widthOfTextAtSize(text, size) + tracked;
    let x = (DESIGN_W - w) / 2;
    for (const ch of text) {
      page.drawText(ch, { x: x * SCALE, y: (DESIGN_H - baselineY) * SCALE, font, size: size * SCALE, color: INK });
      x += font.widthOfTextAtSize(ch, size) + tracking;
    }
  };

  drawCentered("Подарочный сертификат на приобретение Ліхтарыка", 512, titleFont, 26, 1.04);

  const amountText = `${Math.round(certificate.amount)} рублей`;
  drawCentered(amountText.toUpperCase(), 700, amountFont, 200, 38);

  const numberText = certificate.number;
  const numberSize = 20;
  const numberW = titleFont.widthOfTextAtSize(numberText, numberSize) + 0.8 * (numberText.length - 1);
  page.drawText(numberText, {
    x: (1226 - numberW) * SCALE,
    y: (DESIGN_H - 90) * SCALE,
    font: titleFont,
    size: numberSize * SCALE,
    color: INK,
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${certificate.number}.pdf"`,
    },
  });
}
