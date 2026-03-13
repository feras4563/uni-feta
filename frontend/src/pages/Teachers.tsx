import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTeachers, fetchDepartments, fetchSubjects, exportTeachers } from "../lib/api";
import { useState, useMemo } from "react";

export default function TeachersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers()
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects()
  });
  
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const departmentNameById = useMemo(() => {
    return new Map(departments.map((department: any) => [String(department.id), department.name]));
  }, [departments]);

  const specializationDepartmentByValue = useMemo(() => {
    const mapping = new Map<string, string>();

    subjects.forEach((subject: any) => {
      const departmentId = String(subject.department_id || subject.department?.id || "");
      if (!departmentId) {
        return;
      }

      const values = [subject.name, subject.name_en, subject.code]
        .filter(Boolean)
        .map((value: string) => value.trim().toLowerCase());

      values.forEach((value) => {
        if (value) {
          mapping.set(value, departmentId);
        }
      });
    });

    return mapping;
  }, [subjects]);

  const getTeacherSpecializations = (teacher: any) => {
    const values = [
      ...(Array.isArray(teacher.specializations) ? teacher.specializations : []),
      ...(teacher.specialization ? [teacher.specialization] : []),
    ]
      .filter(Boolean)
      .map((value: string) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(values));
  };

  const getTeacherAssignments = (teacher: any) => {
    return Array.isArray(teacher.teacherSubjects)
      ? teacher.teacherSubjects.filter((assignment: any) => assignment?.is_active !== false)
      : [];
  };

  const getTeacherDepartmentIds = (teacher: any) => {
    const departmentIds = new Set<string>();

    if (teacher.department_id) {
      departmentIds.add(String(teacher.department_id));
    }

    if (teacher.department?.id) {
      departmentIds.add(String(teacher.department.id));
    }

    getTeacherAssignments(teacher).forEach((assignment: any) => {
      if (assignment.department_id) {
        departmentIds.add(String(assignment.department_id));
      }

      if (assignment.department?.id) {
        departmentIds.add(String(assignment.department.id));
      }

      if (assignment.subject?.department_id) {
        departmentIds.add(String(assignment.subject.department_id));
      }
    });

    getTeacherSpecializations(teacher).forEach((specialization) => {
      const departmentId = specializationDepartmentByValue.get(specialization.trim().toLowerCase());
      if (departmentId) {
        departmentIds.add(String(departmentId));
      }
    });

    return Array.from(departmentIds);
  };

  const getTeacherDepartmentNames = (teacher: any) => {
    return getTeacherDepartmentIds(teacher)
      .map((departmentId) => departmentNameById.get(departmentId))
      .filter(Boolean) as string[];
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t: any) => {
      const specializationText = getTeacherSpecializations(t).join(" ").toLowerCase();
      const assignmentText = getTeacherAssignments(t)
        .flatMap((assignment: any) => [assignment.subject?.name, assignment.subject?.name_en, assignment.subject?.code, assignment.department?.name])
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const departmentsText = getTeacherDepartmentNames(t).join(" ").toLowerCase();
      const matchesSearch = !searchTerm || 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specializationText.includes(searchTerm.toLowerCase()) ||
        assignmentText.includes(searchTerm.toLowerCase()) ||
        departmentsText.includes(searchTerm.toLowerCase());
      const matchesDept = !departmentFilter || getTeacherDepartmentIds(t).includes(String(departmentFilter));
      return matchesSearch && matchesDept;
    });
  }, [teachers, searchTerm, departmentFilter, subjects, departments]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات المدرسين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">إدارة المدرسين</h1>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const params: Record<string, string> = {};
                  if (searchTerm) params.search = searchTerm;
                  if (departmentFilter) params.department_id = departmentFilter;
                  exportTeachers(params);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
              >
                تصدير CSV
              </button>
              <button
                onClick={() => navigate("/teachers/create")}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                إضافة مدرس جديد
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن مدرس..."
              className="px-4 py-2 border rounded-lg"
            />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">جميع الأقسام</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الاسم</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">التخصصات</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الأقسام</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">البريد</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTeachers.map((teacher: any) => (
                <tr key={teacher.id} className="hover:bg-gray-50 align-top">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{teacher.name}</div>
                    {teacher.name_en && <div className="text-sm text-gray-500">{teacher.name_en}</div>}
                    <div className="text-xs text-gray-500 mt-2">
                      {getTeacherAssignments(teacher).length > 0
                        ? `${getTeacherAssignments(teacher).length} تكليف نشط`
                        : 'لا توجد تكليفات نشطة'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {getTeacherSpecializations(teacher).length > 0 ? (
                        getTeacherSpecializations(teacher).slice(0, 4).map((specialization) => (
                          <span key={specialization} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {specialization}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">غير محدد</span>
                      )}
                    </div>
                    {getTeacherAssignments(teacher).length > 0 && (
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {getTeacherAssignments(teacher).slice(0, 2).map((assignment: any) => (
                          <div key={assignment.id}>
                            {assignment.subject?.name || 'مادة غير محددة'}
                          </div>
                        ))}
                        {getTeacherAssignments(teacher).length > 2 && (
                          <div>و {getTeacherAssignments(teacher).length - 2} مواد أخرى</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {getTeacherDepartmentNames(teacher).length > 0 ? (
                        getTeacherDepartmentNames(teacher).map((departmentName) => (
                          <span key={departmentName} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {departmentName}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">غير محدد</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <div>{teacher.email || 'غير محدد'}</div>
                    {teacher.phone && <div className="text-sm text-gray-500 mt-1">{teacher.phone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="عرض"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/teachers/edit/${teacher.id}`, { state: { teacher } })}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                        title="تعديل"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTeachers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>لا توجد نتائج</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
