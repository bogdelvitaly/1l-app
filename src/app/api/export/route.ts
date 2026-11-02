import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildExportWorkbook } from "@/lib/exportWorkbook";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const workbook = await buildExportWorkbook();
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `1L-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
