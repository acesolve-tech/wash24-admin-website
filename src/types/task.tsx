export type Task = {
  id: string;
  title: string;
  description?: string;
  note?: string;
  photo?: string;
  status?: boolean;
  order?: number;
  taskType?: "high" | "low" | "" | null;
};
