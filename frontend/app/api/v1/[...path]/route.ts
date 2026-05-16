import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.INTERNAL_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function proxyRequest(req: NextRequest, path: string[]) {
  try {
    const url = new URL(req.url);
    const targetUrl = `${API_URL}/api/v1/${path.join("/")}${url.search}`;

    const headers = new Headers();
    const contentType = req.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);

    const auth = req.headers.get("Authorization");
    if (auth) headers.set("Authorization", auth);

    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.text();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[v1 proxy] Error:", error);
    return NextResponse.json(
      { success: false, message: "Error communicating with API service" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path);
}
