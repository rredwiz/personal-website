/**
 * Where the Flask backend lives. Override locally with
 * `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:5000` in `frontend/.env.local`.
 */
const DEFAULT_BACKEND_URL =
    "https://personal-website-backend-7zk8.onrender.com";

export const BACKEND_URL = (
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL
).replace(/\/+$/, "");

/** Build an absolute backend URL from a path such as `/lastfm`. */
export function backendUrl(path: string): string {
    return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
