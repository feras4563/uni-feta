import { useMemo, useState } from "react";
import { matchesPrerequisiteSearch, rankPrerequisiteSuggestions, SubjectPrerequisiteCandidate } from "../../lib/subject-prerequisite-utils";

interface PrerequisiteSelectorProps {
  subjects: SubjectPrerequisiteCandidate[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  draft: {
    code?: string | null;
    name?: string | null;
    name_en?: string | null;
    semester_number?: number | null;
  };
  selectedDepartmentIds: string[];
  currentSubjectId?: string;
  error?: string;
}

export default function PrerequisiteSelector({
  subjects,
  selectedIds,
  onChange,
  draft,
  selectedDepartmentIds,
  currentSubjectId,
  error,
}: PrerequisiteSelectorProps) {
  const [search, setSearch] = useState("");

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const recommendedSubjects = useMemo(
    () => rankPrerequisiteSuggestions(subjects, draft, selectedDepartmentIds, currentSubjectId).slice(0, 6),
    [subjects, draft, selectedDepartmentIds, currentSubjectId]
  );

  const searchableSubjects = useMemo(() => {
    return subjects
      .filter((subject) => subject.id !== currentSubjectId)
      .filter((subject) => matchesPrerequisiteSearch(subject, search))
      .sort((left, right) => {
        const leftSelected = selectedIdSet.has(left.id) ? 1 : 0;
        const rightSelected = selectedIdSet.has(right.id) ? 1 : 0;
        if (leftSelected !== rightSelected) {
          return rightSelected - leftSelected;
        }

        const leftSemester = left.semester_number ?? Number.MAX_SAFE_INTEGER;
        const rightSemester = right.semester_number ?? Number.MAX_SAFE_INTEGER;
        if (leftSemester !== rightSemester) {
          return leftSemester - rightSemester;
        }

        return (left.name ?? "").localeCompare(right.name ?? "", "ar");
      });
  }, [subjects, currentSubjectId, search, selectedIdSet]);

  const selectedSubjects = useMemo(() => {
    return subjects
      .filter((subject) => selectedIdSet.has(subject.id))
      .sort((left, right) => (left.name ?? "").localeCompare(right.name ?? "", "ar"));
  }, [subjects, selectedIdSet]);

  const togglePrerequisite = (subjectId: string) => {
    if (selectedIdSet.has(subjectId)) {
      onChange(selectedIds.filter((id) => id !== subjectId));
      return;
    }

    onChange([...selectedIds, subjectId]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">المتطلبات السابقة</label>
        <p className="text-sm text-gray-500">
          اختر المواد التي يجب أن ينجح الطالب فيها قبل تسجيل هذا المقرر. النظام يبرز المواد الأقرب بناءً على الاسم، الكود، والفصل الدراسي.
        </p>
      </div>

      {selectedSubjects.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="mb-2 text-sm font-medium text-green-900">المتطلبات المختارة</div>
          <div className="flex flex-wrap gap-2">
            {selectedSubjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => togglePrerequisite(subject.id)}
                className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-900"
              >
                <span>{subject.name}</span>
                {subject.code && <span className="font-mono text-green-700">{subject.code}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {recommendedSubjects.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 text-sm font-medium text-blue-900">مواد مقترحة كمتطلبات سابقة</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendedSubjects.map(({ subject, reasons, score }) => {
              const isSelected = selectedIdSet.has(subject.id);

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => togglePrerequisite(subject.id)}
                  className={`rounded-lg border p-3 text-right transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-100"
                      : "border-blue-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{subject.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        {subject.code && <span className="font-mono">{subject.code}</span>}
                        {typeof subject.semester_number === "number" && <span>الفصل {subject.semester_number}</span>}
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{score}</span>
                  </div>
                  {reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reasons.map((reason) => (
                        <span key={`${subject.id}-${reason}`} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-700">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-medium text-gray-900">البحث في المواد الموجودة</div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 md:max-w-sm"
            placeholder="ابحث بالاسم أو الكود"
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {searchableSubjects.length > 0 ? (
            searchableSubjects.map((subject) => {
              const isSelected = selectedIdSet.has(subject.id);

              return (
                <label
                  key={subject.id}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 ${
                    isSelected ? "border-green-300 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePrerequisite(subject.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {subject.code && <span className="font-mono">{subject.code}</span>}
                        {subject.name_en && <span>{subject.name_en}</span>}
                        {typeof subject.semester_number === "number" && <span>الفصل {subject.semester_number}</span>}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">لا توجد مواد مطابقة للبحث الحالي.</div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
