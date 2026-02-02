import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  fetchSemesters, 
  fetchDepartments
} from "@/lib/api";
import { apiRequest } from "@/lib/jwt-auth";
import { Calendar, Zap, List, AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function TimetableGeneration() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => fetchSemesters(),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments(),
  });

  const { data: timetables, isLoading: loadingTimetables } = useQuery({
    queryKey: ["timetables-by-semester", selectedSemester],
    queryFn: () => apiRequest(`/timetable/semester/${selectedSemester}`),
    enabled: !!selectedSemester,
  });

  const handleGenerate = async () => {
    if (!selectedSemester) {
      alert("الرجاء اختيار الفصل الدراسي");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await apiRequest('/timetable/auto-generate', {
        method: 'POST',
        body: JSON.stringify({
          semester_id: selectedSemester,
          department_id: selectedDepartment || null
        })
      });

      setResult(response);
      queryClient.invalidateQueries({ queryKey: ["timetables-by-semester", selectedSemester] });
    } catch (error: any) {
      setResult({
        message: error.message || "حدث خطأ أثناء إنشاء الجداول",
        generated: 0,
        errors: [error.message]
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleViewTimetable = (groupId: string) => {
    navigate(`/timetable/group/${groupId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء الجداول الدراسية</h1>
        <p className="text-gray-600">إنشاء جداول دراسية تلقائياً بناءً على تكليفات المدرسين وتوافرهم ومجموعات الطلاب</p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          إنشاء جداول جديدة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفصل الدراسي <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الفصل الدراسي</option>
              {semesters?.map((semester: any) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name} - {semester.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              القسم (اختياري)
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الأقسام</option>
              {departments?.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">متطلبات إنشاء الجداول:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>تكليفات المدرسين بالمواد (تكليف المدرسين بالمواد)</li>
                <li>توافر المدرسين (عضو هيئة التدريس - الجدول الأسبوعي)</li>
                <li>مجموعات الطلاب (مجموعات الطلاب)</li>
                <li>القاعات الدراسية (القاعات الدراسية)</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!selectedSemester || generating}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              جاري إنشاء الجداول...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              إنشاء الجداول تلقائياً
            </>
          )}
        </button>

        {/* Result Message */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.generated > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-2">
              {result.generated > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${result.generated > 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {result.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timetables List */}
      {selectedSemester && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <List className="h-5 w-5 text-blue-600" />
            الجداول الدراسية الحالية
          </h2>

          {loadingTimetables ? (
            <div className="text-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">جاري تحميل الجداول...</p>
            </div>
          ) : timetables && timetables.length > 0 ? (
            <div className="space-y-4">
              {timetables.map((timetable: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {timetable.group.group_name}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>القسم: {timetable.group.department?.name}</p>
                        <p>الفصل الدراسي: {timetable.group.semester?.name}</p>
                        <p>عدد الحصص: {timetable.entries.length}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewTimetable(timetable.group.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      عرض الجدول
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>لا توجد جداول دراسية لهذا الفصل</p>
              <p className="text-sm mt-1">قم بإنشاء جداول جديدة باستخدام النموذج أعلاه</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
