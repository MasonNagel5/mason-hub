import { NextResponse } from "next/server";
import { getDailyTasks, addManualTask } from "@/lib/tasks.js";

export async function GET() {
  const tasks = await getDailyTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req) {
  const { title, due } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const task = addManualTask(title.trim(), due || null);
  return NextResponse.json({ task });
}
