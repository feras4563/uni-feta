import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSubjectTeachers, deleteTeacherSubjectAssignment } from "../../lib/api";
import TeacherSubjectModal from "../teacher/TeacherSubjectModal";

interface SubjectTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: any;
}

export default function SubjectTeachersModal({
  isOpen,
  onClose,
  subject
}: SubjectTeachersModalProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const queryClient = useQueryClient();

  // Fetch teachers for this subject
  const { data: subjectTeachers = [], isLoading } = useQuery({
    queryKey: ["subject-teachers", subject?.id],
    queryFn: () => fetchSubjectTeachers(subject!.id),
    enabled: !!subject?.id && isOpen
  });

  const handleAddTeacher = () => {
    setEditingAssignment(null);
    setShowAddModal(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowAddModal(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التخصيص؟')) return;

    try {
      await deleteTeacherSubjectAssignment(assignmentId);
      alert('تم حذف التخصيص بنجاح');
      queryClient.invalidateQueries({ queryKey: ["subject-teachers"] });
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      alert('خطأ في حذف التخصيص');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingAssignment(null);
    queryClient.invalidateQueries({ queryKey: ["subject-teachers"] });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                مدرسين مقرر: {subject?.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-md font-medium text-gray-900">
                  المقرر: {subject?.name} ({subject?.code})
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  إجمالي المدرسين: {subjectTeachers.length}
                </p>
              </div>
              <button
                onClick={handleAddTeacher}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                إضافة مدرس
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">جاري التحميل...</p>
              </div>
            ) : subjectTeachers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectTeachers.map((assignment: any) => (
                  <div key={assignment.id} className={`bg-gray-50 rounded-lg p-4 border ${
                    assignment.is_primary_teacher 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className={`p-2 rounded-lg mr-3 ${
                            assignment.is_primary_teacher 
                              ? 'bg-blue-100' 
                              : 'bg-gray-200'
                          }`}>
                            <svg className={`h-5 w-5 ${
                              assignment.is_primary_teacher 
                                ? 'text-blue-600' 
                                : 'text-gray-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h5 className={`font-medium text-sm ${
                              assignment.is_primary_teacher 
                                ? 'text-blue-900' 
                                : 'text-gray-900'
                            }`}>
                              {assignment.teacher?.name}
                              {assignment.is_primary_teacher && (
                                <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  رئيسي
                                </span>
                              )}
                            </h5>
                            {assignment.teacher?.name_en && (
                              <p className="text-xs text-gray-600 mt-1">{assignment.teacher.name_en}</p>
                            )}
                            {assignment.teacher?.email && (
                              <p className="text-xs text-gray-500 mt-1">{assignment.teacher.email}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          <div className="flex items-center justify-between">
                            <span>{assignment.department?.name}</span>
                            <span>{assignment.study_year?.name || assignment.academic_year}</span>
                          </div>
                          <div className="mt-1">
                            {assignment.semester?.name || 
                             (assignment.semester === 'fall' ? 'الفصل الأول' : 
                              assignment.semester === 'spring' ? 'الفصل الثاني' : 'الفصل الصيفي')}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {assignment.can_edit_grades && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              تعديل الدرجات
                            </span>
                          )}
                          {assignment.can_take_attendance && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              أخذ الحضور
                            </span>
                          )}
                        </div>
                        
                        {assignment.notes && (
                          <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                            {assignment.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditAssignment(assignment)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                          title="تعديل"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد مدرسين</h3>
                <p className="mt-1 text-sm text-gray-500">لم يتم تعيين أي مدرسين لهذا المقرر بعد.</p>
                <button
                  onClick={handleAddTeacher}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  إضافة أول مدرس
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Subject Modal */}
      <TeacherSubjectModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        subjectId={subject?.id}
        editingAssignment={editingAssignment}
        mode="subject"
      />
    </>
  );
}


