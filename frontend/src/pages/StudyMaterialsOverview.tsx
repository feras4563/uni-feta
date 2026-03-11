import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchSubjects, fetchDepartments } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import SubjectTeachersModal from "../components/subject/SubjectTeachersModal";

export default function StudyMaterialsOverview() {
  const navigate = useNavigate();
  const { hasClientPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredSubjects = useMemo(() => {
    if (!normalizedSearchTerm) {
      return [];
    }

    return subjects.filter((subject: any) => {
      const searchableText = [
        subject.name,
        subject.name_en,
        subject.code,
        subject.department?.name,
        subject.department?.name_en,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchTerm);
    });
  }, [subjects, normalizedSearchTerm]);

  const departmentsWithStats = useMemo(() => {
    return departments
      .map((department: any) => {
        const departmentSubjects = subjects.filter(
          (subject: any) => String(subject.department_id || subject.department?.id || "") === String(department.id)
        );

        const semesterCount = new Set(
          departmentSubjects
            .map((subject: any) => subject.semester_number)
            .filter(Boolean)
        ).size;

        return {
          ...department,
          subjectCount: departmentSubjects.length,
          semesterCount,
        };
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "ar"));
  }, [departments, subjects]);

  const handleAdd = () => {
    navigate("/subjects/create");
  };

  const handleEdit = (subject: any) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleView = (subject: any) => {
    navigate(`/subjects/${subject.id}`);
  };

  const handleOpenDepartment = (departmentId: string) => {
    navigate(`/study-materials/departments/${departmentId}`);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إدارة المقررات الدراسية</h1>
                <p className="text-sm text-gray-600 mt-1">تصفح المقررات حسب الأقسام أو ابحث مباشرة عن أي مقرر</p>
              </div>
            </div>
            <div className="flex gap-3">
              {hasClientPermission("subjects", "create") && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة مقرر دراسي
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              البحث عن مقرر
            </h3>
          </div>
          <div className="p-6">
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
              placeholder="ابحث باسم المقرر أو الكود أو القسم"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="mt-4 text-sm text-gray-600">
              {normalizedSearchTerm
                ? `تم العثور على ${filteredSubjects.length} مقرر مطابق`
                : `توجد ${subjects.length} مادة موزعة على ${departments.length} أقسام`}
            </div>
          </div>
        </div>

        {normalizedSearchTerm ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">نتائج البحث</h3>
            </div>
            {filteredSubjects.length === 0 ? (
              <div className="p-10 text-center text-gray-500">لا توجد مقررات مطابقة للبحث الحالي</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSubjects.map((subject: any) => (
                  <div key={subject.id} className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{subject.name}</h4>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {subject.code}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {subject.department?.name || "غير محدد"}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-800">
                          {subject.semester_number ? `الفصل ${subject.semester_number}` : "غير محدد"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                        <span>{subject.credits || 0} ساعة معتمدة</span>
                        <span>{subject.teacher?.name || "بدون مدرس رئيسي"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenDepartment(String(subject.department_id || subject.department?.id || ""))}
                        className="px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
                        disabled={!subject.department_id && !subject.department?.id}
                      >
                        عرض القسم
                      </button>
                      <button
                        onClick={() => handleManageTeachers(subject)}
                        className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                      >
                        إدارة المدرسين
                      </button>
                      <button
                        onClick={() => handleView(subject)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        عرض التفاصيل
                      </button>
                      {hasClientPermission("subjects", "update") && (
                        <button
                          onClick={() => handleEdit(subject)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          تعديل
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">الأقسام الأكاديمية</h3>
              <div className="text-sm text-gray-500">اختر قسماً لعرض مقرراته حسب الفصول</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {departmentsWithStats.map((department: any) => (
                <button
                  key={department.id}
                  onClick={() => handleOpenDepartment(department.id)}
                  className="text-right bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{department.name}</h4>
                      {department.name_en && (
                        <div className="text-sm text-gray-500 mb-4">{department.name_en}</div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {department.subjectCount} مقرر
                        </span>
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                          {department.semesterCount} فصول
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 text-gray-700">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
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
