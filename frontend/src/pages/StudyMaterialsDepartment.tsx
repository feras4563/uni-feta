import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSubjects, fetchDepartments } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import SubjectTeachersModal from "../components/subject/SubjectTeachersModal";

export default function StudyMaterialsDepartment() {
  const navigate = useNavigate();
  const { departmentId = "" } = useParams<{ departmentId: string }>();
  const { hasClientPermission } = usePermissions();
  const [showTeachersModal, setShowTeachersModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const department = useMemo(() => {
    return departments.find((item: any) => String(item.id) === String(departmentId));
  }, [departments, departmentId]);

  const departmentSubjects = useMemo(() => {
    return subjects.filter(
      (subject: any) => String(subject.department_id || subject.department?.id || "") === String(departmentId)
    );
  }, [subjects, departmentId]);

  const subjectsBySemester = useMemo(() => {
    const map = new Map<number, any[]>();

    departmentSubjects.forEach((subject: any) => {
      const semesterNumber = Number(subject.semester_number || 0);
      const key = semesterNumber > 0 ? semesterNumber : 0;
      const currentSubjects = map.get(key) || [];
      currentSubjects.push(subject);
      map.set(key, currentSubjects);
    });

    return Array.from(map.entries())
      .sort(([firstSemester], [secondSemester]) => firstSemester - secondSemester)
      .map(([semesterNumber, semesterSubjects]) => ({
        semesterNumber,
        subjects: semesterSubjects.sort((first: any, second: any) => first.name.localeCompare(second.name, "ar")),
      }));
  }, [departmentSubjects]);

  const handleManageTeachers = (subject: any) => {
    setSelectedSubject(subject);
    setShowTeachersModal(true);
  };

  const handleCloseTeachersModal = () => {
    setShowTeachersModal(false);
    setSelectedSubject(null);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل المقررات الدراسية" />;
  if (!department) return <ErrorMessage message="القسم المطلوب غير موجود" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/study-materials")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-3 bg-blue-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
                <p className="text-sm text-gray-600 mt-1">عرض المقررات الدراسية مرتبة حسب الفصول الدراسية</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex px-3 py-2 rounded-full bg-blue-100 text-blue-800 font-medium">
                {departmentSubjects.length} مقرر
              </span>
              <span className="inline-flex px-3 py-2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                {subjectsBySemester.length} فصول دراسية
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        {subjectsBySemester.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            لا توجد مقررات مسجلة لهذا القسم حالياً
          </div>
        ) : (
          subjectsBySemester.map(({ semesterNumber, subjects: semesterSubjects }) => (
            <section key={semesterNumber || "unassigned"} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {semesterNumber > 0 ? `الفصل ${semesterNumber}` : "مقررات غير مرتبطة بفصل"}
                </h2>
                <span className="text-sm text-gray-500">{semesterSubjects.length} مقرر</span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-6">
                {semesterSubjects.map((subject: any) => (
                  <div key={subject.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow duration-200">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        {subject.name_en && (
                          <div className="text-sm text-gray-500 mt-1">{subject.name_en}</div>
                        )}
                      </div>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        {subject.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium text-gray-800">الساعات:</span> {subject.credits || 0}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">المدرس:</span> {subject.teacher?.name || "غير محدد"}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">التكلفة:</span> {subject.cost_per_credit || "-"}
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">النوع:</span> {subject.subject_type || "-"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/subjects/${subject.id}`)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        عرض التفاصيل
                      </button>
                      <button
                        onClick={() => handleManageTeachers(subject)}
                        className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                      >
                        إدارة المدرسين
                      </button>
                      {hasClientPermission("subjects", "update") && (
                        <button
                          onClick={() => navigate(`/subjects/${subject.id}`)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          تعديل
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <SubjectTeachersModal
        isOpen={showTeachersModal}
        onClose={handleCloseTeachersModal}
        subject={selectedSubject}
      />
    </div>
  );
}
