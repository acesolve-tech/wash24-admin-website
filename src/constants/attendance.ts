import { AttendanceType } from "@/types/attendance";

export const ATTENDANCE_LABELS: Record<AttendanceType, string> = {
    clock_in: "Datang Kerja",
    clock_out: "Pulang Kerja",
    rest_start: "Mulai Istirahat",
    rest_end: "Selesai Istirahat",
};