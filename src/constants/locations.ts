export type LocationKey =
    | "mlg"
    | "sby"
    | "sby2"
    | "sby3"
    | "jkt3"
    | "hotel-n-karpet";

export type Location = {
    title: string;
    key: LocationKey;
    collectionName: string;
    city: string;
};

export const LOCATIONS: Location[] = [
    { title: "Malang", key: "mlg", collectionName: "malang", city: "Malang" },
    { title: "Surabaya Pusat", key: "sby", collectionName: "surabaya", city: "Surabaya" },
    { title: "Surabaya Barat", key: "sby2", collectionName: "surabaya-2", city: "Surabaya" },
    { title: "Surabaya Timur", key: "sby3", collectionName: "surabaya-3", city: "Surabaya" },
    { title: "Jakarta Selatan", key: "jkt3", collectionName: "jakarta-3", city: "Jakarta" },
    { title: "Hotel dan Karpet", key: "hotel-n-karpet", collectionName: "hotel-n-karpet", city: "Hotel Karpet" },
];

export const STAFF_CITIES = ["Jakarta", "Surabaya", "Malang", "Hotel Karpet"];

export const findLocation = (key: string | null | undefined) =>
    LOCATIONS.find((location) => location.key === key);

// Staff saved before branches existed only have `location` (a city). When that
// city has exactly one branch, the branch is unambiguous, so infer it.
export function getStaffBranch(staff: {
    branch?: string | null;
    location?: string | null;
}): Location | undefined {
    const branch = findLocation(staff.branch);
    if (branch) return branch;

    const candidates = LOCATIONS.filter((location) => location.city === staff.location);
    return candidates.length === 1 ? candidates[0] : undefined;
}

// `null` means no restriction (Master). Staff whose branch can't be determined
// (e.g. Surabaya staff with no branch picked yet) are excluded for restricted users.
export const isStaffInBranches = (
    staff: { branch?: string | null; location?: string | null },
    branches: string[] | null | undefined
) => {
    if (!branches) return true;
    const key = getStaffBranch(staff)?.key;
    return !!key && branches.includes(key);
};

export const getStaffBranchLabel = (staff: {
    branch?: string | null;
    location?: string | null;
}) => getStaffBranch(staff)?.title ?? staff.location ?? "";
