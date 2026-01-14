import { NextRequest, NextResponse } from "next/server";

// Use the same in-memory store as route.ts (in real app, use DB)
let requests: Array<{
  id: number;
  title: string;
  description: string;
  votes: number;
  voters: string[];
}> = [];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  // For demo, no user auth, so anyone can vote once per session
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) {
    return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
  }
  // For demo, just increment votes
  if (!requests[idx].voters.includes("demo-user")) {
    requests[idx].votes++;
    requests[idx].voters.push("demo-user");
  }
  return NextResponse.json({ success: true, votes: requests[idx].votes });
}
