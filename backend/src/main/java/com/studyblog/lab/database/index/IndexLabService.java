package com.studyblog.lab.database.index;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexLabService {

    private final JdbcTemplate jdbcTemplate;

    // 허용된 테이블 (보안을 위해)
    private static final Set<String> ALLOWED_TABLES = Set.of(
        "index_lab_users", "index_lab_locations"
    );

    private static final Pattern SAFE_NAME_PATTERN = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]*$");

    /**
     * 테이블 목록 조회
     */
    public List<TableInfo> getTables() {
        String sql = """
            SELECT
                t.table_name,
                pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) as total_size,
                (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count,
                (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as row_count
            FROM information_schema.tables t
            WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
            AND t.table_name LIKE 'index_lab_%'
            ORDER BY t.table_name
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            TableInfo info = new TableInfo();
            info.setTableName(rs.getString("table_name"));
            info.setTotalSize(rs.getString("total_size"));
            info.setColumnCount(rs.getInt("column_count"));
            info.setRowCount(rs.getLong("row_count"));
            return info;
        });
    }

    /**
     * 테이블의 인덱스 목록 조회
     */
    public List<IndexInfo> getIndexes(String tableName) {
        validateTableName(tableName);

        String sql = """
            SELECT
                i.indexname as index_name,
                i.indexdef as index_definition,
                pg_size_pretty(pg_relation_size(quote_ident(i.indexname))) as index_size,
                am.amname as index_type,
                idx.indisunique as is_unique,
                idx.indisprimary as is_primary,
                array_to_string(ARRAY(
                    SELECT pg_get_indexdef(idx.indexrelid, k + 1, true)
                    FROM generate_subscripts(idx.indkey, 1) as k
                    ORDER BY k
                ), ', ') as columns
            FROM pg_indexes i
            JOIN pg_class c ON c.relname = i.indexname
            JOIN pg_index idx ON idx.indexrelid = c.oid
            JOIN pg_am am ON am.oid = c.relam
            WHERE i.tablename = ?
            ORDER BY i.indexname
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            IndexInfo info = new IndexInfo();
            info.setIndexName(rs.getString("index_name"));
            info.setIndexDefinition(rs.getString("index_definition"));
            info.setIndexSize(rs.getString("index_size"));
            info.setIndexType(rs.getString("index_type"));
            info.setUnique(rs.getBoolean("is_unique"));
            info.setPrimary(rs.getBoolean("is_primary"));
            info.setColumns(rs.getString("columns"));
            return info;
        }, tableName);
    }

    /**
     * B-Tree 인덱스 구조 조회 (pageinspect 사용)
     */
    public IndexStructure getIndexStructure(String indexName) {
        validateIndexName(indexName);

        IndexStructure structure = new IndexStructure();
        structure.setIndexName(indexName);

        try {
            // 메타 정보 조회
            String metaSql = "SELECT * FROM bt_metap(?)";
            Map<String, Object> meta = jdbcTemplate.queryForMap(metaSql, indexName);

            structure.setTreeLevel(((Number) meta.get("level")).intValue());
            structure.setRootBlockNo(((Number) meta.get("root")).longValue());
            structure.setFastRoot(((Number) meta.get("fastroot")).longValue());

            // 각 레벨별 페이지 정보 수집
            List<IndexPage> pages = new ArrayList<>();
            int level = structure.getTreeLevel();

            // 루트부터 시작해서 리프까지 탐색 (최대 100페이지)
            Set<Long> visitedPages = new HashSet<>();
            Queue<Long> pageQueue = new LinkedList<>();
            pageQueue.add(structure.getRootBlockNo());

            int pageCount = 0;
            while (!pageQueue.isEmpty() && pageCount < 50) {
                Long blockNo = pageQueue.poll();
                if (blockNo == null || visitedPages.contains(blockNo) || blockNo < 0) continue;
                visitedPages.add(blockNo);
                pageCount++;

                try {
                    // 페이지 통계
                    String statsSql = "SELECT * FROM bt_page_stats(?, ?)";
                    Map<String, Object> stats = jdbcTemplate.queryForMap(statsSql, indexName, blockNo.intValue());

                    IndexPage page = new IndexPage();
                    page.setBlockNo(blockNo);
                    page.setLevel(((Number) stats.get("btpo_level")).intValue());
                    // type: 'l' = leaf, 'r' = root, 'i' = internal
                    String nodeType = stats.get("type").toString();
                    page.setIsLeaf("l".equals(nodeType));
                    page.setLiveItems(((Number) stats.get("live_items")).intValue());
                    page.setDeadItems(((Number) stats.get("dead_items")).intValue());
                    page.setFreeSize(((Number) stats.get("free_size")).intValue());

                    // 페이지 아이템 조회 (키 값들)
                    String itemsSql = "SELECT * FROM bt_page_items(?, ?) LIMIT 20";
                    List<Map<String, Object>> items = jdbcTemplate.queryForList(itemsSql, indexName, blockNo.intValue());

                    List<String> keys = new ArrayList<>();
                    List<Long> childBlocks = new ArrayList<>();

                    for (Map<String, Object> item : items) {
                        Object data = item.get("data");
                        if (data != null) {
                            keys.add(data.toString().length() > 30
                                ? data.toString().substring(0, 30) + "..."
                                : data.toString());
                        }

                        // 자식 페이지 블록 번호
                        Object ctid = item.get("ctid");
                        if (ctid != null && !page.getIsLeaf()) {
                            String ctidStr = ctid.toString();
                            // ctid format: (block,offset)
                            if (ctidStr.startsWith("(")) {
                                String blockStr = ctidStr.substring(1, ctidStr.indexOf(","));
                                try {
                                    long childBlock = Long.parseLong(blockStr);
                                    if (childBlock > 0 && !visitedPages.contains(childBlock)) {
                                        childBlocks.add(childBlock);
                                        pageQueue.add(childBlock);
                                    }
                                } catch (NumberFormatException e) {
                                    // ignore
                                }
                            }
                        }
                    }

                    page.setKeys(keys);
                    page.setChildBlocks(childBlocks);
                    pages.add(page);

                } catch (Exception e) {
                    log.warn("Failed to read page {}: {}", blockNo, e.getMessage());
                }
            }

            structure.setPages(pages);
            structure.setTotalPages(pageCount);

            // 레벨별 페이지 수 계산
            Map<Integer, Long> pagesPerLevel = new HashMap<>();
            for (IndexPage page : pages) {
                pagesPerLevel.merge(page.getLevel(), 1L, Long::sum);
            }
            structure.setPagesPerLevel(pagesPerLevel);

        } catch (Exception e) {
            log.error("Failed to get index structure for {}: {}", indexName, e.getMessage());
            structure.setError("인덱스 구조를 읽을 수 없습니다: " + e.getMessage());
        }

        return structure;
    }

    /**
     * 인덱스 생성
     */
    public void createIndex(CreateIndexRequest request) {
        validateTableName(request.getTableName());
        validateIndexName(request.getIndexName());

        // 컬럼명 검증
        for (String col : request.getColumns()) {
            if (!SAFE_NAME_PATTERN.matcher(col).matches()) {
                throw new IllegalArgumentException("Invalid column name: " + col);
            }
        }

        String indexType = request.getIndexType() != null ? request.getIndexType() : "btree";
        String columns = String.join(", ", request.getColumns());

        String sql = String.format(
            "CREATE INDEX %s ON %s USING %s (%s)",
            request.getIndexName(),
            request.getTableName(),
            indexType,
            columns
        );

        log.info("Creating index: {}", sql);
        jdbcTemplate.execute(sql);
    }

    /**
     * 인덱스 삭제
     */
    public void dropIndex(String indexName) {
        validateIndexName(indexName);

        // 시스템 인덱스는 삭제 불가
        if (indexName.endsWith("_pkey")) {
            throw new IllegalArgumentException("Primary key 인덱스는 삭제할 수 없습니다");
        }

        String sql = "DROP INDEX IF EXISTS " + indexName;
        log.info("Dropping index: {}", sql);
        jdbcTemplate.execute(sql);
    }

    /**
     * 쿼리 실행 계획 분석
     */
    public ExplainResult explainQuery(String query) {
        // 보안: SELECT만 허용
        if (!query.trim().toLowerCase().startsWith("select")) {
            throw new IllegalArgumentException("SELECT 쿼리만 허용됩니다");
        }

        // 위험한 키워드 차단
        String lowerQuery = query.toLowerCase();
        if (lowerQuery.contains("delete") || lowerQuery.contains("update") ||
            lowerQuery.contains("insert") || lowerQuery.contains("drop") ||
            lowerQuery.contains("truncate") || lowerQuery.contains("alter")) {
            throw new IllegalArgumentException("허용되지 않는 쿼리입니다");
        }

        String explainSql = "EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) " + query;

        ExplainResult result = new ExplainResult();
        result.setOriginalQuery(query);

        try {
            List<Map<String, Object>> explainResult = jdbcTemplate.queryForList(explainSql);
            if (!explainResult.isEmpty()) {
                Object plan = explainResult.get(0).get("QUERY PLAN");
                result.setPlan(plan.toString());
                result.setSuccess(true);

                // 인덱스 사용 여부 분석
                String planStr = plan.toString().toLowerCase();
                result.setUsesIndex(planStr.contains("index scan") || planStr.contains("index only scan"));
                result.setUsesSeqScan(planStr.contains("seq scan"));
            }
        } catch (Exception e) {
            result.setSuccess(false);
            result.setError(e.getMessage());
        }

        return result;
    }

    /**
     * 사용자 데이터 삽입 (인덱스 변화 관찰용)
     */
    public Map<String, Object> insertUser(String username, String email, int age, String department) {
        String sql = """
            INSERT INTO index_lab_users (username, email, age, department, salary, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
            RETURNING id
        """;

        Long id = jdbcTemplate.queryForObject(sql, Long.class,
            username, email, age, department, 50000 + (int)(Math.random() * 50000));

        return Map.of(
            "success", true,
            "id", id,
            "message", "사용자가 추가되었습니다: " + username
        );
    }

    /**
     * 사용자 데이터 삭제
     */
    public Map<String, Object> deleteUser(Long id) {
        String sql = "DELETE FROM index_lab_users WHERE id = ?";
        int deleted = jdbcTemplate.update(sql, id);

        return Map.of(
            "success", deleted > 0,
            "message", deleted > 0 ? "사용자가 삭제되었습니다" : "사용자를 찾을 수 없습니다"
        );
    }

    /**
     * 대량 데이터 삽입 (페이지 분할 관찰용)
     */
    public Map<String, Object> bulkInsertUsers(int count, String prefix) {
        String sql = """
            INSERT INTO index_lab_users (username, email, age, department, salary, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        """;

        String[] departments = {"Engineering", "Sales", "Marketing", "HR", "Finance"};

        for (int i = 0; i < count; i++) {
            String username = prefix + "_" + System.currentTimeMillis() + "_" + i;
            String email = username + "@example.com";
            int age = 20 + (int)(Math.random() * 40);
            String dept = departments[(int)(Math.random() * departments.length)];
            int salary = 30000 + (int)(Math.random() * 70000);

            jdbcTemplate.update(sql, username, email, age, dept, salary);
        }

        return Map.of(
            "success", true,
            "count", count,
            "message", count + "명의 사용자가 추가되었습니다"
        );
    }

    /**
     * 테이블 데이터 조회 (페이징)
     */
    public Map<String, Object> getUsers(int page, int size) {
        String countSql = "SELECT COUNT(*) FROM index_lab_users";
        Long total = jdbcTemplate.queryForObject(countSql, Long.class);

        String sql = """
            SELECT id, username, email, age, department, salary
            FROM index_lab_users
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, size, page * size);

        return Map.of(
            "users", users,
            "total", total,
            "page", page,
            "size", size,
            "totalPages", (total + size - 1) / size
        );
    }

    /**
     * 테이블 초기화 (원래 1000개로)
     */
    public Map<String, Object> resetTable() {
        // 기존 데이터 삭제
        jdbcTemplate.execute("TRUNCATE TABLE index_lab_users RESTART IDENTITY");

        // 1000개 재생성
        String sql = """
            INSERT INTO index_lab_users (username, email, age, department, salary, created_at)
            SELECT
                'user_' || i,
                'user_' || i || '@example.com',
                20 + (random() * 40)::int,
                (ARRAY['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'])[1 + (random() * 4)::int],
                30000 + (random() * 70000)::int,
                NOW() - (random() * interval '365 days')
            FROM generate_series(1, 1000) AS i
        """;
        jdbcTemplate.execute(sql);

        return Map.of(
            "success", true,
            "message", "테이블이 1000개 데이터로 초기화되었습니다"
        );
    }

    /**
     * 공간 검색 (PostGIS)
     */
    public List<SpatialSearchResult> spatialSearch(double longitude, double latitude, double radiusMeters) {
        String sql = """
            SELECT
                id,
                name,
                category,
                ST_X(geom) as longitude,
                ST_Y(geom) as latitude,
                ST_Distance(
                    geom::geography,
                    ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
                ) as distance_meters
            FROM index_lab_locations
            WHERE ST_DWithin(
                geom::geography,
                ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
                ?
            )
            ORDER BY distance_meters
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            SpatialSearchResult result = new SpatialSearchResult();
            result.setId(rs.getLong("id"));
            result.setName(rs.getString("name"));
            result.setCategory(rs.getString("category"));
            result.setLongitude(rs.getDouble("longitude"));
            result.setLatitude(rs.getDouble("latitude"));
            result.setDistanceMeters(rs.getDouble("distance_meters"));
            return result;
        }, longitude, latitude, longitude, latitude, radiusMeters);
    }

    private void validateTableName(String tableName) {
        if (!ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException("허용되지 않은 테이블입니다: " + tableName);
        }
    }

    private void validateIndexName(String indexName) {
        if (!SAFE_NAME_PATTERN.matcher(indexName).matches()) {
            throw new IllegalArgumentException("유효하지 않은 인덱스 이름입니다: " + indexName);
        }
        // idx_로 시작하는지 확인 (사용자 생성 인덱스)
        if (!indexName.startsWith("idx_") && !indexName.endsWith("_pkey")) {
            throw new IllegalArgumentException("인덱스 이름은 'idx_'로 시작해야 합니다");
        }
    }
}
