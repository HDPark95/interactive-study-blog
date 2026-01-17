-- 확장 설치
CREATE EXTENSION IF NOT EXISTS pageinspect;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Lab Session 테이블
CREATE TABLE IF NOT EXISTS lab_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_type VARCHAR(50) NOT NULL,
    lab_category VARCHAR(50) NOT NULL,
    config JSONB,
    state JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- 격리 수준 실습용 테이블
CREATE TABLE IF NOT EXISTS lab_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    balance DECIMAL(10, 2),
    session_id UUID REFERENCES lab_session(id) ON DELETE CASCADE
);

-- 인덱스 실습용 테이블
CREATE TABLE IF NOT EXISTS lab_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    session_id UUID REFERENCES lab_session(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lab_accounts_session ON lab_accounts(session_id);
CREATE INDEX IF NOT EXISTS idx_lab_products_session ON lab_products(session_id);
CREATE INDEX IF NOT EXISTS idx_lab_session_expires ON lab_session(expires_at);

-- 테스트 데이터
INSERT INTO lab_session (id, lab_type, lab_category, config, state)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ISOLATION',
    'database',
    '{"isolationLevel": "READ_COMMITTED", "dbType": "POSTGRESQL", "scenario": "DIRTY_READ"}',
    '{"txAState": "IDLE", "txBState": "IDLE"}'
);

INSERT INTO lab_accounts (name, balance, session_id)
VALUES
    ('Alice', 1000.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    ('Bob', 2000.00, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- ========================================
-- 인덱스 시각화 실습용 테이블
-- ========================================

-- 사용자 테이블 (B-Tree 인덱스 실습)
CREATE TABLE IF NOT EXISTS index_lab_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INT,
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 위치 테이블 (공간 인덱스 실습)
CREATE TABLE IF NOT EXISTS index_lab_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    geom GEOMETRY(Point, 4326)
);

-- 샘플 사용자 데이터 (1000명)
INSERT INTO index_lab_users (username, email, age, department, salary)
SELECT
    'user_' || i,
    'user_' || i || '@example.com',
    20 + (random() * 40)::int,
    (ARRAY['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'])[1 + (random() * 4)::int],
    30000 + (random() * 70000)::decimal(10,2)
FROM generate_series(1, 1000) AS i;

-- 샘플 위치 데이터 (서울 주변)
INSERT INTO index_lab_locations (name, category, geom)
VALUES
    ('강남역', 'station', ST_SetSRID(ST_MakePoint(127.0276, 37.4979), 4326)),
    ('홍대입구역', 'station', ST_SetSRID(ST_MakePoint(126.9235, 37.5571), 4326)),
    ('명동', 'shopping', ST_SetSRID(ST_MakePoint(126.9822, 37.5636), 4326)),
    ('이태원', 'entertainment', ST_SetSRID(ST_MakePoint(126.9947, 37.5345), 4326)),
    ('잠실', 'sports', ST_SetSRID(ST_MakePoint(127.0719, 37.5152), 4326)),
    ('여의도', 'business', ST_SetSRID(ST_MakePoint(126.9246, 37.5219), 4326)),
    ('신촌', 'education', ST_SetSRID(ST_MakePoint(126.9368, 37.5550), 4326)),
    ('압구정', 'shopping', ST_SetSRID(ST_MakePoint(127.0286, 37.5270), 4326));

-- 기본 인덱스 생성 (실습용)
CREATE INDEX IF NOT EXISTS idx_users_username ON index_lab_users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON index_lab_users(email);
CREATE INDEX IF NOT EXISTS idx_users_age ON index_lab_users(age);
CREATE INDEX IF NOT EXISTS idx_users_dept_salary ON index_lab_users(department, salary);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON index_lab_locations USING GIST(geom);
