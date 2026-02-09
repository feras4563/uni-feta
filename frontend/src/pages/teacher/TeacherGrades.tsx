import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import { fetchMySubjects, fetchSubjectGrades, storeTeacherGrades, deleteTeacherGrade } from '../../lib/jwt-api';

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
  { value: 'assignment', label: 'واجب / تكليف', icon: 'fa-tasks', color: 'teal', defaultMax: 15 },
  { value: 'participation', label: 'حضور ومشاركة', icon: 'fa-clipboard-check', color: 'purple', defaultMax: 15 },
  { value: 'quiz', label: 'اختبار قصير', icon: 'fa-question-circle', color: 'yellow', defaultMax: 10 },
  { value: 'project', label: 'مشروع', icon: 'fa-project-diagram', color: 'indigo', defaultMax: 20 },
];

export default function TeacherGrades() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedGradeType, setSelectedGradeType] = useState<string>('classwork');
  const [gradeName, setGradeName] = useState<string>('');
  const [maxGrade, setMaxGrade] = useState<number>(30);
  const [students, setStudents] = useState<any[]>([]);
  const [existingGrades, setExistingGrades] = useState<any[]>([]);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'input' | 'overview'>('input');

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
      setGradeName(type.label);
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
    Object.entries(gradeInputs).forEach(([studentId, value]) => {
      if (value !== '' && value !== undefined) {
        grades.push({
          student_id: studentId,
          grade_type: selectedGradeType,
          grade_name: gradeName || GRADE_TYPES.find(t => t.value === selectedGradeType)?.label || selectedGradeType,
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
      setMessage({ type: 'success', text: `تم حفظ ${result.created + result.updated} درجة بنجاح (${result.created} جديدة، ${result.updated} محدثة)` });
      // Reload grades
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

  // Filter existing grades by selected type for pre-filling
  useEffect(() => {
    const inputs: Record<string, string> = {};
    existingGrades.forEach((g: any) => {
      if (g.grade_type === selectedGradeType && g.grade_name === gradeName) {
        inputs[g.student_id] = String(g.grade_value);
      }
    });
    setGradeInputs(inputs);
  }, [selectedGradeType, gradeName, existingGrades]);

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
        <p className="text-gray-600 text-sm">إدخال وإدارة درجات الطلاب - نصفي، نهائي، واجبات، حضور</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Grade Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم التقييم</label>
                <input
                  type="text"
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: امتحان نصفي 1"
                />
              </div>

              {/* Max Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدرجة القصوى</label>
                <input
                  type="number"
                  value={maxGrade}
                  onChange={(e) => setMaxGrade(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* View Toggle */}
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

              {viewMode === 'input' && (
                <button
                  onClick={handleSaveGrades}
                  disabled={saving || students.length === 0}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin ml-2"></i>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save ml-2"></i>
                      حفظ الدرجات
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Grade Type Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم الجامعي</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الطالب</th>
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
                          <td className="px-4 py-3 text-sm font-mono text-gray-700">{student.campus_id}</td>
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
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">الرقم الجامعي</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">اسم الطالب</th>
                      {GRADE_TYPES.map(type => (
                        <th key={type.value} className="px-3 py-3 text-center text-xs font-medium text-gray-500">
                          <i className={`fas ${type.icon} ml-1 text-${type.color}-500`}></i>
                          {type.label}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 bg-gray-100">المجموع</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any, index: number) => {
                      const { summary, total, totalMax } = getStudentGradeSummary(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2 text-sm font-mono text-gray-700">{student.campus_id}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{student.name}</td>
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
                            <span className={`text-sm font-bold ${
                              totalMax > 0 && (total / totalMax) >= 0.6 ? 'text-green-700' :
                              totalMax > 0 && (total / totalMax) >= 0.5 ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                              {totalMax > 0 ? `${total}/${totalMax}` : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {existingGrades.filter((g: any) => g.student_id === student.id).length > 0 && (
                              <div className="flex items-center justify-center space-x-1 space-x-reverse">
                                {existingGrades
                                  .filter((g: any) => g.student_id === student.id)
                                  .map((g: any) => (
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
