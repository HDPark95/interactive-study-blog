"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  MapPin,
  ArrowDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  RotateCcw,
  Zap,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

const getApiBase = () => `${getApiBaseUrl()}/api/lab/database/index`;

interface IndexInfo {
  indexName: string;
  indexDefinition: string;
  indexSize: string;
  indexType: string;
  unique: boolean;
  primary: boolean;
  columns: string;
}

interface IndexPage {
  blockNo: number;
  level: number;
  isLeaf: boolean;
  liveItems: number;
  deadItems: number;
  freeSize: number;
  keys: string[];
  childBlocks: number[];
}

interface IndexStructure {
  indexName: string;
  treeLevel: number;
  rootBlockNo: number;
  totalPages: number;
  pages: IndexPage[];
  pagesPerLevel: Record<number, number>;
  error?: string;
}

interface ExplainResult {
  originalQuery: string;
  plan: string;
  success: boolean;
  error?: string;
  usesIndex: boolean;
  usesSeqScan: boolean;
}

interface SpatialResult {
  id: number;
  name: string;
  category: string;
  longitude: number;
  latitude: number;
  distanceMeters: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  age: number;
  department: string;
  salary: number;
}

export function RealIndexVisualizer() {
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("idx_users_username");
  const [indexStructure, setIndexStructure] = useState<IndexStructure | null>(null);
  const [prevStructure, setPrevStructure] = useState<IndexStructure | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 사용자 데이터
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(0);

  // 새 사용자 입력
  const [newUsername, setNewUsername] = useState("");
  const [newAge, setNewAge] = useState("25");

  // 대량 삽입
  const [bulkCount, setBulkCount] = useState("100");
  const [bulkPrefix, setBulkPrefix] = useState("bulk");

  // 쿼리 실행
  const [query, setQuery] = useState("SELECT * FROM index_lab_users WHERE username = 'user_100'");
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null);

  // 공간 검색
  const [spatialResults, setSpatialResults] = useState<SpatialResult[]>([]);
  const [searchLng, setSearchLng] = useState("127.0");
  const [searchLat, setSearchLat] = useState("37.5");
  const [searchRadius, setSearchRadius] = useState("3000");

  // hex 문자열을 읽기 쉬운 문자열로 변환
  const decodeHexKey = (hexStr: string): string => {
    if (!hexStr || hexStr === "") return "(empty)";
    const parts = hexStr.split(" ").filter(p => p && p !== "...");
    if (parts.length === 0) return hexStr;

    try {
      const zeroCount = parts.filter(p => p === "00").length;
      if (zeroCount > parts.length * 0.5) {
        const nonZeroParts = parts.filter(p => p !== "00");
        if (nonZeroParts.length <= 2) {
          const num = parseInt(nonZeroParts[0] || "0", 16);
          return `ID: ${num}`;
        }
      }

      const chars = parts.slice(1).map(hex => {
        const code = parseInt(hex, 16);
        if (code >= 32 && code < 127) {
          return String.fromCharCode(code);
        }
        return "";
      }).join("").replace(/\0/g, "");

      return chars || hexStr.substring(0, 20);
    } catch {
      return hexStr.substring(0, 20);
    }
  };

  // 인덱스 목록 조회
  const fetchIndexes = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/tables/index_lab_users/indexes`);
      if (!res.ok) throw new Error("인덱스 목록을 가져올 수 없습니다");
      const data = await res.json();
      setIndexes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    }
  }, []);

  // 인덱스 구조 조회
  const fetchIndexStructure = useCallback(async (indexName: string, savePrev = false) => {
    if (!indexName) return;
    setLoading(true);
    try {
      if (savePrev && indexStructure) {
        setPrevStructure(indexStructure);
      }
      const res = await fetch(`${getApiBase()}/indexes/${indexName}/structure`);
      if (!res.ok) throw new Error("인덱스 구조를 가져올 수 없습니다");
      const data = await res.json();
      setIndexStructure(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [indexStructure]);

  // 사용자 목록 조회
  const fetchUsers = async (page = 0) => {
    try {
      const res = await fetch(`${getApiBase()}/users?page=${page}&size=10`);
      if (!res.ok) throw new Error("사용자 목록을 가져올 수 없습니다");
      const data = await res.json();
      setUsers(data.users);
      setTotalUsers(data.total);
      setUserPage(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    }
  };

  // 사용자 추가
  const insertUser = async () => {
    if (!newUsername) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: `${newUsername}@example.com`,
          age: parseInt(newAge),
          department: "Engineering",
        }),
      });
      if (!res.ok) throw new Error("사용자 추가 실패");
      const data = await res.json();
      setMessage(data.message);
      setNewUsername("");
      fetchUsers(0);
      fetchIndexStructure(selectedIndex, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 사용자 삭제
  const deleteUser = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("사용자 삭제 실패");
      fetchUsers(userPage);
      fetchIndexStructure(selectedIndex, true);
      setMessage("사용자가 삭제되었습니다");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 대량 삽입
  const bulkInsert = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/users/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: parseInt(bulkCount),
          prefix: bulkPrefix,
        }),
      });
      if (!res.ok) throw new Error("대량 삽입 실패");
      const data = await res.json();
      setMessage(data.message);
      fetchUsers(0);
      fetchIndexStructure(selectedIndex, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 테이블 초기화
  const resetTable = async () => {
    if (!confirm("테이블을 초기화하시겠습니까? 모든 데이터가 삭제되고 1000개로 재생성됩니다.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/reset`, { method: "POST" });
      if (!res.ok) throw new Error("초기화 실패");
      const data = await res.json();
      setMessage(data.message);
      setPrevStructure(null);
      fetchUsers(0);
      fetchIndexStructure(selectedIndex);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 쿼리 실행 계획
  const explainQuery = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("쿼리 분석 실패");
      const data = await res.json();
      setExplainResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 공간 검색
  const spatialSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/spatial/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          longitude: parseFloat(searchLng),
          latitude: parseFloat(searchLat),
          radiusMeters: parseFloat(searchRadius),
        }),
      });
      if (!res.ok) throw new Error("공간 검색 실패");
      const data = await res.json();
      setSpatialResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexes();
    fetchUsers(0);
    fetchIndexStructure("idx_users_username");
  }, []);

  // 자동 메시지 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // 인덱스 구조 시각화
  const renderIndexTree = (structure: IndexStructure | null, isCompare = false) => {
    if (!structure || !structure.pages) return null;

    const pagesByLevel: Record<number, IndexPage[]> = {};
    structure.pages.forEach((page) => {
      if (!pagesByLevel[page.level]) pagesByLevel[page.level] = [];
      pagesByLevel[page.level].push(page);
    });

    const levels = Object.keys(pagesByLevel).map(Number).sort((a, b) => b - a);

    return (
      <div className={`space-y-4 ${isCompare ? "opacity-60" : ""}`}>
        {isCompare && (
          <div className="text-xs text-muted-foreground text-center">이전 상태</div>
        )}
        <div className="text-center text-sm">
          <span className="font-medium">{structure.indexName}</span>
          <span className="text-muted-foreground ml-2">
            높이: {structure.treeLevel + 1} | 페이지: {structure.totalPages}
          </span>
        </div>
        {levels.map((level, levelIdx) => (
          <div key={level} className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant={level === structure.treeLevel ? "default" : level === 0 ? "secondary" : "outline"} className="text-xs">
                Level {level}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {level === structure.treeLevel ? "루트" : level === 0 ? "리프" : "내부"}
                {" · "}{pagesByLevel[level].length}개 페이지
              </span>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {pagesByLevel[level].map((page) => (
                <div
                  key={page.blockNo}
                  className={`
                    rounded-lg border-2 shadow-sm p-2 min-w-[140px] max-w-[200px]
                    ${page.isLeaf
                      ? "bg-green-50 dark:bg-green-900/20 border-green-400"
                      : level === structure.treeLevel
                        ? "bg-purple-50 dark:bg-purple-900/20 border-purple-400"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-400"
                    }
                  `}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium">P{page.blockNo}</span>
                    <span className="text-muted-foreground">{page.liveItems}개</span>
                  </div>
                  <div className="space-y-0.5">
                    {page.keys.slice(0, 3).map((key, idx) => (
                      <div key={idx} className="text-xs font-mono truncate px-1 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                        {decodeHexKey(key)}
                      </div>
                    ))}
                    {page.keys.length > 3 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{page.keys.length - 3}
                      </div>
                    )}
                  </div>
                  {!page.isLeaf && page.childBlocks.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-dashed text-xs text-muted-foreground">
                      → {page.childBlocks.map(c => `P${c}`).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {levelIdx < levels.length - 1 && (
              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            인덱스 구조 실습 (PostgreSQL)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetTable} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-1" />
              초기화
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fetchIndexStructure(selectedIndex)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 에러/메시지 */}
        {error && (
          <div className="p-2 bg-destructive/10 text-destructive rounded flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6">닫기</Button>
          </div>
        )}
        {message && (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            {message}
          </div>
        )}

        <Tabs defaultValue="lab">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lab">실습</TabsTrigger>
            <TabsTrigger value="structure">구조 보기</TabsTrigger>
            <TabsTrigger value="query">쿼리 분석</TabsTrigger>
            <TabsTrigger value="spatial">공간 검색</TabsTrigger>
          </TabsList>

          {/* 실습 탭 */}
          <TabsContent value="lab" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* 데이터 조작 */}
              <div className="space-y-3">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  데이터 조작
                </div>

                {/* 단건 추가 */}
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="text-xs font-medium">사용자 추가</div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="age"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      className="w-16"
                    />
                    <Button onClick={insertUser} disabled={loading || !newUsername} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 대량 추가 */}
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg space-y-2">
                  <div className="text-xs font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    대량 삽입 (페이지 분할 관찰)
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="prefix"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-xs self-center text-muted-foreground">개</span>
                    <Button onClick={bulkInsert} disabled={loading} size="sm" variant="secondary">
                      실행
                    </Button>
                  </div>
                </div>

                {/* 현재 데이터 */}
                <div className="border rounded-lg">
                  <div className="px-3 py-2 bg-muted/30 border-b text-xs font-medium flex justify-between">
                    <span>데이터 ({totalUsers}건)</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-5 px-2" onClick={() => fetchUsers(Math.max(0, userPage - 1))} disabled={userPage === 0}>
                        ←
                      </Button>
                      <span>{userPage + 1}</span>
                      <Button variant="ghost" size="sm" className="h-5 px-2" onClick={() => fetchUsers(userPage + 1)} disabled={users.length < 10}>
                        →
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} className="text-xs">
                            <TableCell className="py-1 font-mono">{u.id}</TableCell>
                            <TableCell className="py-1">{u.username}</TableCell>
                            <TableCell className="py-1">{u.age}</TableCell>
                            <TableCell className="py-1 w-8">
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteUser(u.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* 인덱스 구조 미니뷰 */}
              <div className="space-y-3">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  인덱스 구조
                  <Select value={selectedIndex} onValueChange={(v) => { setSelectedIndex(v); fetchIndexStructure(v); }}>
                    <SelectTrigger className="w-[180px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {indexes.map((idx) => (
                        <SelectItem key={idx.indexName} value={idx.indexName} className="text-xs">
                          {idx.indexName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg min-h-[280px] overflow-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : indexStructure?.error ? (
                    <div className="text-sm text-destructive">{indexStructure.error}</div>
                  ) : (
                    renderIndexTree(indexStructure)
                  )}
                </div>

                {/* 변화 비교 */}
                {prevStructure && indexStructure && prevStructure.totalPages !== indexStructure.totalPages && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                    <span className="font-medium">변화 감지!</span> 페이지: {prevStructure.totalPages} → {indexStructure.totalPages}
                  </div>
                )}

                {/* 범례 */}
                <div className="flex gap-3 text-xs text-muted-foreground justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded border-2 border-purple-400 bg-purple-50"></div>
                    <span>루트</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded border-2 border-blue-400 bg-blue-50"></div>
                    <span>내부</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded border-2 border-green-400 bg-green-50"></div>
                    <span>리프</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 구조 보기 탭 */}
          <TabsContent value="structure" className="space-y-4">
            <div className="flex gap-3 items-center">
              <Select value={selectedIndex} onValueChange={(v) => { setSelectedIndex(v); fetchIndexStructure(v); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="인덱스 선택" />
                </SelectTrigger>
                <SelectContent>
                  {indexes.map((idx) => (
                    <SelectItem key={idx.indexName} value={idx.indexName}>
                      {idx.indexName} ({idx.indexType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => fetchIndexStructure(selectedIndex)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* 인덱스 목록 */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>인덱스명</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>컬럼</TableHead>
                    <TableHead>크기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indexes.map((idx) => (
                    <TableRow key={idx.indexName} className={selectedIndex === idx.indexName ? "bg-muted" : ""}>
                      <TableCell className="font-mono text-sm">
                        {idx.indexName}
                        {idx.primary && <Badge className="ml-2 text-xs">PK</Badge>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{idx.indexType}</Badge></TableCell>
                      <TableCell className="text-sm">{idx.columns}</TableCell>
                      <TableCell className="text-sm">{idx.indexSize}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* B-Tree 구조 전체 뷰 */}
            {indexStructure && (
              <div className="p-4 bg-muted/30 rounded-lg overflow-x-auto">
                {indexStructure.error ? (
                  <div className="text-sm text-destructive">{indexStructure.error}</div>
                ) : (
                  renderIndexTree(indexStructure)
                )}
              </div>
            )}
          </TabsContent>

          {/* 쿼리 분석 탭 */}
          <TabsContent value="query" className="space-y-4">
            <div className="space-y-2">
              <textarea
                className="w-full p-3 border rounded-lg font-mono text-sm min-h-[80px] bg-background"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM index_lab_users WHERE ..."
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={explainQuery} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  EXPLAIN ANALYZE
                </Button>
                {[
                  "SELECT * FROM index_lab_users WHERE username = 'user_100'",
                  "SELECT * FROM index_lab_users WHERE age > 30",
                  "SELECT * FROM index_lab_users WHERE email LIKE '%500%'",
                ].map((q, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => setQuery(q)} className="text-xs">
                    {q.length > 40 ? q.substring(0, 40) + "..." : q}
                  </Button>
                ))}
              </div>
            </div>

            {explainResult && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {explainResult.usesIndex ? (
                    <Badge className="gap-1"><CheckCircle className="h-3 w-3" />인덱스 사용</Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />인덱스 미사용</Badge>
                  )}
                  {explainResult.usesSeqScan && <Badge variant="secondary">Sequential Scan</Badge>}
                </div>
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-[300px]">
                  {explainResult.plan}
                </pre>
              </div>
            )}
          </TabsContent>

          {/* 공간 검색 탭 */}
          <TabsContent value="spatial" className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">반경 검색 (PostGIS + GiST 인덱스)</span>
              </div>
              <div className="flex gap-3 flex-wrap items-end">
                <div className="space-y-1">
                  <label className="text-xs">경도</label>
                  <Input type="number" step="0.0001" value={searchLng} onChange={(e) => setSearchLng(e.target.value)} className="w-[100px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">위도</label>
                  <Input type="number" step="0.0001" value={searchLat} onChange={(e) => setSearchLat(e.target.value)} className="w-[100px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">반경 (m)</label>
                  <Input type="number" value={searchRadius} onChange={(e) => setSearchRadius(e.target.value)} className="w-[80px]" />
                </div>
                <Button onClick={spatialSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-1" />검색
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">서울 중심: 경도 127.0, 위도 37.5</div>
            </div>

            {/* 2D 시각화 맵 */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* 지도 시각화 */}
              <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 aspect-square overflow-hidden">
                {/* 그리드 라인 */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="border border-blue-100 dark:border-blue-900/50" />
                  ))}
                </div>

                {/* 검색 반경 원 */}
                <div
                  className="absolute rounded-full border-2 border-blue-400 bg-blue-200/30 dark:bg-blue-500/20"
                  style={{
                    width: `${Math.min(80, parseFloat(searchRadius) / 50)}%`,
                    height: `${Math.min(80, parseFloat(searchRadius) / 50)}%`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />

                {/* 검색 중심점 */}
                <div
                  className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg z-20"
                  style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium bg-red-500 text-white px-1 rounded whitespace-nowrap">
                    검색 중심
                  </div>
                </div>

                {/* 검색 결과 마커들 */}
                {spatialResults.map((r, idx) => {
                  // 중심점 기준 상대 위치 계산 (스케일 조정)
                  const centerLng = parseFloat(searchLng);
                  const centerLat = parseFloat(searchLat);
                  const scale = 3000; // 미터당 픽셀 비율
                  const relX = ((r.longitude - centerLng) * 111000) / scale * 40 + 50; // %
                  const relY = ((centerLat - r.latitude) * 111000) / scale * 40 + 50; // %

                  const colors: Record<string, string> = {
                    "관광": "bg-purple-500",
                    "교통": "bg-yellow-500",
                    "문화": "bg-pink-500",
                    "공원": "bg-green-500",
                  };

                  return (
                    <div
                      key={r.id}
                      className={`absolute w-3 h-3 ${colors[r.category] || "bg-gray-500"} rounded-full border border-white shadow z-10 cursor-pointer hover:scale-150 transition-transform`}
                      style={{
                        left: `${Math.max(5, Math.min(95, relX))}%`,
                        top: `${Math.max(5, Math.min(95, relY))}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      title={`${r.name} (${Math.round(r.distanceMeters)}m)`}
                    >
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-black/70 text-white px-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                        {r.name}
                      </div>
                    </div>
                  );
                })}

                {/* 축 레이블 */}
                <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">경도 →</div>
                <div className="absolute top-2 left-1 text-[10px] text-muted-foreground rotate-[-90deg] origin-left">위도 ↑</div>

                {/* 결과 없을 때 */}
                {spatialResults.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    검색 버튼을 눌러주세요
                  </div>
                )}
              </div>

              {/* 결과 목록 */}
              <div className="space-y-3">
                <div className="text-sm font-medium">검색 결과 ({spatialResults.length}개)</div>

                {/* 범례 */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>관광</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>교통</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-500"></div>문화</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>공원</div>
                </div>

                {spatialResults.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">장소</TableHead>
                          <TableHead className="text-xs">거리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spatialResults.map((r) => (
                          <TableRow key={r.id} className="text-xs">
                            <TableCell>
                              <div className="font-medium">{r.name}</div>
                              <Badge variant="outline" className="text-[10px] mt-0.5">{r.category}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">{Math.round(r.distanceMeters)}m</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                    반경 내 장소가 표시됩니다
                  </div>
                )}

                {/* GiST 인덱스 설명 */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs space-y-1">
                  <div className="font-medium text-green-700 dark:text-green-300">GiST 인덱스 동작 원리</div>
                  <p className="text-muted-foreground">
                    공간을 <strong>바운딩 박스(MBR)</strong>로 분할하여 계층적으로 저장합니다.
                    검색 시 MBR과 겹치는 영역만 탐색하여 효율적인 공간 검색이 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
