package com.studyblog.lab.database;

import com.studyblog.session.LabSession;
import com.studyblog.session.LabSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class IsolationLabService {

    private final LabSessionRepository sessionRepository;

    @Transactional
    public Map<String, Object> createSession(IsolationLabRequest request) {
        LabSession session = LabSession.builder()
                .labType("ISOLATION")
                .labCategory("database")
                .config(Map.of(
                        "isolationLevel", request.getIsolationLevel(),
                        "dbType", request.getDbType(),
                        "scenario", request.getScenario()
                ))
                .state(initializeState(request.getScenario()))
                .build();

        session = sessionRepository.save(session);

        return Map.of(
                "sessionId", session.getId(),
                "config", session.getConfig(),
                "state", session.getState(),
                "steps", getScenarioSteps(request.getScenario())
        );
    }

    public Map<String, Object> executeStep(UUID sessionId, StepRequest request) {
        LabSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Execute step logic based on scenario
        Map<String, Object> result = executeStepLogic(session, request);

        // Update session state
        Map<String, Object> newState = new HashMap<>(session.getState());
        newState.put("lastStep", request.getStep());
        newState.put("lastTransaction", request.getTransaction());
        session.setState(newState);
        sessionRepository.save(session);

        return result;
    }

    public Map<String, Object> getState(UUID sessionId) {
        LabSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        return Map.of(
                "sessionId", session.getId(),
                "config", session.getConfig(),
                "state", session.getState()
        );
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    private Map<String, Object> initializeState(String scenario) {
        return Map.of(
                "txAState", "IDLE",
                "txBState", "IDLE",
                "currentStep", 0,
                "data", List.of(
                        Map.of("id", 1, "name", "Alice", "balance", 1000)
                ),
                "txAReadValue", null,
                "txBReadValue", null,
                "anomalyDetected", null
        );
    }

    private List<Map<String, Object>> getScenarioSteps(String scenario) {
        return switch (scenario) {
            case "DIRTY_READ" -> List.of(
                    Map.of("txA", "BEGIN", "txB", null, "description", "Transaction A 시작"),
                    Map.of("txA", null, "txB", "BEGIN", "description", "Transaction B 시작"),
                    Map.of("txA", "SELECT", "txB", null, "description", "A가 데이터 조회"),
                    Map.of("txA", null, "txB", "UPDATE", "description", "B가 데이터 수정 (커밋 전)"),
                    Map.of("txA", "SELECT", "txB", null, "description", "A가 다시 조회 (Dirty Read?)"),
                    Map.of("txA", null, "txB", "ROLLBACK", "description", "B가 롤백"),
                    Map.of("txA", "COMMIT", "txB", null, "description", "A 커밋")
            );
            case "NON_REPEATABLE_READ" -> List.of(
                    Map.of("txA", "BEGIN", "txB", null, "description", "Transaction A 시작"),
                    Map.of("txA", "SELECT", "txB", null, "description", "A가 데이터 조회"),
                    Map.of("txA", null, "txB", "BEGIN", "description", "Transaction B 시작"),
                    Map.of("txA", null, "txB", "UPDATE", "description", "B가 데이터 수정"),
                    Map.of("txA", null, "txB", "COMMIT", "description", "B 커밋"),
                    Map.of("txA", "SELECT", "txB", null, "description", "A가 다시 조회 (다른 값?)"),
                    Map.of("txA", "COMMIT", "txB", null, "description", "A 커밋")
            );
            case "PHANTOM_READ" -> List.of(
                    Map.of("txA", "BEGIN", "txB", null, "description", "Transaction A 시작"),
                    Map.of("txA", "SELECT_COUNT", "txB", null, "description", "A가 행 수 조회"),
                    Map.of("txA", null, "txB", "BEGIN", "description", "Transaction B 시작"),
                    Map.of("txA", null, "txB", "INSERT", "description", "B가 새 행 삽입"),
                    Map.of("txA", null, "txB", "COMMIT", "description", "B 커밋"),
                    Map.of("txA", "SELECT_COUNT", "txB", null, "description", "A가 다시 조회 (행 수 변경?)"),
                    Map.of("txA", "COMMIT", "txB", null, "description", "A 커밋")
            );
            default -> List.of();
        };
    }

    private Map<String, Object> executeStepLogic(LabSession session, StepRequest request) {
        // Simplified step execution logic
        // In real implementation, this would execute actual SQL with proper isolation levels
        String scenario = (String) session.getConfig().get("scenario");
        String isolationLevel = (String) session.getConfig().get("isolationLevel");

        Map<String, Object> result = new HashMap<>();
        result.put("step", request.getStep());
        result.put("transaction", request.getTransaction());
        result.put("success", true);

        // Simulate anomaly detection based on isolation level
        if (request.getStep() == 4 && scenario.equals("DIRTY_READ")) {
            if (isolationLevel.equals("READ_UNCOMMITTED")) {
                result.put("anomalyDetected", "DIRTY_READ");
                result.put("message", "커밋되지 않은 데이터를 읽었습니다!");
                result.put("readValue", 1500); // B가 수정한 값
            } else {
                result.put("anomalyDetected", null);
                result.put("message", "격리 수준에 의해 보호됨");
                result.put("readValue", 1000); // 원래 값
            }
        }

        return result;
    }
}
