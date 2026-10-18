import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "token";

const SESSION_DURATION = "30d";

export type SessionPayload = {
    uid: string;
    email: string;
    name: string;
    role: string;
    location: string;
};

const getSecret = () => {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET;
    return secret ? new TextEncoder().encode(secret) : null;
};

export async function createSessionToken(
    payload: SessionPayload
): Promise<string | null> {
    const secret = getSecret();
    if (!secret) return null;

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(SESSION_DURATION)
        .sign(secret);
}

export async function verifySessionToken(
    token: string | null | undefined
): Promise<(SessionPayload & { exp?: number }) | null> {
    const secret = getSecret();
    if (!token || !secret) return null;

    try {
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
        });
        if (typeof payload.email !== "string" || typeof payload.role !== "string") {
            return null;
        }
        return {
            uid: String(payload.uid ?? ""),
            email: payload.email,
            name: String(payload.name ?? ""),
            role: payload.role,
            location: String(payload.location ?? ""),
            exp: payload.exp,
        };
    } catch {
        return null;
    }
}