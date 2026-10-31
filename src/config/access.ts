import { LocationKey, LOCATIONS, STAFF_CITIES } from "@/constants/locations";
import { APP_OUTLETS, AppOutlet } from "@/constants/app-outlets";

export type Role = "Master" | "Admin" | "Staff";

export type AccessUser = {
    email?: string | null;
    role?: string | null;
    location?: string | null;
};

export const ACCOUNT_BRANCHES: Record<string, LocationKey[]> = {
    // Malang
    "malang@adminwash24.com": ["mlg"],
    "malang@kurirwash24.com": ["mlg"],

    // Surabaya
    "sbypusat@new-adminwash24.com": ["sby"],
    "sbypusat@new-kurirwash24.com": ["sby"],
    "sbybarat@new-adminwash24.com": ["sby2"],
    "sbybarat@new-kurirwash24.com": ["sby2"],
    "sbytimur@new-adminwash24.com": ["sby3"],
    "sbytimur@new-kurirwash24.com": ["sby3"],
    "sbyselatan@new-adminwash24.com": ["sby4"],
    "sbyselatan@new-kurirwash24.com": ["sby4"],

    // Jakarta
    "jktselatan@adminwash24.com": ["jkt3"],
    "jktselatan@kurirwash24.com": ["jkt3"],
    "jktpusat@new-adminwash24.com": ["jkt4"],
    "jktpusat@new-kurirwash24.com": ["jkt4"],
};

const PAGE_ROLES: Record<string, Role[]> = {
    "/attendance": ["Master", "Admin"],
    "/attendance-report": ["Master", "Admin"],
    "/staff": ["Master"],
    "/otp": ["Master"],
};

const APP_PAGES: Record<string, { roles: Role[]; hasDetail?: boolean }> = {
    "/app-orders": { roles: ["Master", "Admin"] },
    "/app-customers": { roles: ["Master", "Admin"], hasDetail: true },
    "/app-notifications": { roles: ["Master", "Admin"] },
    "/app-services": { roles: ["Master", "Admin"] },
};

const BRANCH_SECTIONS = ["delivery", "delivery-history", "production", "cash-report"];

const MASTER_CASH_KEY = "kas";

export const UNAUTHORIZED_PATH = "/unauthorized";

export function normalizeRole(role: string | null | undefined): Role | null {
    const value = role?.trim().toLowerCase();
    if (!value) return null;
    if (value === "master") return "Master";
    if (value === "admin") return "Admin";
    return "Staff";
}

export const isMaster = (user: AccessUser | null | undefined) =>
    normalizeRole(user?.role) === "Master";

export function getAllowedBranches(user: AccessUser | null | undefined): LocationKey[] {
    if (!normalizeRole(user?.role)) return [];
    if (isMaster(user)) return LOCATIONS.map((location) => location.key);

    const email = user?.email?.trim().toLowerCase() ?? "";
    const assigned = ACCOUNT_BRANCHES[email] ?? [];
    return LOCATIONS.filter((location) => assigned.includes(location.key)).map(
        (location) => location.key
    );
}

export function getAttendanceCities(user: AccessUser | null | undefined): string[] | null {
    if (isMaster(user)) return null;
    const branches = getAllowedBranches(user);
    const cities = LOCATIONS.filter((location) => branches.includes(location.key)).map(
        (location) => location.city
    );
    return STAFF_CITIES.filter((city) => cities.includes(city));
}

export function getAppOutlets(user: AccessUser | null | undefined): AppOutlet[] {
    if (isMaster(user)) return APP_OUTLETS;
    const branches = getAllowedBranches(user);
    return APP_OUTLETS.filter((outlet) => branches.includes(outlet.branch));
}

export const canManageAppCatalog = (user: AccessUser | null | undefined) => isMaster(user);

export const canEditAppCustomer = (user: AccessUser | null | undefined) => isMaster(user);

export const canBroadcastNotification = (user: AccessUser | null | undefined) => isMaster(user);

export function canAccessPath(pathname: string, user: AccessUser | null | undefined): boolean {
    const role = normalizeRole(user?.role);
    if (!role) return false;

    const path = pathname.replace(/\/+$/, "") || "/";
    if (path === UNAUTHORIZED_PATH) return true;

    if (!isMaster(user) && getAllowedBranches(user).length === 0) return false;

    const pageRoles = PAGE_ROLES[path];
    if (pageRoles) return pageRoles.includes(role);

    const [, section, branch, ...rest] = path.split("/");

    const appPage = APP_PAGES[`/${section}`];
    if (appPage) {
        if (rest.length > 0 || (branch && !appPage.hasDetail)) return false;
        return appPage.roles.includes(role) && getAppOutlets(user).length > 0;
    }

    if (!BRANCH_SECTIONS.includes(section) || !branch || rest.length > 0) {
        return false;
    }
    if (branch === MASTER_CASH_KEY) {
        return section === "cash-report" && isMaster(user);
    }
    return getAllowedBranches(user).some((key) => key === branch);
}

export function getHomePath(user: AccessUser | null | undefined): string {
    const branches = getAllowedBranches(user);
    if (branches.length === 0) return UNAUTHORIZED_PATH;

    const allowed = LOCATIONS.filter((location) => branches.includes(location.key));
    const city = user?.location?.trim().toLowerCase();
    const preferred =
        allowed.find((location) => location.city.toLowerCase() === city) ?? allowed[0];
    return `/delivery/${preferred.key}`;
}