import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSemesters, fetchDepartments, fetchStudentGroups, fetchStudents, fetchSubjects } from "@/lib/api";
import { GraduationCap, TrendingUp, Award, BarChart3, Plus, FileDown } from "lucide-react";

export default function Grades() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [viewMode, setViewMode] = useState<'entry' | 'report'>('entry');

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: studentGroups } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(selectedDepartment),
    enabled: !!selectedDepartment,
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchStudents(),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetchSubjects(),
  });

  // Filter students by department and group
  const filteredStudents = students?.filter(student => {
    if (selectedDepartment && student.department_id !== selectedDepartment) return false;
    return true;
  }) || [];

  // Mock grade data - in real implementation, this would come from API
  const generateMockGrades = (studentId: string) => ({
    midterm: Math.floor(Math.random() * 30) + 60, // 60-90
    final: Math.floor(Math.random() * 40) + 50,   // 50-90
    assignments: Math.floor(Math.random() * 20) + 70, // 70-90
    participation: Math.floor(Math.random() * 10) + 85, // 85-95
  });

  const calculateTotal = (grades: any) => {
    return Math.round(grades.midterm * 0.3 + grades.final * 0.4 + grades.assignments * 0.2 + grades.participation * 0.1);
  };

  const getGrade = (total: number) => {
    if (total >= 90) return { letter: 'A+', gpa: 4.0, status: 'ممتاز' };
    if (total >= 85) return { letter: 'A', gpa: 3.7, status: 'جيد جداً مرتفع' };
    if (total >= 80) return { letter: 'B+', gpa: 3.3, status: 'جيد جداً' };
    if (total >= 75) return { letter: 'B', gpa: 3.0, status: 'جيد مرتفع' };
    if (total >= 70) return { letter: 'C+', gpa: 2.7, status: 'جيد' };
    if (total >= 65) return { letter: 'C', gpa: 2.3, status: 'مقبول مرتفع' };
    if (total >= 60) return { letter: 'D+', gpa: 2.0, status: 'مقبول' };
    if (total >= 50) return { letter: 'D', gpa: 1.0, status: 'ضعيف' };
    return { letter: 'F', gpa: 0.0, status: 'راسب' };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">الدرجات والتقييم</h1>
        <p className="text-gray-600">إدارة درجات الطلاب والتقييمات</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">3.45</div>
              <div className="text-sm text-gray-600">متوسط المعدل العام</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">156</div>
              <div className="text-sm text-gray-600">الطلاب الناجحون</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">24</div>
              <div className="text-sm text-gray-600">الطلاب المتفوقون</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">89%</div>
              <div className="text-sm text-gray-600">معدل النجاح</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الفصل</option>
              {semesters?.map(semester => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر القسم</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المجموعة</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر المجموعة</option>
              {studentGroups?.map(group => (
                <option key={group.id} value={group.id}>{group.group_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر المادة</option>
              {subjects?.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2">
              <FileDown className="h-4 w-4" />
              تصدير
            </button>
          </div>
        </div>
      </div>

      {/* Grade Entry View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">إدخال الدرجات</h3>
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
                حفظ الدرجات
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة تقييم
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطالب</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الأعمال الفصلية (30%)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الامتحان النهائي (40%)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">التكليفات (20%)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المشاركة (10%)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المجموع</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">التقدير</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.slice(0, 10).map((student) => {
                const grades = generateMockGrades(student.id);
                const total = calculateTotal(grades);
                const gradeInfo = getGrade(total);
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        defaultValue={grades.midterm}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        defaultValue={grades.final}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        defaultValue={grades.assignments}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        defaultValue={grades.participation}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                      {total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        gradeInfo.gpa >= 3.0 ? 'bg-green-100 text-green-800' :
                        gradeInfo.gpa >= 2.0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {gradeInfo.letter}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        total >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {total >= 60 ? 'ناجح' : 'راسب'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طلاب</h3>
            <p className="mt-1 text-sm text-gray-500">اختر القسم والمجموعة لعرض الطلاب.</p>
          </div>
        )}
      </div>
    </div>
  );
}
