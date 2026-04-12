CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE project_status AS ENUM ('active', 'on-hold', 'completed');
CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'done');

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        user_role     NOT NULL DEFAULT 'user',
    status      VARCHAR(20)   NOT NULL DEFAULT 'active',
    avatar      TEXT,
    is_deleted  BOOLEAN       NOT NULL DEFAULT false,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE entities (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150)  NOT NULL,
    description TEXT,
    logo        TEXT,
    status      VARCHAR(20)   NOT NULL DEFAULT 'active',
    is_deleted  BOOLEAN       NOT NULL DEFAULT false,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    id          SERIAL PRIMARY KEY,
    entity_id   INTEGER       NOT NULL REFERENCES entities(id),
    name        VARCHAR(200)  NOT NULL,
    description TEXT,
    start_date  DATE,
    end_date    DATE,
    status      project_status NOT NULL DEFAULT 'active',
    is_deleted  BOOLEAN       NOT NULL DEFAULT false,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE user_projects (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    project_id  INTEGER NOT NULL REFERENCES projects(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

CREATE TABLE tasks (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER       NOT NULL REFERENCES users(id),
    project_id  INTEGER       NOT NULL REFERENCES projects(id),
    title       VARCHAR(300)  NOT NULL,
    description TEXT,
    hours_spent NUMERIC(5,2)  NOT NULL DEFAULT 0,
    status      task_status   NOT NULL DEFAULT 'pending',
    task_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
    is_deleted  BOOLEAN       NOT NULL DEFAULT false,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_users_is_deleted  ON users(is_deleted);
CREATE INDEX idx_projects_entity   ON projects(entity_id);
CREATE INDEX idx_projects_status   ON projects(status);
CREATE INDEX idx_projects_end_date ON projects(end_date);
CREATE INDEX idx_tasks_user        ON tasks(user_id);
CREATE INDEX idx_tasks_project     ON tasks(project_id);
CREATE INDEX idx_tasks_date        ON tasks(task_date);
CREATE INDEX idx_tasks_status      ON tasks(status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_entities_updated BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated    BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO users (name, email, password, role, status)
VALUES ('Admin', 'admin@pracker.local', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');
