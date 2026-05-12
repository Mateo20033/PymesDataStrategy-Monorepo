/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_BACKEND_URL = process.env.DASHBOARD_API_URL || "http://pymes-dashboard-backend:3001";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "pymes-internal-s2s-secret";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

async function proxyRequest(req: NextRequest, path: string) {
  try {
    const url = new URL(req.url);
    const targetUrl = `${DASHBOARD_BACKEND_URL}/api/${path}${url.search}`;

    const headers = new Headers();
    headers.set("x-api-key", INTERNAL_API_KEY);
    headers.set("Content-Type", req.headers.get("Content-Type") || "application/json");

    let body = undefined;
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
  } catch (error: any) {
    console.error("Dashboard Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Error communicating with dashboard service" },
      { status: 500 }
    );
  }
}
