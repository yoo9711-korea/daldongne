import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const memory = await prisma.memory.findUnique({
    where: { id },
  });

  if (!memory) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (!memory.fileUrl) {
  return Response.json(
    { success: false, message: "파일이 없습니다." },
    { status: 404 }
  );
}

  const pathname = new URL(memory.fileUrl).pathname.slice(1);

  const result = await get(pathname, {
    access: "private",
  });

  if (!result || result.statusCode !== 200) {
    return new NextResponse("Blob Not Found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, no-cache",
    },
  });
}