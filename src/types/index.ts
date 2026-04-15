export type UserRole     = 'admin' | 'user';
export type ProjectStatus = 'active' | 'on-hold' | 'completed';
export type TaskStatus    = 'pending' | 'in-progress' | 'done';
export type TaskPriority  = 'low' | 'medium' | 'high' | 'critical';
export type RecurType     = 'daily' | 'weekly';
export type IssueType     = 'story' | 'bug' | 'task' | 'epic';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
}

export interface User extends AuthUser {
  status: string;
  created_at: string;
  total_tasks?: number;
  total_hours?: number;
  last_active?: string | null;
  entity_names?: string;
}

export interface Entity {
  id: number;
  name: string;
  description: string | null;
  logo: string | null;
  status: string;
  project_count?: number;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  entity_id: number;
  entity_name: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  total_tasks?: number;
  done_tasks?: number;
  total_hours?: number;
  is_deleted: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  project_id: number;
  project_name: string;
  user_name?: string;
  title: string;
  description: string | null;
  hours_spent: number;
  status: TaskStatus;
  priority: TaskPriority;
  task_date: string;
  due_date: string | null;
  recur_type: RecurType | null;
  recur_end: string | null;
  subtask_total: number;
  subtask_done: number;
  tracked_seconds: number;
  issue_type: IssueType;
  story_points: number | null;
  sprint_id: number | null;
  assignee_id: number | null;
  assignee_name: string | null;
  assignee_avatar: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_done: boolean;
  position: number;
  created_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  started_at: string;
  stopped_at: string | null;
  seconds: number;
}

export interface FilterPreset {
  id: number;
  user_id: number;
  name: string;
  filters: TaskFilters;
  created_at: string;
}

export interface DashboardStats {
  entities: number;
  projects: number;
  users: number;
  tasks_today: number;
}

export interface AdminDashboard {
  stats: DashboardStats;
  deadline_alerts: Project[];
  user_activity_table: UserActivity[];
  recent_tasks: Task[];
}

export interface UserDashboard {
  streak: number;
  weekly_summary: WeeklySummary;
  projects: Project[];
  recent_tasks: Task[];
}

export interface WeeklySummary {
  this_week_tasks: number;
  last_week_tasks: number;
  this_week_hours: number;
}

export interface UserActivity {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  total_tasks: number;
  total_hours: number;
  last_active: string | null;
}

export interface StatusSummary {
  status: TaskStatus;
  count: number;
}

export interface HoursByProject {
  project_name: string;
  total_hours: number;
}

export interface TasksPerProject {
  name: string;
  task_count: number;
  total_hours: number;
}

export interface UserReport {
  tasks: Task[];
  status_summary: StatusSummary[];
  hours_by_project: HoursByProject[];
  weekly_summary: WeeklySummary;
}

export interface AdminReport {
  tasks: Task[];
  user_activity: UserActivity[];
  tasks_per_project: TasksPerProject[];
  users: User[];
  projects: Project[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface TaskFilters {
  project_id?: string;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}
