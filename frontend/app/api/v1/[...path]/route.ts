import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_URL = (process.env.INTERNAL_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function proxyRequest(req: NextRequest, path: string[]) {
  try {
    const url = new URL(req.url);
    const targetUrl = `${API_URL}/api/v1/${path.join("/")}${url.search}`;

    const headers = new Headers();
    const contentType = req.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);

    // Forward auth token if present
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.accessToken) {
      headers.set("Authorization", `Bearer ${token.accessToken}`);
    }

    // Also forward existing Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !token?.accessToken) {
      headers.set("Authorization", authHeader);
    }

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
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(req, path);
}
