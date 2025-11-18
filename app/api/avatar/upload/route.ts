import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "filename query param is required" },
      { status: 400 },
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { error: "request body is empty" },
      { status: 400 },
    );
  }

  const blob = await put(`avatars/${filename}`, request.body, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json(blob);
}
