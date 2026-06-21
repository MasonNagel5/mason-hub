import { NextResponse } from "next/server";
import { setTaskDone, deleteTask } from "@/lib/tasks.js";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { done } = await req.json();
  const task = setTaskDone(Number(id), !!done);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  deleteTask(Number(id));
  return NextResponse.json({ ok: true });
}
