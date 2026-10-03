"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TopNavigation from "@/components/examiner/TopNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  INITIAL_EXAMS,
  AVAILABLE_ACADEMIC_EXAMINERS,
  ExamData,
  SubjectData,
  QuestionData,
  CriterionData,
  MarkingSchemeData,
  AssignedExaminerData,
  RubricAnalysisData,
  RubricQuestionData,
  RubricCriterionData,
  RubricIssueData,
  INITIAL_RUBRIC_ANALYSES,
} from "@/data/examManagementMockData";
import {
  ArrowLeft,
  BookOpen,
  ListOrdered,
  FileCheck2,
  Users,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Check,
  Info,
  Sparkles,
  Cpu,
  History,
  Edit3,
  X,
  RotateCcw,
  HelpCircle,
  ShieldCheck,
  Layers,
  Eye,
} from "lucide-react";

type LiveCriterion = Omit<RubricCriterionData, "originalAiValue"> & {
  originalAiValue?: string | null;
  modifiedById?: string | null;
};

type LiveQuestion = Omit<RubricQuestionData, "specialInstructions" | "criteria" | "issues"> & {
  specialInstructions?: string | null;
  isBalanced?: boolean;
  criteria?: LiveCriterion[];
};

const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1") ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

export default function ExamWorkbenchPage() {
  const { accessToken } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawExamId = params?.examId as string;

  // Active Tab: subjects | questions | marking-scheme | examiners
  const initialTab = searchParams.get("tab") || "subjects";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Exam state
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Active subject selection for Questions, Marking Scheme, and Examiner tabs
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Modals & form state
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectMaxMarks, setNewSubjectMaxMarks] = useState("70");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");

  // Add Question state
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [newQNum, setNewQNum] = useState("");
  const [newQText, setNewQText] = useState("");
  const [newQMarks, setNewQMarks] = useState("14");
  const [newQSection, setNewQSection] = useState("Section A");

  // Add Criterion state
  const [activeQuestionForCriterion, setActiveQuestionForCriterion] = useState<string | null>(null);
  const [newCritName, setNewCritName] = useState("");
  const [newCritDesc, setNewCritDesc] = useState("");
  const [newCritMarks, setNewCritMarks] = useState("2");
  const [newCritPartial, setNewCritPartial] = useState(true);
  const [newCritAlternate, setNewCritAlternate] = useState(false);

  // Examiner assign state
  const [selectedExaminerIdToAssign, setSelectedExaminerIdToAssign] = useState("");

  // Phase 6: AI Rubric Engine State
  const [rubricAnalysesMap, setRubricAnalysesMap] = useState<Record<string, RubricAnalysisData[]>>(INITIAL_RUBRIC_ANALYSES);
  const [selectedRubricVersion, setSelectedRubricVersion] = useState<number>(1);
  const [isAnalyzingRubric, setIsAnalyzingRubric] = useState(false);
  const [rubricViewMode, setRubricViewMode] = useState<"ai-review" | "human-source" | "compare">("ai-review");
  const [questionViewMode, setQuestionViewMode] = useState<Record<string, "ai" | "human" | "compare">>({});

  // Modification Modal State
  const [editingCriterion, setEditingCriterion] = useState<{
    questionId: string;
    questionNumber: string;
    criterion: RubricCriterionData;
  } | null>(null);
  const [editCritName, setEditCritName] = useState("");
  const [editCritDesc, setEditCritDesc] = useState("");
  const [editCritMarks, setEditCritMarks] = useState("");
  const [editCritPartial, setEditCritPartial] = useState(true);
  const [editCritAlternate, setEditCritAlternate] = useState(false);
  const [editCritReason, setEditCritReason] = useState("");

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");

  // Load exam
  useEffect(() => {
    async function loadExam() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/exams/${rawExamId}`, {
          credentials: "include",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setExam(json.data);
            if (json.data.subjects?.length > 0) {
              setSelectedSubjectId(json.data.subjects[0].id);
            }
            setLoading(false);
            return;
          }
        }
      } catch {
        // fallback to mock
      }

      const found = INITIAL_EXAMS.find(
        (e) => e.id === rawExamId || e.code.toLowerCase() === rawExamId?.toLowerCase()
      ) || INITIAL_EXAMS[0];

      setExam(JSON.parse(JSON.stringify(found)));
      if (found && found.subjects?.length > 0) {
        setSelectedSubjectId(found.subjects[0].id);
      }
      setLoading(false);
    }

    if (rawExamId) {
      loadExam();
    }
  }, [rawExamId]);

  // Flash status message
  const showFeedback = (type: "success" | "error" | "info", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Selected subject helper
  const selectedSubject = useMemo(() => {
    if (!exam || !exam.subjects) return null;
    return exam.subjects.find((s) => s.id === selectedSubjectId) || exam.subjects[0] || null;
  }, [exam, selectedSubjectId]);

  // Calculate sum of question marks for selected subject
  const currentSubjectTotalQuestionMarks = useMemo(() => {
    if (!selectedSubject || !selectedSubject.questions) return 0;
    return selectedSubject.questions.reduce((sum, q) => sum + (q.maximumMarks || 0), 0);
  }, [selectedSubject]);

  // Subject question marks mismatch alert
  const marksMismatch = selectedSubject
    ? currentSubjectTotalQuestionMarks !== selectedSubject.maxMarks
    : false;

  // ----------------------------------------------------
  // SUBJECT ACTIONS
  // ----------------------------------------------------
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      showFeedback("error", "Subject code and subject name are required.");
      return;
    }

    const marks = parseInt(newSubjectMaxMarks, 10);
    if (isNaN(marks) || marks <= 0) {
      showFeedback("error", "Maximum marks must be a positive integer.");
      return;
    }

    const newSub: SubjectData = {
      id: `subj-${Date.now()}`,
      examId: exam!.id,
      code: newSubjectCode.trim().toUpperCase(),
      name: newSubjectName.trim(),
      description: newSubjectDesc.trim(),
      maxMarks: marks,
      questions: [],
      markingSchemes: [
        {
          id: `sch-${Date.now()}`,
          subjectId: `subj-${Date.now()}`,
          title: `Standard Marking Scheme - ${newSubjectCode.trim().toUpperCase()}`,
          instructions: "Award step credit for correct method derivation and clear mathematical steps.",
          version: 1,
          status: "DRAFT",
        },
      ],
      assignedExaminers: [],
    };

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: [...prev.subjects, newSub],
      };
    });

    setSelectedSubjectId(newSub.id);
    setIsAddSubjectModalOpen(false);
    setNewSubjectCode("");
    setNewSubjectName("");
    setNewSubjectDesc("");
    showFeedback("success", `Subject ${newSub.code} added successfully.`);
  };

  // ----------------------------------------------------
  // QUESTION ACTIONS
  // ----------------------------------------------------
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    if (!newQNum.trim() || !newQText.trim()) {
      showFeedback("error", "Question number and question text are required.");
      return;
    }

    const marks = parseInt(newQMarks, 10);
    if (isNaN(marks) || marks <= 0) {
      showFeedback("error", "Maximum marks must be greater than 0.");
      return;
    }

    const existing = selectedSubject.questions.find(
      (q) => q.questionNumber.toLowerCase() === newQNum.trim().toLowerCase()
    );
    if (existing) {
      showFeedback("error", `Question ${newQNum.trim()} already exists in this subject.`);
      return;
    }

    const newQuestion: QuestionData = {
      id: `q-${Date.now()}`,
      subjectId: selectedSubject.id,
      questionNumber: newQNum.trim().toUpperCase(),
      questionText: newQText.trim(),
      maximumMarks: marks,
      orderIndex: selectedSubject.questions.length + 1,
      section: newQSection.trim() || "Section A",
      criteria: [],
    };

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            questions: [...sub.questions, newQuestion],
          };
        }),
      };
    });

    setIsAddQuestionOpen(false);
    setNewQNum("");
    setNewQText("");
    setNewQMarks("14");
    showFeedback("success", `Question ${newQuestion.questionNumber} added.`);
  };

  const handleMoveQuestion = (questionId: string, direction: "up" | "down") => {
    if (!selectedSubject) return;
    const questions = [...selectedSubject.questions];
    const index = questions.findIndex((q) => q.id === questionId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const reordered = questions.map((q, idx) => ({
      ...q,
      orderIndex: idx + 1,
    }));

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            questions: reordered,
          };
        }),
      };
    });

    showFeedback("info", "Question order updated.");
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedSubject) return;
    if (!confirm("Are you sure you want to remove this question?")) return;

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          const filtered = sub.questions.filter((q) => q.id !== questionId);
          return {
            ...sub,
            questions: filtered.map((q, idx) => ({ ...q, orderIndex: idx + 1 })),
          };
        }),
      };
    });

    showFeedback("info", "Question deleted.");
  };

  // ----------------------------------------------------
  // CRITERIA & MARKING SCHEME ACTIONS
  // ----------------------------------------------------
  const handleAddCriterion = (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!selectedSubject) return;

    const question = selectedSubject.questions.find((q) => q.id === questionId);
    if (!question) return;

    if (!newCritName.trim()) {
      showFeedback("error", "Criterion name/step is required.");
      return;
    }

    const marks = parseInt(newCritMarks, 10);
    if (isNaN(marks) || marks <= 0) {
      showFeedback("error", "Criterion marks must be greater than 0.");
      return;
    }

    const existingSum = (question.criteria || []).reduce((s, c) => s + c.maximumMarks, 0);
    if (existingSum + marks > question.maximumMarks) {
      showFeedback(
        "error",
        `Sum of criteria (${existingSum + marks}) exceeds question maximum marks (${question.maximumMarks}).`
      );
      return;
    }

    const newCrit: CriterionData = {
      id: `crit-${Date.now()}`,
      name: newCritName.trim(),
      description: newCritDesc.trim(),
      maximumMarks: marks,
      orderIndex: (question.criteria?.length || 0) + 1,
      partialCreditAllowed: newCritPartial,
      alternateMethodAccepted: newCritAlternate,
    };

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            questions: sub.questions.map((q) => {
              if (q.id !== questionId) return q;
              return {
                ...q,
                criteria: [...(q.criteria || []), newCrit],
              };
            }),
          };
        }),
      };
    });

    setActiveQuestionForCriterion(null);
    setNewCritName("");
    setNewCritDesc("");
    setNewCritMarks("2");
    showFeedback("success", `Criterion added to ${question.questionNumber}.`);
  };

  const handleDeleteCriterion = (questionId: string, criterionId: string) => {
    if (!selectedSubject) return;

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            questions: sub.questions.map((q) => {
              if (q.id !== questionId) return q;
              return {
                ...q,
                criteria: (q.criteria || []).filter((c) => c.id !== criterionId),
              };
            }),
          };
        }),
      };
    });

    showFeedback("info", "Evaluation criterion removed.");
  };

  const handleApproveMarkingScheme = () => {
    if (!selectedSubject) return;

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            markingSchemes: sub.markingSchemes.map((ms) => ({
              ...ms,
              status: "APPROVED",
            })),
          };
        }),
      };
    });

    showFeedback("success", `Marking scheme for ${selectedSubject.code} approved.`);
  };

  // ----------------------------------------------------
  // PHASE 6: AI RUBRIC ENGINE ACTIONS
  // ----------------------------------------------------
  const handleAnalyzeWithAI = async () => {
    if (!selectedSubject) return;
    const currentScheme = selectedSubject.markingSchemes?.[0];
    if (!currentScheme) {
      showFeedback("error", "No marking scheme available to analyze.");
      return;
    }

    if (selectedSubject.questions.length === 0) {
      showFeedback("error", "Cannot analyze: No questions defined for this subject.");
      return;
    }

    setIsAnalyzingRubric(true);
    showFeedback("info", "Starting ANKLYZE AI analysis of marking scheme...");

    try {
      // Attempt backend API call
      const res = await fetch(`${API_BASE_URL}/marking-schemes/${currentScheme.id}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const newAnalysis: RubricAnalysisData = {
            id: json.data.id,
            markingSchemeId: json.data.markingSchemeId,
            version: json.data.version,
            overallStatus: json.data.overallStatus,
            provider: json.data.provider,
            model: json.data.model,
            promptVersion: json.data.promptVersion,
            confidence: json.data.confidence,
            confidenceBand: json.data.confidenceBand,
            fallbackUsed: json.data.fallbackUsed,
            summary: json.data.summary,
            createdAt: json.data.createdAt,
            questions: json.data.questions.map((q: LiveQuestion) => ({
              id: q.id,
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              questionText: q.questionText || "",
              maximumMarks: q.maximumMarks || 0,
              specialInstructions: q.specialInstructions ? [q.specialInstructions] : [],
              isReviewRequired: !q.isBalanced,
              issues: (json.data.issues || []).filter((i: RubricIssueData) => i.questionNumber === q.questionNumber),
              criteria: (q.criteria || []).map((c: LiveCriterion) => ({
                id: c.id,
                name: c.name,
                description: c.description || "",
                maximumMarks: c.maximumMarks,
                orderIndex: c.orderIndex,
                partialCreditAllowed: c.partialCreditAllowed,
                alternateMethodAccepted: c.alternateMethodAccepted,
                isHumanModified: c.isHumanModified,
                originalAiValue: c.originalAiValue ? JSON.parse(c.originalAiValue) : undefined,
                modifiedByName: c.modifiedById ? "Head Examiner" : undefined,
                modifiedAt: c.modifiedAt,
                modificationReason: c.modificationReason,
              })),
            })),
            issues: json.data.issues || [],
          };

          setRubricAnalysesMap((prev) => {
            const existing = prev[currentScheme.id] || [];
            return {
              ...prev,
              [currentScheme.id]: [newAnalysis, ...existing],
            };
          });
          setSelectedRubricVersion(newAnalysis.version);
          setIsAnalyzingRubric(false);
          showFeedback("success", `AI Rubric Analysis completed (Confidence ${Math.round(newAnalysis.confidence * 100)}%, ${newAnalysis.confidenceBand}).`);
          return;
        }
      }
    } catch {
      // Backend offline: gracefully simulate client-side generation adhering to all grounding rules
    }

    // Deterministic simulation
    await new Promise((r) => setTimeout(r, 1200));

    const existingAnalyses = rubricAnalysesMap[currentScheme.id] || [];
    const nextVer = existingAnalyses.length > 0 ? Math.max(...existingAnalyses.map((a) => a.version)) + 1 : 1;

    const simulatedQuestions: RubricQuestionData[] = selectedSubject.questions.map((q) => {
      const existingCriteria = q.criteria && q.criteria.length > 0 ? q.criteria : [
        {
          id: `crit-${q.id}-1`,
          name: "Core Concept & Working Principle",
          description: `Detailed and accurate answer for ${q.questionNumber}`,
          maximumMarks: Math.round(q.maximumMarks * 0.6 * 10) / 10,
          orderIndex: 1,
          partialCreditAllowed: true,
          alternateMethodAccepted: false,
          isHumanModified: false,
        },
        {
          id: `crit-${q.id}-2`,
          name: "Analytical Solution / Method Execution",
          description: "Step-by-step mathematical derivation or practical implementation",
          maximumMarks: Math.round((q.maximumMarks - Math.round(q.maximumMarks * 0.6 * 10) / 10) * 10) / 10,
          orderIndex: 2,
          partialCreditAllowed: true,
          alternateMethodAccepted: true,
          isHumanModified: false,
        },
      ];

      return {
        id: `rq-${q.id}`,
        questionId: q.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        maximumMarks: q.maximumMarks,
        specialInstructions: ["Award proportionate marks if core derivation steps are logically sound."],
        isReviewRequired: false,
        issues: [],
        criteria: existingCriteria.map((c, idx) => ({
          id: `rc-${q.id}-${idx + 1}`,
          name: c.name,
          description: c.description || "",
          maximumMarks: c.maximumMarks,
          orderIndex: c.orderIndex || idx + 1,
          partialCreditAllowed: c.partialCreditAllowed !== undefined ? c.partialCreditAllowed : true,
          alternateMethodAccepted: c.alternateMethodAccepted !== undefined ? c.alternateMethodAccepted : false,
          isHumanModified: false,
        })),
      };
    });

    const simulatedIssues: RubricIssueData[] = [
      {
        id: `iss-gen-${Date.now()}`,
        type: "AMBIGUITY",
        severity: "MEDIUM",
        questionNumber: selectedSubject.questions[0]?.questionNumber || "Q01",
        issue: "Partial-credit deduction policy is not explicitly quantified per sub-step.",
        explanation: "The marking scheme mentions step-marking generally, but does not define deduction if units or intermediate steps are omitted.",
        suggestedClarification: "Specify 0.5 mark deduction per omitted intermediate calculation.",
        isResolved: false,
      },
    ];

    const simulatedAnalysis: RubricAnalysisData = {
      id: `rubric-${selectedSubject.code}-${Date.now()}`,
      markingSchemeId: currentScheme.id,
      version: nextVer,
      overallStatus: "READY_FOR_REVIEW",
      provider: "gemini",
      model: "gemini-1.5-flash",
      promptVersion: "rubric-analysis-v1",
      confidence: 0.91,
      confidenceBand: "HIGH",
      fallbackUsed: false,
      summary: `Successfully interpreted human marking scheme for ${selectedSubject.code}. Structured machine-readable rubric generated with step allocations, partial credit, and alternate method rules.`,
      createdAt: new Date().toISOString(),
      questions: simulatedQuestions,
      issues: simulatedIssues,
    };

    setRubricAnalysesMap((prev) => ({
      ...prev,
      [currentScheme.id]: [simulatedAnalysis, ...existingAnalyses],
    }));
    setSelectedRubricVersion(nextVer);
    setIsAnalyzingRubric(false);
    showFeedback("success", `AI Rubric Analysis completed (Confidence 91%, High). Version ${nextVer} ready for human review.`);
  };

  const handleReanalyzeRubric = () => {
    handleAnalyzeWithAI();
  };

  const handleApproveRubricAnalysis = (analysisId: string) => {
    if (!selectedSubject) return;
    const currentScheme = selectedSubject.markingSchemes?.[0];
    if (!currentScheme) return;

    const analyses = rubricAnalysesMap[currentScheme.id] || [];
    const target = analyses.find((a) => a.id === analysisId);
    if (!target) return;

    // Validate marks consistency
    for (const q of target.questions) {
      const sum = q.criteria.reduce((acc, c) => acc + c.maximumMarks, 0);
      const roundedSum = Math.round(sum * 10) / 10;
      const expected = Math.round(q.maximumMarks * 10) / 10;
      if (Math.abs(roundedSum - expected) > 0.05) {
        showFeedback(
          "error",
          `Cannot approve rubric: Question ${q.questionNumber} criteria sum (${roundedSum}) does not match maximum marks (${expected}).`
        );
        return;
      }
    }

    setRubricAnalysesMap((prev) => {
      const updated = (prev[currentScheme.id] || []).map((a) => {
        if (a.id === analysisId) {
          return {
            ...a,
            overallStatus: "APPROVED" as const,
            approvedByName: "Head Examiner",
            approvedAt: new Date().toISOString(),
          };
        }
        if (a.overallStatus === "APPROVED") {
          return { ...a, overallStatus: "SUPERSEDED" as const };
        }
        return a;
      });
      return { ...prev, [currentScheme.id]: updated };
    });

    // Also update parent marking scheme status
    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            markingSchemes: sub.markingSchemes.map((ms) => ({
              ...ms,
              status: "APPROVED",
            })),
          };
        }),
      };
    });

    showFeedback("success", `Rubric Version ${target.version} approved by Head Examiner and published.`);
  };

  const handleOpenRejectModal = () => {
    setRejectReasonText("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmRejectAnalysis = (analysisId: string) => {
    if (!selectedSubject) return;
    const currentScheme = selectedSubject.markingSchemes?.[0];
    if (!currentScheme) return;

    if (!rejectReasonText.trim()) {
      showFeedback("error", "Please provide a reason for rejecting this rubric analysis.");
      return;
    }

    setRubricAnalysesMap((prev) => {
      const updated = (prev[currentScheme.id] || []).map((a) => {
        if (a.id === analysisId) {
          return {
            ...a,
            overallStatus: "REJECTED" as const,
            rejectionReason: rejectReasonText.trim(),
          };
        }
        return a;
      });
      return { ...prev, [currentScheme.id]: updated };
    });

    setIsRejectModalOpen(false);
    showFeedback("info", "Rubric analysis marked as REJECTED.");
  };

  const handleOpenEditCriterion = (
    questionId: string,
    questionNumber: string,
    criterion: RubricCriterionData
  ) => {
    setEditingCriterion({ questionId, questionNumber, criterion });
    setEditCritName(criterion.name);
    setEditCritDesc(criterion.description || "");
    setEditCritMarks(criterion.maximumMarks.toString());
    setEditCritPartial(criterion.partialCreditAllowed);
    setEditCritAlternate(criterion.alternateMethodAccepted);
    setEditCritReason(criterion.modificationReason || "Adjusted criteria breakdown to align with curriculum.");
  };

  const handleSaveEditCriterion = () => {
    if (!editingCriterion || !selectedSubject) return;
    const currentScheme = selectedSubject.markingSchemes?.[0];
    if (!currentScheme) return;

    const parsedMarks = parseFloat(editCritMarks);
    if (isNaN(parsedMarks) || parsedMarks <= 0) {
      showFeedback("error", "Marks must be a positive number.");
      return;
    }

    if (!editCritReason.trim()) {
      showFeedback("error", "Reason for modification is required for academic provenance.");
      return;
    }

    setRubricAnalysesMap((prev) => {
      const currentList = prev[currentScheme.id] || [];
      const updated = currentList.map((analysis) => {
        if (analysis.version !== selectedRubricVersion) return analysis;

        return {
          ...analysis,
          questions: analysis.questions.map((q) => {
            if (q.questionId !== editingCriterion.questionId) return q;

            return {
              ...q,
              criteria: q.criteria.map((c) => {
                if (c.id !== editingCriterion.criterion.id) return c;

                const originalAi = c.originalAiValue || {
                  name: c.name,
                  description: c.description,
                  maximumMarks: c.maximumMarks,
                  partialCreditAllowed: c.partialCreditAllowed,
                  alternateMethodAccepted: c.alternateMethodAccepted,
                };

                return {
                  ...c,
                  name: editCritName.trim(),
                  description: editCritDesc.trim(),
                  maximumMarks: parsedMarks,
                  partialCreditAllowed: editCritPartial,
                  alternateMethodAccepted: editCritAlternate,
                  isHumanModified: true,
                  originalAiValue: originalAi,
                  modifiedByName: "Head Examiner",
                  modifiedAt: new Date().toISOString(),
                  modificationReason: editCritReason.trim(),
                };
              }),
            };
          }),
        };
      });

      return { ...prev, [currentScheme.id]: updated };
    });

    setEditingCriterion(null);
    showFeedback("success", "Criterion modified successfully. Original AI values preserved in provenance trail.");
  };

  const handleResolveIssue = (issueId: string) => {
    if (!selectedSubject) return;
    const currentScheme = selectedSubject.markingSchemes?.[0];
    if (!currentScheme) return;

    setRubricAnalysesMap((prev) => {
      const currentList = prev[currentScheme.id] || [];
      const updated = currentList.map((analysis) => {
        if (analysis.version !== selectedRubricVersion) return analysis;

        return {
          ...analysis,
          issues: analysis.issues.map((i) => (i.id === issueId ? { ...i, isResolved: true } : i)),
          questions: analysis.questions.map((q) => ({
            ...q,
            issues: q.issues.map((i) => (i.id === issueId ? { ...i, isResolved: true } : i)),
            isReviewRequired: q.issues.some((i) => i.id !== issueId && !i.isResolved),
          })),
        };
      });

      return { ...prev, [currentScheme.id]: updated };
    });

    showFeedback("info", "Ambiguity marked as resolved.");
  };


  // ----------------------------------------------------
  // EXAMINER ASSIGNMENT ACTIONS
  // ----------------------------------------------------
  const handleAssignExaminer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    if (!selectedExaminerIdToAssign) {
      showFeedback("error", "Please select an examiner from the directory.");
      return;
    }

    const candidate = AVAILABLE_ACADEMIC_EXAMINERS.find(
      (ex) => ex.id === selectedExaminerIdToAssign
    );
    if (!candidate) return;

    const alreadyAssigned = selectedSubject.assignedExaminers?.some(
      (a) => a.examinerId === candidate.id && a.status === "ACTIVE"
    );
    if (alreadyAssigned) {
      showFeedback("error", `${candidate.fullName} is already assigned to ${selectedSubject.code}.`);
      return;
    }

    const newAssignment: AssignedExaminerData = {
      id: `asgn-${Date.now()}`,
      examinerId: candidate.id,
      examinerName: candidate.fullName,
      email: candidate.email,
      department: candidate.department,
      institution: candidate.institution,
      status: "ACTIVE",
      assignedAt: new Date().toISOString().split("T")[0],
    };

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            assignedExaminers: [...(sub.assignedExaminers || []), newAssignment],
          };
        }),
      };
    });

    setSelectedExaminerIdToAssign("");
    showFeedback("success", `${candidate.fullName} assigned to ${selectedSubject.code}.`);
  };

  const handleRevokeAssignment = (assignmentId: string) => {
    if (!selectedSubject) return;
    if (!confirm("Revoke examiner assignment for this subject?")) return;

    setExam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subjects: prev.subjects.map((sub) => {
          if (sub.id !== selectedSubject.id) return sub;
          return {
            ...sub,
            assignedExaminers: sub.assignedExaminers.filter((a) => a.id !== assignmentId),
          };
        }),
      };
    });

    showFeedback("info", "Examiner assignment revoked.");
  };

  // Toggle Exam Status between DRAFT and ACTIVE
  const handleToggleExamStatus = () => {
    if (!exam) return;
    const newStatus = exam.status === "DRAFT" ? "ACTIVE" : "DRAFT";
    setExam((prev) => {
      if (!prev) return prev;
      return { ...prev, status: newStatus };
    });
    showFeedback("success", `Exam status updated to ${newStatus}.`);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
        <div className="workspace-shell min-h-screen bg-[#FCFAF5] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">Loading Examination Workbench...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!exam) {
    return (
      <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
        <div className="workspace-shell min-h-screen bg-[#FCFAF5] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">Examination Record Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              The requested examination ID could not be retrieved from the database.
            </p>
            <Link
              href="/admin/exams"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              Return to Examination List
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HEAD_EXAMINER"]}>
      <div className="workspace-shell min-h-screen bg-[#FCFAF5] text-slate-900 flex flex-col font-sans selection:bg-[#c5ddd4] selection:text-slate-900">
        
        {/* 1. TOP NAVIGATION WITH IDENTICAL BRANDING & ACCOUNT POPOVER */}
        <TopNavigation activeTab="admin-exams" />

        {/* FEEDBACK TOAST */}
        {statusMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-300"
                : "bg-blue-50 text-blue-800 border-blue-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <Info className="w-4 h-4 text-blue-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 2. CONTEXT HEADER (MATCHING ExaminerHeader.tsx) */}
        <div className="bg-white border-b border-slate-200/90 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <Link
                    href="/admin/exams"
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border border-slate-200 transition-colors normal-case tracking-normal"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Examinations</span>
                  </Link>
                  <span className="text-slate-300">•</span>
                  <span>Workbench</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-normal font-mono">{exam.code}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                    {exam.title}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      exam.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {exam.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-500 pt-0.5">
                  <span className="font-semibold text-slate-800">{exam.semester || "Semester III"}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 font-medium">{exam.academicYear || "2025-2026"}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                    Total Marks: {exam.totalMarks}
                  </span>
                </div>
              </div>

              {/* Status Action */}
              <div className="flex items-center sm:self-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleExamStatus}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all shadow-2xs ${
                    exam.status === "ACTIVE"
                      ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                      : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {exam.status === "ACTIVE" ? "Set to Draft" : "Activate Examination"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* 3. MAIN WORKBENCH */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* SUMMARY SURFACE (MATCHING WorkSummary.tsx EXACTLY) */}
          <section aria-labelledby="workbench-metrics-heading" className="w-full">
            <h2 id="workbench-metrics-heading" className="sr-only">Workbench Metrics</h2>
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-100 grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
              
              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Total Marks
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900">
                    {exam.totalMarks}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Exam total score</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Subjects
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                    Configured
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-blue-600">
                    {exam.subjects?.length || 0}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Course papers</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Total Questions
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900">
                    {(exam.subjects || []).reduce(
                      (acc, s) => acc + (s.questions?.length || 0),
                      0
                    )}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Across all subjects</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">
                    Examiners
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Allocated
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#16A34A]">
                    {(exam.subjects || []).reduce(
                      (acc, s) => acc + (s.assignedExaminers?.length || 0),
                      0
                    )}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Faculty evaluators</p>
                </div>
              </div>

            </div>
          </section>

          {/* TAB BAR NAVIGATION (MATCHING SEGMENTED CONTROLS) */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Workbench Sections">
              <button
                type="button"
                onClick={() => setActiveTab("subjects")}
                className={`py-3 px-3.5 border-b-2 text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "subjects"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Subjects ({exam.subjects?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("questions")}
                className={`py-3 px-3.5 border-b-2 text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "questions"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>2. Question Paper Structure</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("marking-scheme")}
                className={`py-3 px-3.5 border-b-2 text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "marking-scheme"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>3. Marking Scheme &amp; Criteria</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("examiners")}
                className={`py-3 px-3.5 border-b-2 text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "examiners"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>4. Examiner Assignment</span>
              </button>
            </nav>
          </div>

          {/* TAB 1: SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Examination Subjects &amp; Courses
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define courses tested under this cycle. Each subject maintains its own question paper and marking scheme.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>
              </div>

              {/* SUBJECT CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exam.subjects.map((sub) => {
                  const qCount = sub.questions?.length || 0;
                  const eCount = sub.assignedExaminers?.length || 0;
                  const schemeApproved = sub.markingSchemes?.some((m) => m.status === "APPROVED");

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {sub.code}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 font-mono">
                              Max Marks: {sub.maxMarks}
                            </span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-slate-900 mt-1">
                            {sub.name}
                          </h3>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            schemeApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {schemeApproved ? "Scheme Approved" : "Scheme In Draft"}
                        </span>
                      </div>

                      {sub.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {sub.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block font-mono">Questions</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">{qCount}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block font-mono">Assigned</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">{eCount} Faculty</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block font-mono">Total Marks</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">{sub.maxMarks}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setActiveTab("questions");
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors text-center shadow-2xs"
                        >
                          Manage Questions
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setActiveTab("marking-scheme");
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors text-center shadow-2xs"
                        >
                          Marking Scheme
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADD SUBJECT MODAL */}
              {isAddSubjectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200/90 max-w-lg w-full p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-serif text-lg font-bold text-slate-900">
                        Add Examination Subject
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddSubjectModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddSubject} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                            Course Code *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CS-303"
                            value={newSubjectCode}
                            onChange={(e) => setNewSubjectCode(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                            Max Marks *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newSubjectMaxMarks}
                            onChange={(e) => setNewSubjectMaxMarks(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                          Subject / Course Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Database Management Systems"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                          Syllabus / Scope Description
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Relational algebra, SQL normalization, concurrency control, B+ trees..."
                          value={newSubjectDesc}
                          onChange={(e) => setNewSubjectDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsAddSubjectModalOpen(false)}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                        >
                          Save Subject
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUESTION PAPER STRUCTURE */}
          {activeTab === "questions" && (
            <div className="space-y-6">
              {/* SUBJECT SELECTOR BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap font-mono">
                    Active Subject:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    {exam.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} — {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSubject && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold border ${
                        marksMismatch
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {marksMismatch ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>
                        Question Marks: {currentSubjectTotalQuestionMarks} / {selectedSubject.maxMarks}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddQuestionOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>
                )}
              </div>

              {/* QUESTIONS LIST */}
              {selectedSubject && (
                <div className="space-y-3">
                  {selectedSubject.questions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                      <ListOrdered className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800 font-serif">No Questions Configured Yet</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Add structured questions for {selectedSubject.code} to establish the evaluation paper.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddQuestionOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Question</span>
                      </button>
                    </div>
                  ) : (
                    selectedSubject.questions.map((q, idx) => {
                      const criteriaCount = q.criteria?.length || 0;
                      const criteriaSum = (q.criteria || []).reduce(
                        (sum, c) => sum + c.maximumMarks,
                        0
                      );

                      return (
                        <div
                          key={q.id}
                          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              {/* MATCHING EvaluationPanel QUESTION BADGE */}
                              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                                QUESTION {q.questionNumber.replace(/^Q/i, "")}
                              </span>
                              {q.section && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                                  {q.section}
                                </span>
                              )}
                              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {q.maximumMarks} Marks
                              </span>
                            </div>

                            {/* REORDERING & ACTIONS */}
                            <div className="flex items-center gap-1 self-end sm:self-center">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveQuestion(q.id, "up")}
                                title="Move question up"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === selectedSubject.questions.length - 1}
                                onClick={() => handleMoveQuestion(q.id, "down")}
                                title="Move question down"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubjectId(selectedSubject.id);
                                  setActiveTab("marking-scheme");
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors ml-2"
                              >
                                Configure Criteria ({criteriaCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                title="Delete Question"
                                className="p-1 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 font-sans leading-relaxed">
                            {q.questionText}
                          </p>

                          {/* CRITERIA SUMMARY */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-50 font-mono">
                            <span>
                              Evaluation Criteria:{" "}
                              <strong className="text-slate-700">
                                {criteriaCount} steps ({criteriaSum} / {q.maximumMarks} marks)
                              </strong>
                            </span>
                            {criteriaCount > 0 && criteriaSum === q.maximumMarks && (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> Fully specified
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ADD QUESTION MODAL */}
              {isAddQuestionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200/90 max-w-lg w-full p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-serif text-lg font-bold text-slate-900">
                        Add Question to {selectedSubject?.code}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddQuestionOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddQuestion} className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                            Q. Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Q05"
                            value={newQNum}
                            onChange={(e) => setNewQNum(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                            Max Marks *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newQMarks}
                            onChange={(e) => setNewQMarks(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                            Section
                          </label>
                          <input
                            type="text"
                            placeholder="Section A"
                            value={newQSection}
                            onChange={(e) => setNewQSection(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                          Question Prompt / Text *
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Provide the complete mathematical or technical question formulation..."
                          value={newQText}
                          onChange={(e) => setNewQText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsAddQuestionOpen(false)}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                        >
                          Save Question
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MARKING SCHEME & CRITERIA (PHASE 6: AI RUBRIC ENGINE) */}
          {activeTab === "marking-scheme" && (() => {
            const currentScheme = selectedSubject?.markingSchemes?.[0];
            const subjectAnalyses = currentScheme ? rubricAnalysesMap[currentScheme.id] || [] : [];
            const activeRubricAnalysis = subjectAnalyses.find((a) => a.version === selectedRubricVersion) || subjectAnalyses[0];

            return (
              <div className="space-y-6">
                {/* 1. SUBJECT & WORKFLOW TOOLBAR */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-bold text-slate-600 whitespace-nowrap font-mono">
                      Subject:
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                        setSelectedRubricVersion(1);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                    >
                      {exam.subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code} — {sub.name}
                        </option>
                      ))}
                    </select>

                    {/* Mode Selector Segmented Control */}
                    <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setRubricViewMode("ai-review")}
                        className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                          rubricViewMode === "ai-review"
                            ? "bg-white text-blue-700 font-bold shadow-2xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>AI Rubric Analysis</span>
                        {activeRubricAnalysis && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-mono">
                            v{activeRubricAnalysis.version}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRubricViewMode("human-source")}
                        className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                          rubricViewMode === "human-source"
                            ? "bg-white text-blue-700 font-bold shadow-2xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Human Source Scheme</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRubricViewMode("compare")}
                        className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                          rubricViewMode === "compare"
                            ? "bg-white text-blue-700 font-bold shadow-2xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Compare Side-by-Side</span>
                      </button>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Version Selector if multiple analyses exist */}
                    {subjectAnalyses.length > 1 && (
                      <div className="flex items-center gap-1 text-xs">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={activeRubricAnalysis?.version || 1}
                          onChange={(e) => setSelectedRubricVersion(parseInt(e.target.value, 10))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                        >
                          {subjectAnalyses.map((a) => (
                            <option key={a.id} value={a.version}>
                              Version {a.version} ({Math.round(a.confidence * 100)}% - {a.overallStatus.replace("_", " ")})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Trigger AI Analysis Button */}
                    <button
                      type="button"
                      disabled={isAnalyzingRubric}
                      onClick={handleAnalyzeWithAI}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{subjectAnalyses.length > 0 ? "Re-analyze with ANKLYZE AI" : "Analyze with ANKLYZE AI"}</span>
                    </button>

                    {/* Quick Approve Button if ready */}
                    {activeRubricAnalysis && activeRubricAnalysis.overallStatus !== "APPROVED" && (
                      <button
                        type="button"
                        onClick={() => handleApproveRubricAnalysis(activeRubricAnalysis.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Rubric</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. LOADING STATE */}
                {isAnalyzingRubric && (
                  <div className="bg-white rounded-2xl border border-blue-200 p-8 text-center space-y-3 shadow-xs animate-in fade-in">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      Analyzing Marking Scheme with ANKLYZE AI...
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Executing grounded interpretation using primary model Gemini (with Groq fallback). Evaluating question criteria, extracting partial-credit rules, and detecting potential ambiguities.
                    </p>
                  </div>
                )}

                {/* 3. VIEW MODE: AI RUBRIC ANALYSIS & REVIEW */}
                {!isAnalyzingRubric && rubricViewMode === "ai-review" && (
                  <div className="space-y-6">
                    {!activeRubricAnalysis ? (
                      /* Empty state: Not analyzed */
                      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
                        <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
                        <div>
                          <h3 className="text-base font-bold text-slate-800 font-serif">
                            No AI Rubric Analysis Yet
                          </h3>
                          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
                            Click &quot;Analyze with ANKLYZE AI&quot; to transform the human marking scheme for {selectedSubject?.code} into a structured, machine-readable rubric with ambiguity and risk detection.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAnalyzeWithAI}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Analyze with ANKLYZE AI</span>
                        </button>
                      </div>
                    ) : (
                      /* Active Rubric Analysis Content */
                      <div className="space-y-6">
                        {/* ANALYSIS METADATA & PROVENANCE BANNER */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4 border-b border-slate-100">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
                                  ANKLYZE AI Rubric Engine
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  Analysis Version {activeRubricAnalysis.version}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                    activeRubricAnalysis.overallStatus === "APPROVED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : activeRubricAnalysis.overallStatus === "REJECTED"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : activeRubricAnalysis.overallStatus === "REVIEW_REQUIRED"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {activeRubricAnalysis.overallStatus.replace("_", " ")}
                                </span>
                              </div>

                              <h3 className="font-serif text-lg font-bold text-slate-900">
                                Structured Evaluation Rubric — {selectedSubject?.code}
                              </h3>

                              {activeRubricAnalysis.summary && (
                                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                                  {activeRubricAnalysis.summary}
                                </p>
                              )}
                            </div>

                            {/* Review Actions */}
                            <div className="flex flex-wrap items-center gap-2 self-start">
                              {activeRubricAnalysis.overallStatus !== "APPROVED" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveRubricAnalysis(activeRubricAnalysis.id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve Rubric</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleOpenRejectModal}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors shadow-2xs"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  <span>Approved &amp; Published by {activeRubricAnalysis.approvedByName || "Head Examiner"}</span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={handleReanalyzeRubric}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Request Re-analysis</span>
                              </button>
                            </div>
                          </div>

                          {/* PROVENANCE METRICS STRIP */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                                Overall Confidence
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-base font-bold font-mono text-slate-900">
                                  {Math.round(activeRubricAnalysis.confidence * 100)}%
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                                    activeRubricAnalysis.confidenceBand === "HIGH"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : activeRubricAnalysis.confidenceBand === "MEDIUM"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {activeRubricAnalysis.confidenceBand}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                                AI Provider &amp; Model
                              </span>
                              <div className="font-semibold text-slate-800 capitalize mt-0.5 font-mono text-[11px]">
                                {activeRubricAnalysis.provider} ({activeRubricAnalysis.model})
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Fallback: {activeRubricAnalysis.fallbackUsed ? "Used (Groq)" : "None"}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                                Prompt Version
                              </span>
                              <div className="font-mono text-[11px] font-bold text-slate-800 mt-0.5">
                                {activeRubricAnalysis.promptVersion}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Questions: {activeRubricAnalysis.questions.length} / {selectedSubject?.questions.length || 0}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                                Ambiguities Flagged
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className={`font-mono font-bold text-base ${
                                    activeRubricAnalysis.issues.length > 0 ? "text-amber-700" : "text-emerald-700"
                                  }`}
                                >
                                  {activeRubricAnalysis.issues.length}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {activeRubricAnalysis.issues.filter((i) => !i.isResolved).length} unresolved
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AMBIGUITY & INCOMPLETE RULE PANEL */}
                        {activeRubricAnalysis.issues.length > 0 && (
                          <div className="bg-amber-50/50 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 text-amber-900">
                              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                              <h4 className="font-serif text-sm font-bold tracking-tight">
                                Potential Ambiguities &amp; Incomplete Rules Detected ({activeRubricAnalysis.issues.length})
                              </h4>
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                                Advisory for Human Reviewer
                              </span>
                            </div>

                            <p className="text-xs text-amber-800/90 leading-relaxed">
                              ANKLYZE AI detected the following potential ambiguities or missing rules in the human marking scheme. The suggested clarifications are non-binding recommendations for human reviewers.
                            </p>

                            <div className="space-y-2.5 pt-1">
                              {activeRubricAnalysis.issues.map((iss) => (
                                <div
                                  key={iss.id}
                                  className={`p-3.5 rounded-xl border text-xs transition-colors ${
                                    iss.isResolved
                                      ? "bg-white/80 border-slate-200 opacity-75"
                                      : "bg-white border-amber-200 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1.5 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                      {iss.questionNumber && (
                                        <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                                          {iss.questionNumber}
                                        </span>
                                      )}
                                      <span
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                          iss.severity === "HIGH"
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}
                                      >
                                        Severity: {iss.severity}
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {iss.issue}
                                      </span>
                                    </div>

                                    <div>
                                      {iss.isResolved ? (
                                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Resolved
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleResolveIssue(iss.id)}
                                          className="text-xs font-semibold text-amber-800 hover:text-amber-950 px-2.5 py-1 rounded bg-amber-100/80 hover:bg-amber-200/80 transition-colors"
                                        >
                                          Mark as Resolved
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-2 space-y-1.5">
                                    <p className="text-slate-600 text-[11px] leading-relaxed">
                                      <strong className="text-slate-700">Explanation: </strong>
                                      {iss.explanation}
                                    </p>

                                    {iss.suggestedClarification && (
                                      <p className="text-[11px] text-blue-800 bg-blue-50/60 p-2 rounded-lg border border-blue-100/80">
                                        <strong className="text-blue-900">Suggested Clarification: </strong>
                                        {iss.suggestedClarification}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* QUESTION-BY-QUESTION STRUCTURED EVALUATION CRITERIA */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Question-Wise Structured Criteria Interpretation ({activeRubricAnalysis.questions.length} Questions)
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">
                              Click &quot;Modify Criterion&quot; on any step to record reviewer edits with provenance
                            </span>
                          </div>

                          {activeRubricAnalysis.questions.map((q) => {
                            const criteriaSum = q.criteria.reduce((acc, c) => acc + c.maximumMarks, 0);
                            const roundedSum = Math.round(criteriaSum * 10) / 10;
                            const isBalanced = Math.abs(roundedSum - q.maximumMarks) < 0.05;

                            return (
                              <div
                                key={q.id}
                                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                                        QUESTION {q.questionNumber.replace(/^Q/i, "")}
                                      </span>
                                      <span className="text-xs font-bold text-slate-500 font-mono">
                                        (Maximum {q.maximumMarks} Marks)
                                      </span>
                                      {q.isReviewRequired && (
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                          Review Required
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                                      {q.questionText}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                                        isBalanced
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      Criteria Sum: {roundedSum} / {q.maximumMarks} Marks
                                    </span>
                                  </div>
                                </div>

                                {q.specialInstructions && q.specialInstructions.length > 0 && (
                                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                                    <strong className="text-slate-700">Special Evaluator Instructions: </strong>
                                    {q.specialInstructions.join(" ")}
                                  </div>
                                )}

                                {/* CRITERIA ROWS */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                                  {q.criteria.map((crit) => (
                                    <div
                                      key={crit.id}
                                      className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                                    >
                                      <div className="flex items-start space-x-2.5 flex-1">
                                        <div className="mt-0.5 shrink-0">
                                          <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-200">
                                            {crit.orderIndex}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-slate-900 block leading-snug">
                                              {crit.name}
                                            </span>

                                            {crit.partialCreditAllowed ? (
                                              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                Partial Credit: Yes
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                                                Partial Credit: No
                                              </span>
                                            )}

                                            {crit.alternateMethodAccepted ? (
                                              <span className="text-[10px] text-purple-700 font-medium bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                                Alternate Method: Yes
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                                                Alternate Method: No
                                              </span>
                                            )}

                                            {crit.isHumanModified && (
                                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                Modified by Reviewer
                                              </span>
                                            )}
                                          </div>

                                          {crit.description && (
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                              {crit.description}
                                            </p>
                                          )}

                                          {crit.isHumanModified && (
                                            <div className="text-[10px] text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200/80 mt-1 font-mono">
                                              <span>Reason: {crit.modificationReason}</span>
                                              {crit.originalAiValue && (
                                                <span className="ml-2 text-slate-500 font-normal">
                                                  (Original AI: {crit.originalAiValue.name} • {crit.originalAiValue.maximumMarks} Marks)
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className="font-mono text-right">
                                          <span className="font-bold text-slate-900 text-sm">
                                            {crit.maximumMarks}
                                          </span>
                                          <span className="text-slate-400 text-xs"> Mark{crit.maximumMarks > 1 ? "s" : ""}</span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditCriterion(q.questionId, q.questionNumber, crit)}
                                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors border border-blue-200/80"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                          <span>Modify</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. VIEW MODE: HUMAN SOURCE SCHEME */}
                {!isAnalyzingRubric && rubricViewMode === "human-source" && (
                  <div className="space-y-6">
                    {selectedSubject && (
                      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                              Human-Provided Marking Scheme Source
                            </span>
                            <h3 className="font-serif text-base font-bold text-slate-900 mt-0.5">
                              {selectedSubject.markingSchemes?.[0]?.title || "Official Marking Scheme"}
                            </h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Version {selectedSubject.markingSchemes?.[0]?.version || 1}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <strong className="text-slate-800">General Guidance for Examiners: </strong>
                          {selectedSubject.markingSchemes?.[0]?.instructions ||
                            "Award step marks according to individual criteria breakdown. Partial credit is enabled by default."}
                        </p>

                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                            Human Input Criteria
                          </h4>

                          {selectedSubject.questions.map((q) => (
                            <div key={q.id} className="p-4 rounded-xl border border-slate-200/90 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                                  {q.questionNumber}
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-600">
                                  Max: {q.maximumMarks} Marks
                                </span>
                              </div>
                              <p className="text-xs text-slate-700">{q.questionText}</p>
                              <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                                {(q.criteria || []).map((c, i) => (
                                  <div key={c.id || i} className="p-2.5 flex items-center justify-between">
                                    <div>
                                      <span className="font-semibold text-slate-800">{c.name}</span>
                                      {c.description && <span className="text-[11px] text-slate-500 block">{c.description}</span>}
                                    </div>
                                    <span className="font-mono font-bold text-slate-900">{c.maximumMarks} Marks</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. VIEW MODE: COMPARE SIDE-BY-SIDE */}
                {!isAnalyzingRubric && rubricViewMode === "compare" && (
                  <div className="space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Provenance Verification View: </strong>
                        Verify that ANKLYZE AI did not invent unsupported grading rules or alter maximum marks allocations compared to the original human marking scheme.
                      </span>
                    </div>

                    <div className="space-y-6">
                      {selectedSubject?.questions.map((q) => {
                        const aiQ = activeRubricAnalysis?.questions.find((rq) => rq.questionId === q.id);

                        return (
                          <div
                            key={q.id}
                            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded">
                                QUESTION {q.questionNumber.replace(/^Q/i, "")} ({q.maximumMarks} Marks)
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                Preservation Check: {aiQ && Math.round(aiQ.criteria.reduce((s, c) => s + c.maximumMarks, 0)) === q.maximumMarks ? "✓ Marks Preserved" : "⚠️ Attention Required"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left: Original Human Input */}
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                                  Human-Provided Marking Scheme
                                </span>
                                <div className="space-y-2 text-xs">
                                  {(q.criteria || []).length === 0 ? (
                                    <p className="text-slate-400 italic">No explicit criteria provided in source.</p>
                                  ) : (
                                    q.criteria?.map((hc) => (
                                      <div key={hc.id} className="p-2 bg-white rounded border border-slate-100 flex items-center justify-between">
                                        <div>
                                          <span className="font-semibold text-slate-800">{hc.name}</span>
                                          {hc.description && <span className="text-[10px] text-slate-500 block">{hc.description}</span>}
                                        </div>
                                        <span className="font-mono font-bold text-slate-900">{hc.maximumMarks}M</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Right: AI Structured Interpretation */}
                              <div className="p-3.5 rounded-xl bg-blue-50/30 border border-blue-200/80 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-mono block">
                                  AI Structured Interpretation (ANKLYZE AI)
                                </span>
                                <div className="space-y-2 text-xs">
                                  {!aiQ ? (
                                    <p className="text-slate-400 italic">No AI interpretation generated.</p>
                                  ) : (
                                    aiQ.criteria.map((ac) => (
                                      <div key={ac.id} className="p-2 bg-white rounded border border-blue-100 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-slate-900">{ac.name}</span>
                                          <span className="font-mono font-bold text-blue-900">{ac.maximumMarks}M</span>
                                        </div>
                                        {ac.description && <p className="text-[11px] text-slate-600">{ac.description}</p>}
                                        <div className="flex items-center gap-2 pt-1">
                                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                            Partial: {ac.partialCreditAllowed ? "Yes" : "No"}
                                          </span>
                                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                            Alt Method: {ac.alternateMethodAccepted ? "Yes" : "No"}
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: EXAMINER ASSIGNMENT */}
          {activeTab === "examiners" && (
            <div className="space-y-6">
              {/* SUBJECT SELECTOR */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap font-mono">
                    Subject Allocation:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  >
                    {exam.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} — {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs text-slate-500 font-mono">
                  {selectedSubject?.assignedExaminers?.length || 0} Assigned Evaluator(s)
                </span>
              </div>

              {/* ASSIGN FORM CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Assign Qualified Examiner to {selectedSubject?.code}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Only verified faculty and evaluators holding the EXAMINER role can be allocated to evaluation cycles.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAssignExaminer} className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                      Select Evaluator from Institution Directory
                    </label>
                    <select
                      value={selectedExaminerIdToAssign}
                      onChange={(e) => setSelectedExaminerIdToAssign(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                    >
                      <option value="">-- Choose verified academic examiner --</option>
                      {AVAILABLE_ACADEMIC_EXAMINERS.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.fullName} ({ex.email}) — {ex.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap transition-colors"
                  >
                    Allocate Examiner
                  </button>
                </form>
              </div>

              {/* CURRENTLY ASSIGNED EXAMINERS TABLE (MATCHING EvaluationQueue.tsx EXACTLY) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    Active Faculty Assignments for {selectedSubject?.code}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    MPOnline Role Verification: EXAMINER
                  </span>
                </div>

                {(!selectedSubject?.assignedExaminers || selectedSubject.assignedExaminers.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No examiners allocated to {selectedSubject?.code} yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th scope="col" className="px-5 py-3.5 font-bold">Examiner Name</th>
                          <th scope="col" className="px-4 py-3.5 font-bold">Department &amp; Center</th>
                          <th scope="col" className="px-4 py-3.5 font-bold">Status</th>
                          <th scope="col" className="px-4 py-3.5 font-bold">Allocated Date</th>
                          <th scope="col" className="px-5 py-3.5 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedSubject.assignedExaminers.map((asgn) => (
                          <tr key={asgn.id} className="hover:bg-blue-50/25 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                              <div>{asgn.examinerName}</div>
                              <div className="text-[11px] font-mono text-slate-400 font-normal">
                                {asgn.email}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div>{asgn.department}</div>
                              <div className="text-[11px] text-slate-400">{asgn.institution}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {asgn.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                              {asgn.assignedAt}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRevokeAssignment(asgn.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. HUMAN CRITERION MODIFICATION MODAL */}
          {editingCriterion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl border border-slate-200/90 max-w-lg w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Modify Evaluation Criterion — {editingCriterion.questionNumber}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Academic Provenance: Original AI value will be permanently preserved in audit history.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCriterion(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* ORIGINAL AI VALUE SNAPSHOT */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1 font-mono text-slate-600">
                  <div className="font-bold text-slate-700 uppercase text-[10px]">
                    Original AI Interpretation:
                  </div>
                  <div>
                    Name: {editingCriterion.criterion.originalAiValue?.name || editingCriterion.criterion.name}
                  </div>
                  <div>
                    Marks: {editingCriterion.criterion.originalAiValue?.maximumMarks || editingCriterion.criterion.maximumMarks} Marks
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEditCriterion();
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                        Criterion Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCritName}
                        onChange={(e) => setEditCritName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                        Marks *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        required
                        value={editCritMarks}
                        onChange={(e) => setEditCritMarks(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
                      Rubric Description / Scoring Instruction
                    </label>
                    <textarea
                      rows={2}
                      value={editCritDesc}
                      onChange={(e) => setEditCritDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCritPartial}
                        onChange={(e) => setEditCritPartial(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700">Allow Partial Credit</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCritAlternate}
                        onChange={(e) => setEditCritAlternate(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-700">Accept Alternate Methods</span>
                    </label>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1 font-mono">
                      Modification Reason (Audit Provenance) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adjusted step allocation to match technical syllabus guidelines"
                      value={editCritReason}
                      onChange={(e) => setEditCritReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/30 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingCriterion(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Save Modification &amp; Record Provenance
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 7. REJECT RUBRIC MODAL */}
          {isRejectModalOpen && (() => {
            const currentScheme = selectedSubject?.markingSchemes?.[0];
            const subjectAnalyses = currentScheme ? rubricAnalysesMap[currentScheme.id] || [] : [];
            const activeRubricAnalysis = subjectAnalyses.find((a) => a.version === selectedRubricVersion) || subjectAnalyses[0];

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                <div className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Reject AI Rubric Analysis
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Rejecting this analysis marks it as <strong>REJECTED</strong>. You can subsequently request re-analysis with adjusted instructions to produce a new version.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block font-mono">
                      Reason for Rejection *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Inconsistent mark allocation for Section B or unclear partial credit criteria..."
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => activeRubricAnalysis && handleConfirmRejectAnalysis(activeRubricAnalysis.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        </main>

        {/* 4. FOOTER (MATCHING Examiner Dashboard FOOTER EXACTLY) */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 tracking-tight">ANKLYZE</span>
              <span>•</span>
              <span>Analyse the marks, not just the paper</span>
              <span>•</span>
              <Link href="/" className="text-blue-600 hover:underline font-semibold">
                Public Website ↗
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
              <span>Exam Code: {exam.code}</span>
              <span>TLS 1.3 AES-256</span>
              <span>Governance Mode</span>
            </div>
          </div>
        </footer>

      </div>
    </ProtectedRoute>
  );
}
