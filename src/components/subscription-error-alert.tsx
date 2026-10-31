import { SubscriptionError } from "@/lib/firestore-errors";

export default function SubscriptionErrorAlert({ error }: { error: SubscriptionError }) {
    return (
        <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-2"
        >
            <p>{error.message}</p>
            {error.indexUrl && (
                <a 
                    href={error.indexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold underline break-all"
                >
                    Buat index di Firebase Console
                </a>
            )}
        </div>
    );
}