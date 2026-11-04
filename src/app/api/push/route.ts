import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { dispatchPush } from "@/lib/server/push-dispatch";
import { createFirestorePushDeps } from "@/lib/server/push-firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const error = (status: number, message: string) =>
    NextResponse.json({ ok: false, message }, { status });

export async function POST(request: NextRequest) {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return error(401, "Sesi login tidak valid. Silahkan login ulang.");

    const body = await request.json().catch(() => null);
    const notificationId =
        typeof body?.notificationId === "string" ? body.notificationId.trim() : "";
    if (!notificationId || notificationId.includes("/")) {
        return error(400, "notificationId tidak valid.");
    }

    let result;
    try {
        result = await dispatchPush(
            notificationId,
            session,
            createFirestorePushDeps(process.env.EXPO_ACCESS_TOKEN)
        );
    } catch (err) {
        console.error("[push]", notificationId, err);
        return error(500, "Server gagal membaca data notifikasi. Coba kirim ulang.");
    }

    const push = result.body.push;
    console.info(
        `[push] ${notificationId} oleh ${session.email}: ${result.httpStatus}`,
        push ? `${push.status} (terkirim ${push.sent}, gagal ${push.failed}, token dibuang ${push.removed})` : result.body.message
    );
    return NextResponse.json(result.body, { status: result.httpStatus });
}