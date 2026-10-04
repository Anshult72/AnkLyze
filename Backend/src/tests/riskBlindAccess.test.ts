process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import { RoundStatus } from '@prisma/client';
import { RiskRepository } from '../repositories/risk.repository';
import { RiskService } from '../services/risk.service';
import { RiskController } from '../controllers/risk.controller';
import { prisma } from '../config/database';

const originalRounds = RiskRepository.getEvaluationRounds;
const originalResult = RiskRepository.getDoubleEvaluationResult;
const originalRound = RiskRepository.getEvaluationRoundById;
const originalFindAttempt = prisma.questionAttempt.findUnique;
const originalFindAssignments = prisma.examinerAssignment.findMany;

const rounds = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    questionAttemptId: '33333333-3333-4333-8333-333333333333',
    roundNumber: 1,
    evaluatorUserId: 'first-examiner',
    evaluatorUser: { fullName: 'First Examiner' },
    evaluation: { examinerMarks: 3, examinerNotes: 'Private first decision' },
    status: RoundStatus.COMPLETED,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    questionAttemptId: '33333333-3333-4333-8333-333333333333',
    roundNumber: 2,
    evaluatorUserId: 'second-examiner',
    status: RoundStatus.IN_PROGRESS,
  },
];

async function run() {
  try {
    (RiskRepository.getEvaluationRounds as any) = async () => rounds;
    (RiskRepository.getDoubleEvaluationResult as any) = async () => ({ round1Marks: 3, round2Marks: 0 });
    (RiskRepository.getEvaluationRoundById as any) = async (id: string) => rounds.find((round) => round.id === id) ?? null;

    const blind = await RiskService.getEvaluationRoundsForAttempt({
      questionAttemptId: rounds[0].questionAttemptId,
      callerUserId: 'second-examiner',
      callerRole: 'HEAD_EXAMINER',
    });
    assert.equal(blind.isRedacted, true);
    assert.deepEqual(blind.rounds.map((round) => round.roundNumber), [2]);
    assert.equal(blind.doubleEvaluationResult, null);
    assert.equal(JSON.stringify(blind).includes('Private first decision'), false);

    await assert.rejects(
      RiskService.getEvaluationRoundsForAttempt({
        questionAttemptId: rounds[0].questionAttemptId,
        callerUserId: 'unassigned-examiner',
        callerRole: 'EXAMINER',
      }),
      /EVALUATION_ROUND_ACCESS_DENIED/
    );

    const response = () => {
      const result: any = { statusCode: 200, body: null };
      result.status = (code: number) => { result.statusCode = code; return result; };
      result.json = (body: unknown) => { result.body = body; return result; };
      return result;
    };
    const firstResponse = response();
    await RiskController.getEvaluationRoundById({
      params: { id: rounds[0].id },
      user: { id: 'second-examiner', role: 'EXAMINER' },
    } as any, firstResponse);
    assert.equal(firstResponse.statusCode, 403);
    assert.equal(JSON.stringify(firstResponse.body).includes('Private first decision'), false);

    const ownResponse = response();
    await RiskController.getEvaluationRoundById({
      params: { id: rounds[1].id },
      user: { id: 'second-examiner', role: 'EXAMINER' },
    } as any, ownResponse);
    assert.equal(ownResponse.statusCode, 200);
    assert.equal(ownResponse.body.data.id, rounds[1].id);

    let assignmentWhere: any;
    (prisma.questionAttempt.findUnique as any) = async () => ({
      question: { subjectId: 'social-science' },
      script: { subjectId: 'social-science', examId: 'class-10' },
      evaluationRounds: [],
    });
    (prisma.examinerAssignment.findMany as any) = async ({ where }: any) => {
      assignmentWhere = where;
      return [
        { examiner: { id: 'valid', fullName: 'Valid', email: 'valid@example.test', department: null, status: 'ACTIVE', role: { name: 'EXAMINER' }, assignedEvaluationRounds: [] } },
        { examiner: { id: 'admin', fullName: 'Admin', email: 'admin@example.test', department: null, status: 'ACTIVE', role: { name: 'SUPER_ADMIN' }, assignedEvaluationRounds: [] } },
      ];
    };
    const eligible = await RiskService.findEligibleSecondExaminers({ questionAttemptId: rounds[0].questionAttemptId });
    assert.equal(assignmentWhere.subjectId, 'social-science');
    assert.equal(assignmentWhere.OR.some((clause: any) => clause.examId === 'class-10'), true);
    assert.deepEqual(eligible.map((examiner) => examiner.id), ['valid']);
    console.log('Blind Round 2 list and direct endpoint access: PASS');
  } finally {
    (RiskRepository.getEvaluationRounds as any) = originalRounds;
    (RiskRepository.getDoubleEvaluationResult as any) = originalResult;
    (RiskRepository.getEvaluationRoundById as any) = originalRound;
    (prisma.questionAttempt.findUnique as any) = originalFindAttempt;
    (prisma.examinerAssignment.findMany as any) = originalFindAssignments;
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
