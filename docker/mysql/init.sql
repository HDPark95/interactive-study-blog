-- Lab Session 테이블
CREATE TABLE IF NOT EXISTS lab_session (
    id CHAR(36) PRIMARY KEY,
    lab_type VARCHAR(50) NOT NULL,
    lab_category VARCHAR(50) NOT NULL,
    config JSON,
    state JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL
);

-- 격리 수준 실습용 테이블
CREATE TABLE IF NOT EXISTS lab_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    balance DECIMAL(10, 2),
    session_id CHAR(36),
    FOREIGN KEY (session_id) REFERENCES lab_session(id) ON DELETE CASCADE
);

-- 인덱스 실습용 테이블
CREATE TABLE IF NOT EXISTS lab_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id CHAR(36),
    FOREIGN KEY (session_id) REFERENCES lab_session(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_lab_accounts_session ON lab_accounts(session_id);
CREATE INDEX idx_lab_products_session ON lab_products(session_id);
CREATE INDEX idx_lab_session_expires ON lab_session(expires_at);
