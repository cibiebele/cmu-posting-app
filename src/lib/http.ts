import { NextResponse } from "next/server";
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}
