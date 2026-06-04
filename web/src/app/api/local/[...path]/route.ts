import { NextRequest } from "next/server";

const LOCAL_MANAGER_URL = "http://127.0.0.1:15800/api/local";

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const subPath = path.join("/");
  const search = request.nextUrl.search;
  const url = `${LOCAL_MANAGER_URL}/${subPath}${search}`;

  try {
    const body = request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined;

    const res = await fetch(url, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: body ? body : undefined,
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "本地管理器未运行", detail: "请在终端启动: cd local-manager && python server/main.py" },
      { status: 503 }
    );
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
