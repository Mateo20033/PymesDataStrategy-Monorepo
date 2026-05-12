/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_AGENT_URL = process.env.DASHBOARD_AGENT_URL || "http://pymes-dashboard-agent:8000";

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

async function proxyRequest(req: NextRequest, path: string) {
  try {
    const url = new URL(req.url);
    const targetUrl = `${DASHBOARD_AGENT_URL}/${path}${url.search}`;

    const headers = new Headers();
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
    console.error("Agent Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Error communicating with AI agent service" },
      { status: 500 }
    );
  }
}
