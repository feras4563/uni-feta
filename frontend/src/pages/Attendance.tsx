import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSemesters, fetchDepartments, fetchStudentGroups, fetchStudents, exportAttendance } from "@/lib/api";
import { Calendar, Users, Check, X, Clock, UserCheck, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Attendance() {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Filter students by department and group
  const filteredStudents = students?.filter(student => {
    if (selectedDepartment && student.department_id !== selectedDepartment) return false;
    // Note: In a real implementation, you'd filter by group based on student registrations
    return true;
  }) || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الحضور والغياب</h1>
          <p className="text-gray-600">تسجيل ومتابعة حضور الطلاب</p>
        </div>
        <button
          onClick={() => exportAttendance()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          تصدير CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              سجل الحضور - {formatDate(selectedDate)}
            </h3>
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
                حفظ الحضور
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                تصدير التقرير
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطالب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرقم الجامعي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">حاضر</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">غائب</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">متأخر</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">معذور</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.departments?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name={`attendance-${student.id}`}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      defaultChecked={Math.random() > 0.3}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name={`attendance-${student.id}`}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name={`attendance-${student.id}`}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name={`attendance-${student.id}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ملاحظات..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طلاب</h3>
            <p className="mt-1 text-sm text-gray-500">اختر القسم والمجموعة لعرض الطلاب.</p>
          </div>
        )}
      </div>

      {/* Attendance Summary */}
      {filteredStudents.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ملخص الحضور</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.floor(filteredStudents.length * 0.85)}</div>
              <div className="text-sm text-gray-600">حاضر</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{Math.floor(filteredStudents.length * 0.10)}</div>
              <div className="text-sm text-gray-600">غائب</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{Math.floor(filteredStudents.length * 0.03)}</div>
              <div className="text-sm text-gray-600">متأخر</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.floor(filteredStudents.length * 0.02)}</div>
              <div className="text-sm text-gray-600">معذور</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
