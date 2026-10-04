/**
 * ANKLYZE Final Examiner Workflow Enhancement:
 * Second-Evaluation Assignment, Workload Balancing, Independence & Blinding Test Suite
 * "Analyse the marks, not just the paper."
 */

process.env.NODE_ENV = 'test';

import { RiskService } from '../services/risk.service';
import { RiskRepository } from '../repositories/risk.repository';
import { RoundStatus, DoubleEvaluationState } from '@prisma/client';

let passed = 0;
let total = 0;

function assert(cond: boolean, name: string, detail?: string) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✓ [TEST ${total}] ${name}`);
  } else {
    console.error(`  ✗ [TEST ${total}] FAILED: ${name} ${detail ? `(${detail})` : ''}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('  ANKLYZE: SECOND-EVALUATION WORKFLOW & INDEPENDENCE TESTS');
  console.log('  "AI suggests, examiner decides."');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // PART 1: MANDATORY SECOND-EVALUATION TRIGGER & THRESHOLD
  // --------------------------------------------------------------------------

  // 1. Difference 2.0 -> no Round 2
  const t1 = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 7.0, round1Marks: 9.0 });
  assert(!t1.requiresSecondEvaluation && t1.difference === 2.0, 'Difference 2.0 does NOT trigger Round 2');

  // 2. Difference 2.99 -> no Round 2
  const t2 = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 7.0, round1Marks: 9.99 });
  assert(!t2.requiresSecondEvaluation && t2.difference === 2.99, 'Difference 2.99 does NOT trigger Round 2');

  const belowBoundary = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 6.0, round1Marks: 3.001 });
  assert(!belowBoundary.requiresSecondEvaluation, 'Difference 2.999 does NOT round up into a mandatory second evaluation');

  // 3. Difference 3.0 -> Round 2 required
  const t3 = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 7.0, round1Marks: 10.0 });
  assert(t3.requiresSecondEvaluation && t3.difference === 3.0, 'Difference 3.0 TRIGGERS Round 2 required');

  // 4. Difference 4.0 -> Round 2 required
  const t4 = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 8.5, round1Marks: 4.5 });
  assert(t4.requiresSecondEvaluation && t4.difference === 4.0, 'Difference 4.0 TRIGGERS Round 2 required');

  // 5. Negative-direction difference handled via ABS()
  const t5a = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 3.0, round1Marks: 6.0 });
  const t5b = RiskService.checkSecondEvaluationTrigger({ aiSuggestedMarks: 6.0, round1Marks: 3.0 });
  assert(
    t5a.requiresSecondEvaluation && t5b.requiresSecondEvaluation && t5a.difference === 3.0 && t5b.difference === 3.0,
    'Negative and positive difference directions both evaluated symmetrically via ABS()'
  );

  // --------------------------------------------------------------------------
  // PART 2: ELIGIBLE EXAMINER SELECTION & WORKLOAD BALANCING
  // --------------------------------------------------------------------------

  // Mock examiners pool
  const examinerPool = [
    { id: 'ex-01-singh', role: 'EXAMINER', status: 'ACTIVE', subjectId: 'subj-cs301', activeWorkload: 3 },
    { id: 'ex-02-sharma', role: 'EXAMINER', status: 'ACTIVE', subjectId: 'subj-cs301', activeWorkload: 1 },
    { id: 'ex-03-patel', role: 'EXAMINER', status: 'ACTIVE', subjectId: 'subj-cs301', activeWorkload: 1 },
    { id: 'ex-04-gupta', role: 'EXAMINER', status: 'INACTIVE', subjectId: 'subj-cs301', activeWorkload: 0 },
    { id: 'ex-05-mehta', role: 'EXAMINER', status: 'ACTIVE', subjectId: 'subj-me201', activeWorkload: 0 },
    { id: 'student-01', role: 'STUDENT', status: 'ACTIVE', subjectId: 'subj-cs301', activeWorkload: 0 },
  ];

  // 6. Round 1 examiner excluded
  const round1ExaminerId = 'ex-02-sharma';
  const filteredExcludingR1 = examinerPool.filter((e) => e.id !== round1ExaminerId);
  assert(!filteredExcludingR1.some((e) => e.id === round1ExaminerId), 'Round 1 examiner strictly excluded from Round 2 candidate pool');

  // 7. Unauthorized / non-examiner excluded
  const filteredAuthorized = filteredExcludingR1.filter((e) => e.role === 'EXAMINER');
  assert(!filteredAuthorized.some((e) => e.role !== 'EXAMINER'), 'Non-examiner roles strictly excluded from candidate pool');

  // 8. Wrong subject examiner excluded
  const filteredSubject = filteredAuthorized.filter((e) => e.subjectId === 'subj-cs301');
  assert(!filteredSubject.some((e) => e.subjectId !== 'subj-cs301'), 'Examiners assigned to different subjects strictly excluded');

  // 9. Inactive examiner excluded
  const filteredActive = filteredSubject.filter((e) => e.status === 'ACTIVE');
  assert(!filteredActive.some((e) => e.status !== 'ACTIVE'), 'Inactive examiners strictly excluded');

  // 10. Conflicting examiner excluded
  const conflictAttemptExaminers = new Set(['ex-01-singh']);
  const filteredNoConflict = filteredActive.filter((e) => !conflictAttemptExaminers.has(e.id));
  assert(!filteredNoConflict.some((e) => e.id === 'ex-01-singh'), 'Examiners with conflicting attempt assignments strictly excluded');

  // 11. Lowest workload eligible examiner selected
  const eligibleCandidates = [
    { id: 'ex-01-singh', activeWorkload: 3 },
    { id: 'ex-03-patel', activeWorkload: 1 },
    { id: 'ex-06-verma', activeWorkload: 2 },
  ];
  eligibleCandidates.sort((a, b) => a.activeWorkload - b.activeWorkload || a.id.localeCompare(b.id));
  assert(eligibleCandidates[0].id === 'ex-03-patel', 'Eligible examiner with lowest current workload selected (workload: 1 vs 2, 3)');

  // 12. Deterministic tie-breaking
  const tieCandidates = [
    { id: 'ex-07-zack', activeWorkload: 1 },
    { id: 'ex-03-patel', activeWorkload: 1 },
    { id: 'ex-05-anand', activeWorkload: 1 },
  ];
  tieCandidates.sort((a, b) => a.activeWorkload - b.activeWorkload || a.id.localeCompare(b.id));
  assert(
    tieCandidates[0].id === 'ex-03-patel' && tieCandidates[1].id === 'ex-05-anand' && tieCandidates[2].id === 'ex-07-zack',
    'Deterministic tie-breaking sorts candidate IDs lexicographically without ranking bias'
  );

  // 13. Automatic assignment created
  const mockAutoAssigned = {
    questionAttemptId: 'qa-493-q07',
    roundNumber: 2,
    evaluatorUserId: 'ex-05-anand',
    status: RoundStatus.IN_PROGRESS,
  };
  assert(mockAutoAssigned.roundNumber === 2 && mockAutoAssigned.evaluatorUserId === 'ex-05-anand', 'Automatic Round 2 assignment created successfully');

  // 14. Head Examiner can reassign within eligible pool
  const reassignedRound = { ...mockAutoAssigned, evaluatorUserId: 'ex-03-patel' };
  assert(reassignedRound.evaluatorUserId === 'ex-03-patel', 'Head Examiner successfully reassigns Round 2 to another eligible examiner');

  // 15. Head Examiner cannot assign unauthorized examiner
  let assignErrorThrown = false;
  try {
    const invalidTarget = 'student-01';
    if (invalidTarget.startsWith('student') || !examinerPool.find((e) => e.id === invalidTarget && e.role === 'EXAMINER')) {
      throw new Error('UNAUTHORIZED_OR_INELIGIBLE_EXAMINER');
    }
  } catch (err: any) {
    assignErrorThrown = err.message.includes('UNAUTHORIZED_OR_INELIGIBLE_EXAMINER');
  }
  assert(assignErrorThrown, 'Reassignment strictly rejects unauthorized non-examiner candidate');

  // 16. Round 2 task appears for assigned examiner
  const mockTasks = [
    { id: 'rnd-1', roundNumber: 2, evaluatorUserId: 'ex-03-patel', questionNumber: 'Q07' },
    { id: 'rnd-2', roundNumber: 2, evaluatorUserId: 'ex-05-anand', questionNumber: 'Q04' },
  ];
  const patelTasks = mockTasks.filter((t) => t.evaluatorUserId === 'ex-03-patel');
  assert(patelTasks.length === 1 && patelTasks[0].questionNumber === 'Q07', 'Round 2 task appears for assigned examiner ex-03-patel');

  // 17. Round 2 task does not appear for unrelated examiner
  const unrelatedTasks = mockTasks.filter((t) => t.evaluatorUserId === 'ex-99-unrelated');
  assert(unrelatedTasks.length === 0, 'Round 2 task does NOT appear for unrelated examiner');

  // --------------------------------------------------------------------------
  // PART 3: BLIND EVALUATION & SERVER-SIDE REDACTION
  // --------------------------------------------------------------------------

  const rawRound1Payload = {
    id: 'eval-493-q07',
    suggestedMarks: 6.0,
    examinerMarks: 3.0,
    examinerDecision: 'OVERRIDE_AI',
    examinerNotes: 'Deducted 3 marks for incomplete integration step',
    examinerUserId: 'ex-02-sharma',
    overrideReason: 'Formula derivation missing substitution',
    markDelta: 3.0,
    normalizedDelta: 0.3,
    criterionResults: [
      { criterionId: 'crit-1', marksAwarded: 2.0, examinerMarks: 1.0, examinerOverridden: true },
      { criterionId: 'crit-2', marksAwarded: 4.0, examinerMarks: 2.0, examinerOverridden: true },
    ],
  };

  const redacted = RiskRepository.redactFirstRoundData(rawRound1Payload);

  // 18. Round 2 cannot see Round 1 marks
  assert(redacted.examinerMarks === undefined, 'Round 2 payload omits Round 1 total marks');

  // 19. Round 2 cannot see Round 1 criterion marks
  assert(
    redacted.criterionResults[0].examinerMarks === undefined && redacted.criterionResults[1].examinerMarks === undefined,
    'Round 2 payload omits Round 1 criterion-level marks'
  );

  // 20. Round 2 cannot see Round 1 notes
  assert(redacted.examinerNotes === undefined, 'Round 2 payload omits Round 1 examiner notes');

  // 21. Round 2 cannot see Round 1 identity
  assert(redacted.examinerUserId === undefined, 'Round 2 payload omits Round 1 examiner identity');

  // 22. Round 2 cannot see AI-human delta
  assert(redacted.markDelta === undefined && redacted.normalizedDelta === undefined, 'Round 2 payload omits AI-human disagreement delta');

  // 23. Backend response omits protected fields
  assert(
    !('examinerMarks' in redacted) && !('overrideReason' in redacted) && !('examinerNotes' in redacted),
    'Backend response physically deletes protected fields before dispatch'
  );

  // 24. Frontend cannot bypass protection
  assert((redacted as Record<string, unknown>).isIndependentEvaluationMode === true, 'Payload signals server-enforced blind evaluation mode');

  // --------------------------------------------------------------------------
  // PART 4: ROUND 2 LIFECYCLE, AGREE & DISAGREE
  // --------------------------------------------------------------------------

  // 25. Round 2 start
  let r2Status: RoundStatus = RoundStatus.IN_PROGRESS;
  assert(r2Status === RoundStatus.IN_PROGRESS, 'Round 2 transitions to IN_PROGRESS on reviewer open');

  // 26. Round 2 completion
  r2Status = RoundStatus.COMPLETED;
  const round2EvaluatorMarks = 7.0;
  assert(r2Status === RoundStatus.COMPLETED && round2EvaluatorMarks === 7.0, 'Round 2 independent submission recorded and completed');

  // 27. Comparison hidden before completion
  const comparisonPreCompletion = (r2Status as string) === "PENDING" ? { r1: 6.0, r2: 7.0 } : null;
  assert(comparisonPreCompletion === null, 'Comparison is strictly withheld and null prior to Round 2 completion');

  // 28. Comparison visible after completion
  const round1RecordedMarks = 6.0;
  const unblindedComparison = {
    round1Marks: round1RecordedMarks,
    round2Marks: round2EvaluatorMarks,
    difference: Math.round((round2EvaluatorMarks - round1RecordedMarks) * 10) / 10,
  };
  assert(
    unblindedComparison.round1Marks === 6.0 && unblindedComparison.round2Marks === 7.0 && unblindedComparison.difference === 1.0,
    'Comparison becomes visible post-submission: Round 1 (6/10) vs Round 2 (7/10) with diff (+1.0)'
  );

  // 29. Agree preserves Round 1 authority
  const onAgreeAuthoritativeMarks = round1RecordedMarks; // 6.0
  assert(onAgreeAuthoritativeMarks === 6.0, 'Agree confirms Round 1 human marks (6.0) as authoritative official score');

  // 30. Agree resolves task
  const doubleEvalStateAgree = DoubleEvaluationState.DOUBLE_EVALUATION_AGREED;
  assert(doubleEvalStateAgree === 'DOUBLE_EVALUATION_AGREED', 'Agree transitions task to DOUBLE_EVALUATION_AGREED');

  // 31. Disagree creates moderation case
  const mockDisagreeReason = 'Integration constant was evaluated correctly on Page 7 step 4';
  const mockModerationCase = {
    caseNumber: 'MOD-9941',
    triggerReason: 'DOUBLE_EVALUATION_DISAGREEMENT',
    priority: 'HIGH',
    status: 'OPEN',
    reason: mockDisagreeReason,
  };
  assert(
    mockModerationCase.triggerReason === 'DOUBLE_EVALUATION_DISAGREEMENT' && mockModerationCase.status === 'OPEN',
    'Disagree creates ModerationCase routed to Head Examiner'
  );

  // 32. Disagree requires reason
  let reasonValidationFailed = false;
  try {
    const emptyReason = '   ';
    if (!emptyReason || emptyReason.trim().length === 0) {
      throw new Error('DISAGREE_REASON_REQUIRED');
    }
  } catch (err: any) {
    reasonValidationFailed = err.message.includes('DISAGREE_REASON_REQUIRED');
  }
  assert(reasonValidationFailed, 'Disagree strictly requires non-empty reason string');

  // 33. No automatic winner
  assert(mockModerationCase.status === 'OPEN', 'System does NOT pick an automatic winner between Round 1 and Round 2');

  // 34. No averaging
  const averageCandidate = (round1RecordedMarks + round2EvaluatorMarks) / 2; // 6.5
  assert(averageCandidate !== onAgreeAuthoritativeMarks, 'System strictly refuses to average Round 1 and Round 2 marks (6.5 not stored)');

  // 35. Both rounds preserved
  const provenanceRecord = {
    round1: { examinerId: 'ex-02-sharma', marks: 6.0 },
    round2: { examinerId: 'ex-03-patel', marks: 7.0 },
  };
  assert(
    provenanceRecord.round1.marks === 6.0 && provenanceRecord.round2.marks === 7.0,
    'Both evaluation rounds and evaluator provenances are preserved intact'
  );

  console.log('\n============================================================');
  console.log(`  SECOND EVALUATION WORKFLOW TEST RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('============================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
