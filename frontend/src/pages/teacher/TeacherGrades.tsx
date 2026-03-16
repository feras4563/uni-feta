import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchMySubjects, fetchSubjectGrades, storeTeacherGrades, deleteTeacherGrade, publishTeacherGrades } from '../../lib/jwt-api';

interface GradeEntry {
  student_id: string;
  grade_type: string;
  grade_name: string;
  grade_value: number | string;
  max_grade: number;
  weight: number;
  is_published: boolean;
}

const GRADE_TYPES = [
  { value: 'classwork', label: 'درجة أعمال الفصل', icon: 'fa-clipboard-list', color: 'green', defaultMax: 30 },
  { value: 'midterm', label: 'درجة الامتحان النصفي', icon: 'fa-file-alt', color: 'blue', defaultMax: 30 },
  { value: 'final', label: 'درجة الامتحان النهائي', icon: 'fa-file-signature', color: 'red', defaultMax: 40 },
];

export default function TeacherGrades() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGradeType, setSelectedGradeType] = useState<string>('classwork');
  const [maxGrade, setMaxGrade] = useState<number>(30);
  const [students, setStudents] = useState<any[]>([]);
  const [existingGrades, setExistingGrades] = useState<any[]>([]);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'input' | 'overview'>('input');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadSubjectGrades(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    const type = GRADE_TYPES.find(t => t.value === selectedGradeType);
    if (type) {
      setMaxGrade(type.defaultMax);
    }
  }, [selectedGradeType]);

  const loadSubjects = async () => {
    try {
      const data = await fetchMySubjects();
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubject(data[0].subject_id);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjectGrades = async (subjectId: string) => {
    setLoadingGrades(true);
    try {
      const data = await fetchSubjectGrades(subjectId);
      setStudents(data.students || []);
      setExistingGrades(data.grades || []);
      
      // Pre-fill grade inputs from existing grades for the selected type
      const inputs: Record<string, string> = {};
      (data.grades || []).forEach((g: any) => {
        if (g.grade_type === selectedGradeType) {
          inputs[g.student_id] = String(g.grade_value);
        }
      });
      setGradeInputs(inputs);
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= maxGrade)) {
      setGradeInputs(prev => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedSubject) return;

    const grades: GradeEntry[] = [];
    const currentTypeLabel = GRADE_TYPES.find(t => t.value === selectedGradeType)?.label || selectedGradeType;
    Object.entries(gradeInputs).forEach(([studentId, value]) => {
      if (value !== '' && value !== undefined) {
        grades.push({
          student_id: studentId,
          grade_type: selectedGradeType,
          grade_name: currentTypeLabel,
          grade_value: parseFloat(value),
          max_grade: maxGrade,
          weight: 1.0,
          is_published: false,
        });
      }
    });

    if (grades.length === 0) {
      setMessage({ type: 'error', text: 'لا توجد درجات لحفظها' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const result = await storeTeacherGrades(selectedSubject, grades);
      setMessage({ type: 'success', text: `تم حفظ ${result.created + result.updated} درجة كمسودة (${result.created} جديدة، ${result.updated} محدثة). يجب نشرها ليراها الطلاب.` });
      // Reload grades
      await loadSubjectGrades(selectedSubject);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل حفظ الدرجات' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!selectedSubject) return;

    const grades: GradeEntry[] = [];
    const currentTypeLabel = GRADE_TYPES.find(t => t.value === selectedGradeType)?.label || selectedGradeType;
    Object.entries(gradeInputs).forEach(([studentId, value]) => {
      if (value !== '' && value !== undefined) {
        grades.push({
          student_id: studentId,
          grade_type: selectedGradeType,
          grade_name: currentTypeLabel,
          grade_value: parseFloat(value),
          max_grade: maxGrade,
          weight: 1.0,
          is_published: true,
        });
      }
    });

    if (grades.length === 0) {
      setMessage({ type: 'error', text: 'لا توجد درجات لحفظها' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const result = await storeTeacherGrades(selectedSubject, grades);
      setMessage({ type: 'success', text: `تم حفظ ونشر ${result.created + result.updated} درجة بنجاح` });
      await loadSubjectGrades(selectedSubject);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل حفظ الدرجات' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدرجة؟')) return;
    try {
      await deleteTeacherGrade(gradeId);
      setMessage({ type: 'success', text: 'تم حذف الدرجة بنجاح' });
      if (selectedSubject) {
        await loadSubjectGrades(selectedSubject);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل حذف الدرجة' });
    }
  };

  const handlePublishGrades = async (gradeIds: string[], publish: boolean) => {
    if (gradeIds.length === 0) return;
    setPublishing(true);
    setMessage(null);
    try {
      const result = await publishTeacherGrades(gradeIds, publish);
      setMessage({ type: 'success', text: result.message || (publish ? 'تم نشر الدرجات' : 'تم إلغاء نشر الدرجات') });
      if (selectedSubject) {
        await loadSubjectGrades(selectedSubject);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'فشل تحديث حالة النشر' });
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishAll = async (publish: boolean) => {
    const ids = existingGrades
      .filter((g: any) => g.is_published !== publish)
      .map((g: any) => g.id);
    if (ids.length === 0) {
      setMessage({ type: 'error', text: publish ? 'جميع الدرجات منشورة بالفعل' : 'لا توجد درجات منشورة لإلغاء نشرها' });
      return;
    }
    await handlePublishGrades(ids, publish);
  };

  // Filter existing grades by selected type for pre-filling
  useEffect(() => {
    const inputs: Record<string, string> = {};
    existingGrades.forEach((g: any) => {
      if (g.grade_type === selectedGradeType) {
        inputs[g.student_id] = String(g.grade_value);
      }
    });
    setGradeInputs(inputs);
  }, [selectedGradeType, existingGrades]);

  // Get grade summary per student
  const getStudentGradeSummary = (studentId: string) => {
    const studentGrades = existingGrades.filter((g: any) => g.student_id === studentId);
    const summary: Record<string, { value: number; max: number; count: number }> = {};
    
    studentGrades.forEach((g: any) => {
      if (!summary[g.grade_type]) {
        summary[g.grade_type] = { value: 0, max: 0, count: 0 };
      }
      summary[g.grade_type].value += parseFloat(g.grade_value);
      summary[g.grade_type].max += parseFloat(g.max_grade);
      summary[g.grade_type].count += 1;
    });

    const total = Object.values(summary).reduce((acc, s) => acc + s.value, 0);
    const totalMax = Object.values(summary).reduce((acc, s) => acc + s.max, 0);

    return { summary, total, totalMax };
  };

  const selectedSubjectData = subjects.find(s => s.subject_id === selectedSubject);
  const currentGradeType = GRADE_TYPES.find(t => t.value === selectedGradeType);

  // Grading helpers
  const getLetterGrade = (percentage: number) => {
    if (percentage >= 90) return { letter: 'A', label: 'ممتاز', color: 'text-green-700 bg-green-100' };
    if (percentage >= 80) return { letter: 'B', label: 'جيد جداً', color: 'text-blue-700 bg-blue-100' };
    if (percentage >= 70) return { letter: 'C', label: 'جيد', color: 'text-cyan-700 bg-cyan-100' };
    if (percentage >= 60) return { letter: 'D', label: 'مقبول', color: 'text-yellow-700 bg-yellow-100' };
    if (percentage >= 50) return { letter: 'D-', label: 'مقبول ضعيف', color: 'text-orange-700 bg-orange-100' };
    return { letter: 'F', label: 'راسب', color: 'text-red-700 bg-red-100' };
  };

  const draftCount = existingGrades.filter((g: any) => !g.is_published).length;
  const publishedCount = existingGrades.filter((g: any) => g.is_published).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">إدارة الدرجات والتقييم</h1>
        <p className="text-gray-600 text-sm">إدخال وإدارة درجات الطلاب - أعمال الفصل، امتحان نصفي، امتحان نهائي</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} ml-2`}></i>
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="mr-auto text-gray-400 hover:text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <i className="fas fa-book text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مواد مسندة إليك</h3>
          <p className="text-gray-500">يرجى التواصل مع الإدارة لإسناد المواد الدراسية</p>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {subjects.map((s: any) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject?.name} ({s.subject?.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع التقييم</label>
                <select
                  value={selectedGradeType}
                  onChange={(e) => setSelectedGradeType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {GRADE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label} (من {type.defaultMax})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Draft/Published Status Bar */}
            {existingGrades.length > 0 && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                {draftCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <i className="fas fa-file-alt ml-1"></i>
                    {draftCount} مسودة
                  </span>
                )}
                {publishedCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i className="fas fa-check-circle ml-1"></i>
                    {publishedCount} منشورة
                  </span>
                )}
                {(() => {
                  const failCount = existingGrades.filter((g: any) => {
                    const pct = (parseFloat(g.grade_value) / parseFloat(g.max_grade)) * 100;
                    return pct < 50;
                  }).length;
                  return failCount > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <i className="fas fa-exclamation-triangle ml-1"></i>
                      {failCount} أقل من 50%
                    </span>
                  ) : null;
                })()}
              </div>
            )}

            {/* View Toggle + Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setViewMode('input')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    viewMode === 'input' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-edit ml-1"></i>
                  إدخال الدرجات
                </button>
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-table ml-1"></i>
                  نظرة شاملة
                </button>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                {viewMode === 'overview' && existingGrades.length > 0 && (
                  <>
                    {draftCount > 0 && (
                      <button
                        onClick={() => handlePublishAll(true)}
                        disabled={publishing}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                      >
                        {publishing ? <i className="fas fa-spinner fa-spin ml-1"></i> : <i className="fas fa-paper-plane ml-1"></i>}
                        نشر الكل ({draftCount})
                      </button>
                    )}
                    {publishedCount > 0 && (
                      <button
                        onClick={() => handlePublishAll(false)}
                        disabled={publishing}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                      >
                        <i className="fas fa-eye-slash ml-1"></i>
                        إلغاء نشر الكل
                      </button>
                    )}
                  </>
                )}
                {viewMode === 'input' && (
                  <>
                    <button
                      onClick={handleSaveGrades}
                      disabled={saving || students.length === 0}
                      className="px-5 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                    >
                      {saving ? (
                        <>
                          <i className="fas fa-spinner fa-spin ml-2"></i>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save ml-2"></i>
                          حفظ كمسودة
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSaveAndPublish}
                      disabled={saving || students.length === 0}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                    >
                      {saving ? (
                        <>
                          <i className="fas fa-spinner fa-spin ml-2"></i>
                          جاري النشر...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane ml-2"></i>
                          حفظ ونشر
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Grade Type Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {GRADE_TYPES.map(type => {
              const typeGrades = existingGrades.filter((g: any) => g.grade_type === type.value);
              const isActive = selectedGradeType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedGradeType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-right ${
                    isActive
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <i className={`fas ${type.icon} text-${type.color}-500`}></i>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      typeGrades.length > 0 ? `bg-${type.color}-100 text-${type.color}-700` : 'bg-gray-100 text-gray-500'
                    }`}>
                      {typeGrades.length}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500">من {type.defaultMax}</div>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          {loadingGrades ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">جاري تحميل الدرجات...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-user-graduate text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد طلاب مسجلين</h3>
              <p className="text-gray-500">لا يوجد طلاب مسجلين في هذه المادة حالياً</p>
            </div>
          ) : viewMode === 'input' ? (
            /* Grade Input Table */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    <i className={`fas ${currentGradeType?.icon} ml-2 text-${currentGradeType?.color}-500`}></i>
                    إدخال {currentGradeType?.label} - {selectedSubjectData?.subject?.name}
                  </h3>
                  <span className="text-xs text-gray-500">{students.length} طالب</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الطالب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم الجامعي</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        الدرجة (من {maxGrade})
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any, index: number) => {
                      const currentValue = gradeInputs[student.id] || '';
                      const percentage = currentValue ? ((parseFloat(currentValue) / maxGrade) * 100).toFixed(0) : '-';
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {student.photo_url ? (
                                <img src={student.photo_url} alt="" className="w-8 h-8 rounded-full ml-2 object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2">
                                  <i className="fas fa-user text-gray-400 text-xs"></i>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">{student.campus_id}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={currentValue}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              min={0}
                              max={maxGrade}
                              step={0.5}
                              className="w-24 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="—"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-medium ${
                              percentage === '-' ? 'text-gray-400' :
                              Number(percentage) >= 60 ? 'text-green-600' :
                              Number(percentage) >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {percentage === '-' ? '—' : `${percentage}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Overview Table - All grade types */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">
                  <i className="fas fa-table ml-2"></i>
                  نظرة شاملة على الدرجات - {selectedSubjectData?.subject?.name}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">#</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">اسم الطالب</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">الرقم الجامعي</th>
                      {GRADE_TYPES.map(type => (
                        <th key={type.value} className="px-3 py-3 text-center text-xs font-medium text-gray-500">
                          <i className={`fas ${type.icon} ml-1 text-${type.color}-500`}></i>
                          {type.label}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 bg-gray-100">المجموع</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 bg-gray-100">التقدير</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">النشر</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any, index: number) => {
                      const { summary, total, totalMax } = getStudentGradeSummary(student.id);
                      const overallPct = totalMax > 0 ? (total / totalMax) * 100 : -1;
                      const letterInfo = overallPct >= 0 ? getLetterGrade(overallPct) : null;
                      const isFailing = overallPct >= 0 && overallPct < 50;
                      const studentGrades = existingGrades.filter((g: any) => g.student_id === student.id);
                      const allPublished = studentGrades.length > 0 && studentGrades.every((g: any) => g.is_published);
                      const somePublished = studentGrades.some((g: any) => g.is_published);
                      const studentDrafts = studentGrades.filter((g: any) => !g.is_published).length;
                      return (
                        <tr key={student.id} className={`hover:bg-gray-50 ${isFailing ? 'bg-red-50/40' : ''}`}>
                          <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                              {isFailing && (
                                <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                  <i className="fas fa-exclamation-triangle ml-0.5"></i>
                                  راسب
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm font-mono text-gray-700">{student.campus_id}</td>
                          {GRADE_TYPES.map(type => {
                            const s = summary[type.value];
                            return (
                              <td key={type.value} className="px-3 py-2 text-center">
                                {s ? (
                                  <span className={`text-sm font-medium ${
                                    (s.value / s.max) >= 0.6 ? 'text-green-600' :
                                    (s.value / s.max) >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {s.value}/{s.max}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center bg-gray-50">
                            <div>
                              <span className={`text-sm font-bold ${
                                overallPct >= 60 ? 'text-green-700' :
                                overallPct >= 50 ? 'text-yellow-700' :
                                overallPct >= 0 ? 'text-red-700' : 'text-gray-400'
                              }`}>
                                {totalMax > 0 ? `${total}/${totalMax}` : '—'}
                              </span>
                              {overallPct >= 0 && (
                                <div className="text-[10px] text-gray-400">{overallPct.toFixed(0)}%</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center bg-gray-50">
                            {letterInfo ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${letterInfo.color}`}>
                                {letterInfo.letter} — {letterInfo.label}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {studentGrades.length === 0 ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handlePublishGrades(studentGrades.map((g: any) => g.id), !allPublished)}
                                  disabled={publishing}
                                  className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                                    allPublished
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : somePublished
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                  title={allPublished ? 'إلغاء النشر' : 'نشر الدرجات'}
                                >
                                  <i className={`fas ${allPublished ? 'fa-check-circle' : somePublished ? 'fa-adjust' : 'fa-file-alt'} ml-1`}></i>
                                  {allPublished ? 'منشور' : somePublished ? 'جزئي' : 'مسودة'}
                                </button>
                                {studentDrafts > 0 && (
                                  <span className="text-[10px] text-amber-600">{studentDrafts} غير منشورة</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {studentGrades.length > 0 && (
                              <div className="flex items-center justify-center space-x-1 space-x-reverse">
                                {studentGrades.map((g: any) => (
                                    <button
                                      key={g.id}
                                      onClick={() => handleDeleteGrade(g.id)}
                                      className="text-red-400 hover:text-red-600 text-xs"
                                      title={`حذف ${g.grade_name}`}
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
