export interface SubjectPrerequisiteCandidate {
  id: string;
  code?: string | null;
  name?: string | null;
  name_en?: string | null;
  semester_number?: number | null;
  department_id?: string | null;
  subject_departments?: Array<{
    department_id?: string | null;
  }>;
}

export interface SubjectDraftForPrerequisiteMatching {
  code?: string | null;
  name?: string | null;
  name_en?: string | null;
  semester_number?: number | null;
}

export interface PrerequisiteSuggestion {
  subject: SubjectPrerequisiteCandidate;
  score: number;
  reasons: string[];
}

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
}

function normalizeText(value?: string | null) {
  return normalizeDigits(value ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLevel(rawValue?: string | null) {
  const value = normalizeText(rawValue);
  if (!value) return null;

  const romanMatches = Array.from(value.matchAll(/(?:^|\s)(i|ii|iii|iv|v|vi|vii|viii|ix|x)(?:\s|$)/g));
  if (romanMatches.length > 0) {
    const roman = romanMatches[romanMatches.length - 1][1].toLowerCase();
    const romanMap: Record<string, number> = {
      i: 1,
      ii: 2,
      iii: 3,
      iv: 4,
      v: 5,
      vi: 6,
      vii: 7,
      viii: 8,
      ix: 9,
      x: 10,
    };
    return romanMap[roman] ?? null;
  }

  const digitMatch = value.match(/(\d+)(?!.*\d)/);
  return digitMatch ? Number.parseInt(digitMatch[1], 10) : null;
}

function removeLevelTokens(rawValue?: string | null) {
  return normalizeText(rawValue)
    .replace(/(?:^|\s)(i|ii|iii|iv|v|vi|vii|viii|ix|x)(?:\s|$)/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectDepartmentIds(subject: SubjectPrerequisiteCandidate) {
  const departmentIds = new Set<string>();

  if (subject.department_id) {
    departmentIds.add(subject.department_id);
  }

  for (const relation of subject.subject_departments ?? []) {
    if (relation.department_id) {
      departmentIds.add(relation.department_id);
    }
  }

  return departmentIds;
}

function calculateSimilaritySignals(candidate: SubjectPrerequisiteCandidate, draft: SubjectDraftForPrerequisiteMatching) {
  const reasons: string[] = [];
  let score = 0;

  const candidateCodeBase = removeLevelTokens(candidate.code);
  const draftCodeBase = removeLevelTokens(draft.code);
  const candidateNameBase = removeLevelTokens(candidate.name);
  const candidateEnglishBase = removeLevelTokens(candidate.name_en);
  const draftNameBase = removeLevelTokens(draft.name);
  const draftEnglishBase = removeLevelTokens(draft.name_en);

  const codeBaseMatches = candidateCodeBase && draftCodeBase && candidateCodeBase === draftCodeBase;
  const arabicNameMatches = candidateNameBase && draftNameBase && candidateNameBase === draftNameBase;
  const englishNameMatches = candidateEnglishBase && draftEnglishBase && candidateEnglishBase === draftEnglishBase;

  if (codeBaseMatches) {
    score += 45;
    reasons.push('يشترك مع المقرر الجديد في نفس جذر الكود');
  }

  if (arabicNameMatches || englishNameMatches) {
    score += 40;
    reasons.push('يشترك مع المقرر الجديد في نفس اسم السلسلة');
  }

  const candidateLevel = extractLevel(candidate.code) ?? extractLevel(candidate.name) ?? extractLevel(candidate.name_en);
  const draftLevel = extractLevel(draft.code) ?? extractLevel(draft.name) ?? extractLevel(draft.name_en);

  if (candidateLevel !== null && draftLevel !== null) {
    if (candidateLevel === draftLevel - 1) {
      score += 50;
      reasons.push('يبدو أنه المستوى السابق مباشرة');
    } else if (candidateLevel < draftLevel) {
      score += 20;
      reasons.push('مستواه أقل من المقرر الجديد');
    } else if (candidateLevel >= draftLevel) {
      score -= 15;
    }
  }

  return { score, reasons };
}

export function rankPrerequisiteSuggestions(
  subjects: SubjectPrerequisiteCandidate[],
  draft: SubjectDraftForPrerequisiteMatching,
  selectedDepartmentIds: string[],
  currentSubjectId?: string
) {
  const selectedDepartments = new Set(selectedDepartmentIds.filter(Boolean));

  return subjects
    .filter((subject) => subject.id && subject.id !== currentSubjectId)
    .map((subject) => {
      const reasons: string[] = [];
      let score = 0;

      const { score: similarityScore, reasons: similarityReasons } = calculateSimilaritySignals(subject, draft);
      score += similarityScore;
      reasons.push(...similarityReasons);

      if (typeof subject.semester_number === 'number' && typeof draft.semester_number === 'number') {
        if (subject.semester_number < draft.semester_number) {
          score += 25;
          reasons.push('موجود في فصل أسبق');
        } else if (subject.semester_number === draft.semester_number) {
          score -= 10;
        } else {
          score -= 30;
        }
      }

      if (selectedDepartments.size > 0) {
        const candidateDepartments = collectDepartmentIds(subject);
        const overlaps = Array.from(candidateDepartments).filter((departmentId) => selectedDepartments.has(departmentId));

        if (overlaps.length > 0) {
          score += 20;
          reasons.push('مرتبط بأحد الأقسام المختارة');
        }
      }

      return {
        subject,
        score,
        reasons: Array.from(new Set(reasons)),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const leftSemester = left.subject.semester_number ?? Number.MAX_SAFE_INTEGER;
      const rightSemester = right.subject.semester_number ?? Number.MAX_SAFE_INTEGER;
      if (leftSemester !== rightSemester) {
        return leftSemester - rightSemester;
      }

      return (left.subject.name ?? '').localeCompare(right.subject.name ?? '', 'ar');
    });
}

export function matchesPrerequisiteSearch(subject: SubjectPrerequisiteCandidate, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  return [subject.code, subject.name, subject.name_en]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(normalizedQuery));
}
