import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchStudentGroups,
  getStudentsInGroup,
  getAvailableStudentsForGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  testTablesExist
} from "@/lib/api";
import { 
  ArrowRight, 
  Plus, 
  Search, 
  UserMinus, 
  Users, 
  GraduationCap,
  Building,
  Calendar,
  UserPlus,
  Eye
} from "lucide-react";

export default function StudentGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch group details
  const { data: groups } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(),
  });

  const group = groups?.find(g => g.id === id);

  // Test if tables exist (for debugging)
  React.useEffect(() => {
    testTablesExist().then(result => {
      console.log("Table existence test:", result);
    });
  }, []);

  // Fetch students in this group
  const { data: studentsInGroup, isLoading: loadingStudents, error: studentsError } = useQuery({
    queryKey: ["students-in-group", id],
    queryFn: () => getStudentsInGroup(id!),
    enabled: !!id,
  });

  // Debug logging
  React.useEffect(() => {
    console.log("Students in group:", studentsInGroup);
    console.log("Loading students:", loadingStudents);
    console.log("Students error:", studentsError);
  }, [studentsInGroup, loadingStudents, studentsError]);

  // Fetch available students for this group
  const { data: availableStudents, error: availableStudentsError } = useQuery({
    queryKey: ["available-students", id, group?.department_id, group?.semester_id],
    queryFn: () => {
      console.log('🔍 Fetching available students for group:', id, 'department:', group?.department_id, 'semester:', group?.semester_id);
      return getAvailableStudentsForGroup(id!, group?.department_id, group?.semester_id);
    },
    enabled: !!id && !!group?.department_id && !!group?.semester_id,
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
  });

  // Debug logging for available students
  React.useEffect(() => {
    console.log("Available students:", availableStudents);
    console.log("Available students error:", availableStudentsError);
    console.log("Group data:", group);
  }, [availableStudents, availableStudentsError, group]);

  const filteredStudentsInGroup = useMemo(() => {
    if (!studentsInGroup) return [];
    return studentsInGroup.filter(student => 
      student.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student?.national_id_passport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student?.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [studentsInGroup, searchTerm]);

  const filteredAvailableStudents = useMemo(() => {
    if (!availableStudents) return [];
    return availableStudents.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.national_id_passport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableStudents, searchTerm]);

  const handleAddStudent = async (studentId: string) => {
    try {
      console.log('🚀 Adding student to group:', studentId, 'group:', id);
      await addStudentToGroup(
        studentId,
        id!,
        group!.semester_id,
        group!.department_id,
        group!.semester_number
      );
      
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["students-in-group", id] });
      queryClient.invalidateQueries({ queryKey: ["student-groups"] });
      queryClient.invalidateQueries({ queryKey: ["available-students", id] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] }); // Invalidate all available student queries
      
      alert("تم إضافة الطالب إلى المجموعة بنجاح");
    } catch (error: any) {
      console.error("❌ Error adding student:", error);
      let errorMessage = "خطأ في إضافة الطالب";
      
      if (error.code === '409') {
        errorMessage = "الطالب مسجل بالفعل في هذا الفصل الدراسي";
      } else if (error.message) {
        // Check if it's our custom duplicate error message
        if (error.message.includes('مسجل بالفعل في مجموعة أخرى')) {
          errorMessage = error.message; // Show our custom Arabic message
        } else {
          errorMessage = `خطأ في إضافة الطالب: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleRemoveStudent = async (registrationId: string) => {
    if (confirm("هل أنت متأكد من إزالة هذا الطالب من المجموعة؟")) {
      try {
        await removeStudentFromGroup(registrationId, id!);
        
        queryClient.invalidateQueries({ queryKey: ["students-in-group", id] });
        queryClient.invalidateQueries({ queryKey: ["student-groups"] });
        queryClient.invalidateQueries({ queryKey: ["available-students", id] });
        
        alert("تم إزالة الطالب من المجموعة بنجاح");
      } catch (error: any) {
        alert("خطأ في إزالة الطالب: " + error.message);
      }
    }
  };

  if (!group) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">المجموعة غير موجودة</h3>
          <p className="mt-1 text-sm text-gray-500">المجموعة المطلوبة غير موجودة أو تم حذفها.</p>
        </div>
      </div>
    );
  }

  // Show a message if there are API errors (likely due to missing tables)
  if (studentsInGroup === undefined && !loadingStudents) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/student-groups")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة إلى مجموعات الطلاب
        </button>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">تحذير: قاعدة البيانات</h3>
          <p className="text-yellow-700 mb-4">
            يبدو أن جداول إدارة المجموعات الطلابية غير موجودة في قاعدة البيانات. 
            يرجى تشغيل ملف الترحيل (Migration) أولاً.
          </p>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">خطوات الحل:</h4>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>افتح Supabase Dashboard</li>
              <li>اذهب إلى SQL Editor</li>
              <li>شغل ملف <code className="bg-yellow-200 px-1 rounded">final-correct-migration.sql</code></li>
              <li>أعد تحميل الصفحة</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/student-groups")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة إلى مجموعات الطلاب
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.group_name}</h1>
            <p className="text-gray-600">إدارة طلاب المجموعة</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {group.departments?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {group.semesters?.name}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.current_students} / {group.max_students} طالب
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["available-students", id] });
                queryClient.invalidateQueries({ queryKey: ["students-in-group", id] });
                alert("تم تحديث قائمة الطلاب المتاحين");
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              تحديث القائمة
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              disabled={group.current_students >= group.max_students}
            >
              <UserPlus className="h-4 w-4" />
              إضافة طالب
            </button>
          </div>
        </div>
      </div>

      {/* Group Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{group.current_students}</div>
              <div className="text-sm text-gray-600">الطلاب المسجلين</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{group.max_students}</div>
              <div className="text-sm text-gray-600">السعة القصوى</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-lg font-bold text-gray-900">{group.subjects?.name || group.departments?.name}</div>
              <div className="text-sm text-gray-600">{group.subjects ? 'المقرر' : 'القسم'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <div className="text-lg font-bold text-gray-900">{group.teachers?.name || group.semesters?.name}</div>
              <div className="text-sm text-gray-600">{group.teachers ? 'المعلم' : 'الفصل الدراسي'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث عن الطلاب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">الطلاب المسجلين في المجموعة</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهوية/الرقم الجامعي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطالب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingStudents ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    جاري تحميل الطلاب...
                  </td>
                </tr>
              ) : studentsError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    خطأ في تحميل الطلاب: {studentsError.message}
                  </td>
                </tr>
              ) : filteredStudentsInGroup.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    لا يوجد طلاب مسجلين في هذه المجموعة
                  </td>
                </tr>
              ) : (
                filteredStudentsInGroup.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {registration.student?.national_id_passport || registration.student?.id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.student?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.student?.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registration.student?.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(registration.registration_date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/students/${registration.student?.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="عرض تفاصيل الطالب"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(registration.id)}
                          className="text-red-600 hover:text-red-900"
                          title="إزالة من المجموعة"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          availableStudents={filteredAvailableStudents}
          onClose={() => setShowAddModal(false)}
          onAddStudent={handleAddStudent}
          groupCapacity={group.max_students - group.current_students}
        />
      )}
    </div>
  );
}

// Add Student Modal Component
function AddStudentModal({ 
  availableStudents, 
  onClose, 
  onAddStudent, 
  groupCapacity 
}: { 
  availableStudents: any[]; 
  onClose: () => void; 
  onAddStudent: (studentId: string) => void;
  groupCapacity: number;
}) {
  const [selectedStudent, setSelectedStudent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      onAddStudent(selectedStudent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">إضافة طالب إلى المجموعة</h3>
          <p className="text-sm text-gray-500 mt-1">السعة المتاحة: {groupCapacity} طالب</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر الطالب
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">اختر طالب...</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.national_id_passport || student.id} - {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          {availableStudents.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                لا يوجد طلاب متاحين لإضافتهم إلى هذه المجموعة
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!selectedStudent || availableStudents.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إضافة الطالب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
