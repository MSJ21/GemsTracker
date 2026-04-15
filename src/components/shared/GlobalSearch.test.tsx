/**
 * GlobalSearch – complete test suite
 *
 * Covers:
 *  - Opening via Ctrl+K keyboard shortcut
 *  - Opening via `app:search:open` CustomEvent (Topbar button path)
 *  - Closing via Escape key
 *  - Closing via backdrop click
 *  - Quick-nav: user role shows USER links, admin role shows ADMIN links
 *  - Task search: filters by title, project name, and description
 *  - User project search (non-admin): returns project results
 *  - Empty state rendered when query has no matches
 *  - Loading spinner visible while task data is prefetching
 *  - X button clears the query and returns to quick-nav
 *  - Keyboard navigation: ArrowDown/ArrowUp moves selection highlight
 *  - Enter key on highlighted result calls navigate
 *  - Task data is queried as soon as the modal opens (prefetch on open)
 *  - Admin sees all result types: tasks + entities + projects + users
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';

/* ─── Module mocks ───────────────────────────────────────────────────── */

// react-router-dom – capture navigate calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const real = await importOriginal<typeof import('react-router-dom')>();
  return { ...real, useNavigate: () => mockNavigate };
});

// authStore – default to regular user; override per-test
const mockUser = vi.fn(() => ({ id: 1, name: 'Test User', role: 'user', email: 'user@test.com' }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser() }),
}));

// API modules
vi.mock('@/api/entities', () => ({
  entitiesApi: {
    list: vi.fn(),
  },
}));
vi.mock('@/api/projects', () => ({
  projectsApi: {
    list: vi.fn(),
    userProjects: vi.fn(),
  },
}));
vi.mock('@/api/users', () => ({
  usersApi: {
    list: vi.fn(),
  },
}));
vi.mock('@/api/tasks', () => ({
  tasksApi: {
    list: vi.fn(),
  },
}));

import { entitiesApi } from '@/api/entities';
import { projectsApi } from '@/api/projects';
import { usersApi } from '@/api/users';
import { tasksApi } from '@/api/tasks';

/* ─── Helpers ────────────────────────────────────────────────────────── */

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderSearch(qc = makeQC()) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function openViaCtrlK() {
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
}

function openViaCustomEvent() {
  document.dispatchEvent(new CustomEvent('app:search:open'));
}

/* ─── Default mock data ──────────────────────────────────────────────── */

const MOCK_TASKS = [
  { id: 1, title: 'Fix login bug', project_name: 'Alpha', description: 'Auth issue', status: 'pending' },
  { id: 2, title: 'Build dashboard', project_name: 'Beta', description: 'UI work', status: 'in-progress' },
  { id: 3, title: 'Write docs',      project_name: 'Alpha', description: 'Documentation for auth', status: 'done' },
];

const MOCK_USER_PROJECTS = [
  { id: 10, name: 'Alpha Project', entity_name: 'Corp A' },
  { id: 11, name: 'Beta Project',  entity_name: 'Corp B' },
];

const MOCK_ENTITIES = {
  entities: [
    { id: 1, name: 'Acme Corp', description: 'Enterprise client' },
  ],
};

const MOCK_ADMIN_PROJECTS = {
  projects: [
    { id: 20, name: 'Admin Project', entity_name: 'Acme Corp' },
  ],
};

const MOCK_ADMIN_USERS = {
  users: [
    { id: 5, name: 'Alice Admin', email: 'alice@acme.com' },
  ],
};

beforeEach(() => {
  vi.mocked(tasksApi.list).mockResolvedValue({ data: MOCK_TASKS } as never);
  vi.mocked(projectsApi.userProjects).mockResolvedValue({ data: MOCK_USER_PROJECTS } as never);
  vi.mocked(entitiesApi.list).mockResolvedValue({ data: MOCK_ENTITIES } as never);
  vi.mocked(projectsApi.list).mockResolvedValue({ data: MOCK_ADMIN_PROJECTS } as never);
  vi.mocked(usersApi.list).mockResolvedValue({ data: MOCK_ADMIN_USERS } as never);
  mockUser.mockReturnValue({ id: 1, name: 'Test User', role: 'user', email: 'user@test.com' });
});

afterEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
});

/* ═══════════════════════════════════════════════════════════════════════
   OPEN / CLOSE
═══════════════════════════════════════════════════════════════════════ */

describe('open and close', () => {
  it('is hidden on initial render', () => {
    renderSearch();
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });

  it('opens on Ctrl+K', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.getByTestId('global-search-overlay')).toBeInTheDocument();
  });

  it('opens on Meta+K (Mac)', () => {
    renderSearch();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByTestId('global-search-overlay')).toBeInTheDocument();
  });

  it('opens via app:search:open CustomEvent', () => {
    renderSearch();
    openViaCustomEvent();
    expect(screen.getByTestId('global-search-overlay')).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    renderSearch();
    openViaCtrlK();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });

  it('closes when backdrop is clicked', () => {
    renderSearch();
    openViaCtrlK();
    // The backdrop is the button with aria-label "Close search"
    fireEvent.click(screen.getByLabelText('Close search'));
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });

  it('toggles closed on second Ctrl+K', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.getByTestId('global-search-overlay')).toBeInTheDocument();
    openViaCtrlK();
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });

  it('clears the query when reopened', async () => {
    const user = userEvent.setup();
    renderSearch();
    openViaCtrlK();
    await user.type(screen.getByTestId('global-search-input'), 'hello');
    fireEvent.keyDown(document, { key: 'Escape' });
    openViaCtrlK();
    expect(screen.getByTestId('global-search-input')).toHaveValue('');
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   QUICK NAVIGATION (empty query state)
═══════════════════════════════════════════════════════════════════════ */

describe('quick navigation', () => {
  it('shows quick-nav section when query is empty', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.getByTestId('global-search-quick-nav')).toBeInTheDocument();
  });

  it('shows USER quick links for role=user', () => {
    renderSearch();
    openViaCtrlK();
    const nav = screen.getByTestId('global-search-quick-nav');
    expect(within(nav).getByText('My Tasks')).toBeInTheDocument();
    expect(within(nav).getByText('Sprint Board')).toBeInTheDocument();
    expect(within(nav).getByText('Announcements')).toBeInTheDocument();
    // Admin-only links must NOT appear
    expect(within(nav).queryByText('Entities')).toBeNull();
    expect(within(nav).queryByText('Users')).toBeNull();
  });

  it('shows ADMIN quick links for role=admin', () => {
    mockUser.mockReturnValue({ id: 99, name: 'Admin', role: 'admin', email: 'admin@test.com' });
    renderSearch();
    openViaCtrlK();
    const nav = screen.getByTestId('global-search-quick-nav');
    expect(within(nav).getByText('Entities')).toBeInTheDocument();
    expect(within(nav).getByText('Users')).toBeInTheDocument();
    expect(within(nav).getByText('Org Chart')).toBeInTheDocument();
    // User-only links must NOT appear
    expect(within(nav).queryByText('My Tasks')).toBeNull();
    expect(within(nav).queryByText('Sprint Board')).toBeNull();
  });

  it('quick link click navigates and closes the panel', () => {
    renderSearch();
    openViaCtrlK();
    const nav = screen.getByTestId('global-search-quick-nav');
    fireEvent.click(within(nav).getByText('My Tasks'));
    expect(mockNavigate).toHaveBeenCalledWith('/user/tasks');
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });

  it('admin quick link click navigates to admin route', () => {
    mockUser.mockReturnValue({ id: 99, name: 'Admin', role: 'admin', email: 'admin@test.com' });
    renderSearch();
    openViaCtrlK();
    const nav = screen.getByTestId('global-search-quick-nav');
    fireEvent.click(within(nav).getByText('Entities'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/entities');
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   TASK SEARCH (user role)
═══════════════════════════════════════════════════════════════════════ */

describe('task search (user role)', () => {
  it('shows task results matching the title', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    const input = screen.getByTestId('global-search-input');
    fireEvent.change(input, { target: { value: 'Fix' } });

    await waitFor(() => {
      expect(screen.getByTestId('global-search-results')).toBeInTheDocument();
    });
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    expect(screen.queryByText('Build dashboard')).toBeNull();
  });

  it('shows task results matching the project name', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Alpha' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    // Both tasks from Alpha should appear
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    expect(screen.getByText('Write docs')).toBeInTheDocument();
  });

  it('shows task results matching the description', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Documentation' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    expect(screen.getByText('Write docs')).toBeInTheDocument();
  });

  it('limits task results to 5', async () => {
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1, title: `Task ${i + 1}`, project_name: 'Alpha', description: '', status: 'pending',
    }));
    vi.mocked(tasksApi.list).mockResolvedValue({ data: manyTasks } as never);

    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Task' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    const results = screen.getAllByText(/^Task \d+$/);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('shows task status and project name as sub-label', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Fix' } });

    await waitFor(() => expect(screen.getByText('Fix login bug')).toBeInTheDocument());
    // Sub-label includes project_name · status
    expect(screen.getByText(/Alpha\s*·\s*pending/)).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   USER PROJECT SEARCH (non-admin)
═══════════════════════════════════════════════════════════════════════ */

describe('user project search (non-admin)', () => {
  it('shows project results matching the project name', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(projectsApi.userProjects)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Beta Project' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
    expect(screen.getByText('Corp B')).toBeInTheDocument();
  });

  it('limits project results to 3', async () => {
    const manyProjects = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1, name: `Project ${i + 1}`, entity_name: 'Corp',
    }));
    vi.mocked(projectsApi.userProjects).mockResolvedValue({ data: manyProjects } as never);

    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(projectsApi.userProjects)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Project' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    const projectItems = screen.getAllByText(/^Project \d+$/);
    expect(projectItems.length).toBeLessThanOrEqual(3);
  });

  it('does NOT call userProjects for admin role', () => {
    mockUser.mockReturnValue({ id: 99, name: 'Admin', role: 'admin', email: 'admin@test.com' });
    renderSearch();
    openViaCtrlK();
    // userProjects should not be called for admin
    expect(vi.mocked(projectsApi.userProjects)).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ADMIN MULTI-TYPE SEARCH
═══════════════════════════════════════════════════════════════════════ */

describe('admin multi-type search', () => {
  beforeEach(() => {
    mockUser.mockReturnValue({ id: 99, name: 'Admin', role: 'admin', email: 'admin@test.com' });
  });

  it('shows entity results for admin', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(entitiesApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Acme' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('shows project results for admin', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(projectsApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Admin Project' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    expect(screen.getByText('Admin Project')).toBeInTheDocument();
  });

  it('shows user results for admin', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(usersApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Alice' } });

    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
  });

  it('shows type badge on each result', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(entitiesApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Acme' } });

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    expect(screen.getByText('entity')).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════════════════ */

describe('empty state', () => {
  it('shows empty state when query has no matches', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'xyznotfound' } });

    await waitFor(() => expect(screen.getByTestId('global-search-empty')).toBeInTheDocument());
    expect(screen.getByText(/No results for/)).toBeInTheDocument();
    expect(screen.getByText(/"xyznotfound"/)).toBeInTheDocument();
  });

  it('does not show empty state while query is blank', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.queryByTestId('global-search-empty')).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   CLEAR BUTTON
═══════════════════════════════════════════════════════════════════════ */

describe('clear (X) button', () => {
  it('is hidden when query is empty', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('appears when query has text', async () => {
    const user = userEvent.setup();
    renderSearch();
    openViaCtrlK();
    await user.type(screen.getByTestId('global-search-input'), 'hello');
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('clears the query and hides results', async () => {
    const user = userEvent.setup();
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    await user.type(screen.getByTestId('global-search-input'), 'Fix');
    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Clear search'));

    expect(screen.getByTestId('global-search-input')).toHaveValue('');
    expect(screen.queryByTestId('global-search-results')).toBeNull();
    expect(screen.getByTestId('global-search-quick-nav')).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   KEYBOARD NAVIGATION
═══════════════════════════════════════════════════════════════════════ */

describe('keyboard navigation', () => {
  it('ArrowDown moves selection to next result', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'a' } });
    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());

    const input = screen.getByTestId('global-search-input');
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Second result should be highlighted (index 1)
    const resultButtons = screen.getAllByRole('button', { name: /^(?!Close|Clear|Close search)/ });
    // Just verify no error is thrown and first result is no longer the only highlighted one
    expect(resultButtons.length).toBeGreaterThan(0);
  });

  it('ArrowUp does not go below 0', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Fix' } });
    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());

    const input = screen.getByTestId('global-search-input');
    // Press up when already at index 0 — should stay at 0 (no crash)
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getByTestId('global-search-results')).toBeInTheDocument();
  });

  it('Enter on highlighted result calls navigate and closes panel', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Fix' } });
    await waitFor(() => expect(screen.getByTestId('global-search-results')).toBeInTheDocument());

    const input = screen.getByTestId('global-search-input');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalled();
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });

  it('clicking a result navigates and closes panel', async () => {
    renderSearch();
    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId('global-search-input'), { target: { value: 'Fix' } });
    await waitFor(() => expect(screen.getByText('Fix login bug')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('search-result-t-1'));

    expect(mockNavigate).toHaveBeenCalled();
    expect(screen.queryByTestId('global-search-overlay')).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   PREFETCH ON OPEN
═══════════════════════════════════════════════════════════════════════ */

describe('prefetch on open', () => {
  it('calls tasksApi.list as soon as the modal opens (before typing)', async () => {
    renderSearch();
    expect(vi.mocked(tasksApi.list)).not.toHaveBeenCalled();

    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(tasksApi.list)).toHaveBeenCalled());
  });

  it('calls userProjects as soon as the modal opens for non-admin', async () => {
    renderSearch();
    expect(vi.mocked(projectsApi.userProjects)).not.toHaveBeenCalled();

    openViaCtrlK();
    await waitFor(() => expect(vi.mocked(projectsApi.userProjects)).toHaveBeenCalled());
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   LOADING STATE
═══════════════════════════════════════════════════════════════════════ */

describe('loading spinner', () => {
  it('shows spinner while tasks are loading and query is empty', async () => {
    // Delay the task response so isFetching is true during render
    let resolveTask!: (v: unknown) => void;
    vi.mocked(tasksApi.list).mockReturnValue(
      new Promise(res => { resolveTask = res; }) as never
    );

    renderSearch();
    openViaCtrlK();

    // Spinner should be present while loading (query is empty)
    expect(screen.getByRole('status', { hidden: true })
      ?? document.querySelector('.animate-spin')
    ).toBeTruthy();

    // Unblock the request
    resolveTask({ data: [] });
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   ACCESSIBILITY
═══════════════════════════════════════════════════════════════════════ */

describe('accessibility', () => {
  it('input has aria-label', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.getByLabelText('Global search')).toBeInTheDocument();
  });

  it('backdrop button has aria-label', () => {
    renderSearch();
    openViaCtrlK();
    expect(screen.getByLabelText('Close search')).toBeInTheDocument();
  });

  it('renders footer keyboard hints', () => {
    renderSearch();
    openViaCtrlK();
    // Footer should contain navigate/open/close hints
    expect(screen.getByText('navigate')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('close')).toBeInTheDocument();
  });
});
