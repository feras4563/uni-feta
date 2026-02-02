import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSubjects, fetchDepartmentSemesterSubjects, updateDepartmentSemesterSubjects } from "../../lib/api";

interface DepartmentSubjectsModalProps {
  department: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function DepartmentSubjectsModal({ 
  department, 
  isOpen, 
  onClose, 
  onSave 
}: DepartmentSubjectsModalProps) {
  const queryClient = useQueryClient();
  const [semesterSubjects, setSemesterSubjects] = useState<{[semesterNumber: number]: string[]}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get semester count from department (default to 2 if not set)
  const semesterCount = department?.semester_count || 2;

  // Fetch all subjects
  const { data: allSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects(),
  });


  // Filter subjects that belong to this department
  const departmentSubjects = allSubjects?.filter(subject => 
    subject.department_id === department.id
  ) || [];

  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (isOpen) {
      setSemesterSubjects({});
    }
  }, [isOpen, department.id]);

  // Load existing subjects for each semester
  useEffect(() => {
    if (isOpen && department.id) {
      const loadExistingSubjects = async () => {
        const newSemesterSubjects: {[semesterNumber: number]: string[]} = {};
        
        for (let i = 1; i <= semesterCount; i++) {
          try {
            const existingSubjects = await fetchDepartmentSemesterSubjects(department.id, i);
            newSemesterSubjects[i] = existingSubjects.map((item: any) => item.subject_id);
          } catch (error) {
            console.error(`Error loading subjects for semester ${i}:`, error);
            newSemesterSubjects[i] = [];
          }
        }
        
        setSemesterSubjects(newSemesterSubjects);
      };
      
      loadExistingSubjects();
    }
  }, [isOpen, department.id, semesterCount]);

  const handleAddSubject = (semesterNumber: number, subjectId: string) => {
    setSemesterSubjects(prev => ({
      ...prev,
      [semesterNumber]: [...(prev[semesterNumber] || []), subjectId]
    }));
  };

  const handleRemoveSubject = (semesterNumber: number, subjectId: string) => {
    setSemesterSubjects(prev => ({
      ...prev,
      [semesterNumber]: (prev[semesterNumber] || []).filter(id => id !== subjectId)
    }));
  };

  const getAvailableSubjects = (semesterNumber: number) => {
    const selectedInThisSemester = semesterSubjects[semesterNumber] || [];
    const selectedInOtherSemesters = Object.values(semesterSubjects)
      .flat()
      .filter((_, index) => index !== semesterNumber - 1);
    
    return departmentSubjects.filter(subject => 
      !selectedInThisSemester.includes(subject.id) && 
      !selectedInOtherSemesters.includes(subject.id)
    );
  };

  const getSelectedSubjects = (semesterNumber: number) => {
    const selectedIds = semesterSubjects[semesterNumber] || [];
    return departmentSubjects.filter(subject => selectedIds.includes(subject.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update subjects for each semester
      for (let i = 1; i <= semesterCount; i++) {
        const subjectIds = semesterSubjects[i] || [];
        await updateDepartmentSemesterSubjects(department.id, i, subjectIds);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["department-semester-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["department-details"] });
      
      alert("تم حفظ المواد بنجاح!");
      onSave();
    } catch (error: any) {
      console.error("Error saving subjects:", error);
      alert("خطأ في حفظ المواد: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              إدارة مواد القسم: {department.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{department.name}</h3>
                  {department.name_en && (
                    <p className="text-sm text-gray-500">{department.name_en}</p>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  عدد الفصول: {semesterCount}
                </div>
              </div>
            </div>

            {/* Semester Sections */}
            <div className="space-y-6">
              {Array.from({ length: semesterCount }, (_, index) => {
                const semesterNumber = index + 1;
                const availableSubjects = getAvailableSubjects(semesterNumber);
                const selectedSubjects = getSelectedSubjects(semesterNumber);

                return (
                  <div key={semesterNumber} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        الفصل الدراسي {semesterNumber}
                      </h3>
                      {semester && (
                        <div className="text-sm text-gray-500">
                          {semester.name} - {semester.study_years?.name}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Available Subjects */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          المواد المتاحة ({availableSubjects.length})
                        </h4>
                        
                        {subjectsLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">جاري تحميل المواد...</p>
                          </div>
                        ) : availableSubjects.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            <p className="text-sm">لا توجد مواد متاحة</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {availableSubjects.map((subject: any) => (
                              <div
                                key={subject.id}
                                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors duration-200"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {subject.code} • {subject.credits} ساعة
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubject(semesterNumber, subject.id)}
                                  className="p-1 text-green-600 hover:text-green-900 rounded hover:bg-green-100 transition-colors duration-200"
                                  title="إضافة المادة"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Subjects */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          المواد المختارة ({selectedSubjects.length})
                        </h4>
                        
                        {selectedSubjects.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">لم يتم اختيار أي مواد بعد</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selectedSubjects.map((subject: any) => (
                              <div
                                key={subject.id}
                                className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                              >
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {subject.code} • {subject.credits} ساعة
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubject(semesterNumber, subject.id)}
                                  className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-100 transition-colors duration-200"
                                  title="إزالة المادة"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ المواد"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}