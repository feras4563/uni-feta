import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchStudentGroups,
  getStudentsInGroup,
  getAvailableStudentsForGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  fetchStudents
} from "@/lib/api";
import { 
  ArrowRight, 
  Search, 
  UserMinus, 
  Users, 
  GraduationCap,
  Building,
  Calendar,
  UserPlus,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  ShieldCheck,
  DollarSign,
  Ban
} from "lucide-react";
import { formatDate, toLatinDigits } from "@/lib/utils";

export default function StudentGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch group details
  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ["student-groups"],
    queryFn: () => fetchStudentGroups(),
  });

  const group = groups?.find((g: any) => g.id === id);

  // Fetch students in this group
  const { data: studentsInGroup, isLoading: loadingStudents, error: studentsError } = useQuery({
    queryKey: ["students-in-group", id],
    queryFn: () => getStudentsInGroup(id!),
    enabled: !!id,
  });

  // Fetch available students for this group
  const { data: availableStudents } = useQuery({
    queryKey: ["available-students", id, group?.department_id, group?.semester_id],
    queryFn: () => getAvailableStudentsForGroup(id!, group?.department_id, group?.semester_id),
    enabled: !!id && !!group?.department_id && !!group?.semester_id,
  });

  const filteredStudentsInGroup = useMemo(() => {
    if (!studentsInGroup) return [];
    if (!searchTerm) return studentsInGroup;
    const term = searchTerm.toLowerCase();
    return studentsInGroup.filter((reg: any) => 
      reg.student?.name?.toLowerCase().includes(term) ||
      reg.student?.national_id_passport?.toLowerCase().includes(term) ||
      reg.student?.email?.toLowerCase().includes(term)
    );
  }, [studentsInGroup, searchTerm]);

  const handleAddStudent = async (studentId: string) => {
    try {
      await addStudentToGroup(
        studentId,
        id!,
        group!.semester_id,
        group!.department_id,
        group!.semester_number
      );
      
      queryClient.invalidateQueries({ queryKey: ["students-in-group", id] });
      queryClient.invalidateQueries({ queryKey: ["student-groups"] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      
      alert("تم إضافة الطالب إلى المجموعة بنجاح");
    } catch (error: any) {
      const msg = error?.message || "خطأ في إضافة الطالب";
      alert(msg);
      throw error; // Re-throw so modal knows not to close
    }
  };

  const handleRemoveStudent = async (registrationId: string) => {
    if (!confirm("هل أنت متأكد من إزالة هذا الطالب من المجموعة؟")) return;
    try {
      await removeStudentFromGroup(registrationId, id!);
      
      queryClient.invalidateQueries({ queryKey: ["students-in-group", id] });
      queryClient.invalidateQueries({ queryKey: ["student-groups"] });
      queryClient.invalidateQueries({ queryKey: ["available-students"] });
      
      alert("تم إزالة الطالب من المجموعة بنجاح");
    } catch (error: any) {
      alert("خطأ في إزالة الطالب: " + (error?.message || "خطأ غير معروف"));
    }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["students-in-group", id] });
    queryClient.invalidateQueries({ queryKey: ["student-groups"] });
    queryClient.invalidateQueries({ queryKey: ["available-students"] });
  };

  // Loading state
  if (loadingGroups) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-3 text-gray-600">جاري تحميل بيانات المجموعة...</span>
      </div>
    );
  }

  // Group not found
  if (!group) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/student-groups")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة إلى مجموعات الطلاب
        </button>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">المجموعة غير موجودة</h3>
          <p className="mt-1 text-sm text-gray-500">المجموعة المطلوبة غير موجودة أو تم حذفها.</p>
        </div>
      </div>
    );
  }

  const deptName = group.department?.name || group.departments?.name || '-';
  const semName = group.semester?.name || group.semesters?.name || '-';
  const isFull = group.current_students >= group.max_students;

  const capacityPercent = group.max_students > 0 ? Math.round((group.current_students / group.max_students) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/student-groups")}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4 text-sm transition-colors"
          >
            <ArrowRight className="h-4 w-4 ml-1" />
            العودة إلى مجموعات الطلاب
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.group_name}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  {deptName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {semName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {group.current_students} / {group.max_students} طالب
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={refreshData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isFull}
              >
                <UserPlus className="h-4 w-4" />
                إضافة طالب
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الطلاب الحاليين</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{group.current_students}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 60 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{capacityPercent}% من السعة</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">السعة القصوى</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{group.max_students}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">{group.max_students - group.current_students} مقعد متاح</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">القسم</p>
                <p className="mt-2 text-lg font-bold text-gray-900 truncate">{deptName}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الفصل الدراسي</p>
                <p className="mt-2 text-lg font-bold text-gray-900 truncate">{semName}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="البحث في طلاب المجموعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">الطلاب المسجلين في المجموعة</h3>
              {studentsInGroup && <p className="text-sm text-gray-500 mt-1">{studentsInGroup.length} طالب مسجل</p>}
            </div>
          </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهوية</th>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                    جاري تحميل الطلاب...
                  </td>
                </tr>
              ) : studentsError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-500">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    خطأ في تحميل الطلاب: {(studentsError as any)?.message || 'خطأ غير معروف'}
                  </td>
                </tr>
              ) : filteredStudentsInGroup.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب مسجلين في هذه المجموعة بعد'}
                    {!searchTerm && (
                      <p className="mt-2 text-sm">
                        اضغط على <span className="font-medium text-green-600">"إضافة طالب"</span> لإضافة طلاب
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudentsInGroup.map((registration: any) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {registration.student?.national_id_passport ? toLatinDigits(registration.student.national_id_passport) : '-'}
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
                      {registration.registration_date 
                        ? formatDate(registration.registration_date) 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/students/${registration.student?.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="عرض تفاصيل الطالب"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(registration.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
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
            availableStudents={availableStudents || []}
            onClose={() => setShowAddModal(false)}
            onAddStudent={handleAddStudent}
            groupCapacity={group.max_students - group.current_students}
          />
        )}
      </div>
    </div>
  );
}

// Fee status badge component
function FeeStatusBadge({ student }: { student: any }) {
  const feeStatus = student.fee_status || 'unknown';
  const hasOverride = student.has_admin_override;
  const canJoin = student.can_join_group;

  if (canJoin && hasOverride) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <ShieldCheck className="h-3 w-3" />
        تجاوز إداري
      </span>
    );
  }
  if (feeStatus === 'paid' || canJoin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="h-3 w-3" />
        مدفوع
      </span>
    );
  }
  if (feeStatus === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <AlertCircle className="h-3 w-3" />
        مدفوع جزئياً
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <Ban className="h-3 w-3" />
      غير مدفوع
    </span>
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
  const [modalSearch, setModalSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [feeFilter, setFeeFilter] = useState<'all' | 'eligible' | 'unpaid'>('all');

  const displayStudents = useMemo(() => {
    let source = availableStudents;
    
    // Apply fee filter
    if (feeFilter === 'eligible') {
      source = source.filter((s: any) => s.can_join_group);
    } else if (feeFilter === 'unpaid') {
      source = source.filter((s: any) => !s.can_join_group);
    }
    
    if (!modalSearch) return source;
    const term = modalSearch.toLowerCase();
    return source.filter((s: any) =>
      s.name?.toLowerCase().includes(term) ||
      s.national_id_passport?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  }, [availableStudents, feeFilter, modalSearch]);

  const eligibleCount = availableStudents.filter((s: any) => s.can_join_group).length;
  const unpaidCount = availableStudents.filter((s: any) => !s.can_join_group).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setAdding(true);
    try {
      await onAddStudent(selectedStudent);
      onClose();
    } catch {
      // Error handled in parent
    } finally {
      setAdding(false);
    }
  };

  const selectedStudentData = availableStudents.find((s: any) => s.id === selectedStudent);
  const canAddSelected = selectedStudentData?.can_join_group;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">إضافة طالب إلى المجموعة</h3>
            <p className="text-sm text-gray-500 mt-1">السعة المتاحة: {groupCapacity} طالب</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-3 border-b border-gray-100 space-y-3">
          {/* Fee filter tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFeeFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                feeFilter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              الكل ({availableStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setFeeFilter('eligible')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                feeFilter === 'eligible' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                مؤهلين ({eligibleCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFeeFilter('unpaid')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                feeFilter === 'unpaid' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Ban className="h-3 w-3" />
                غير مدفوع ({unpaidCount})
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم الهوية أو البريد..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Info banner about fee requirement */}
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-700 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
            يجب أن يكون الطالب قد دفع الرسوم أو لديه تجاوز إداري من صفحة الرسوم للانضمام للمجموعة
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-3">
            {displayStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {modalSearch 
                    ? 'لا توجد نتائج للبحث' 
                    : feeFilter === 'eligible'
                      ? 'لا يوجد طلاب مؤهلين (جميعهم لم يدفعوا الرسوم)'
                      : feeFilter === 'unpaid'
                        ? 'جميع الطلاب دفعوا الرسوم'
                        : 'لا يوجد طلاب متاحين'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayStudents.map((student: any) => {
                  const canJoin = student.can_join_group;
                  return (
                    <label
                      key={student.id}
                      className={`flex items-center p-3 rounded-lg transition-colors border ${
                        !canJoin 
                          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : selectedStudent === student.id 
                            ? 'bg-blue-50 border-blue-300 cursor-pointer' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="student"
                        value={student.id}
                        checked={selectedStudent === student.id}
                        onChange={(e) => canJoin && setSelectedStudent(e.target.value)}
                        disabled={!canJoin}
                        className="ml-3 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${canJoin ? 'text-gray-900' : 'text-gray-500'}`}>
                            {student.name}
                          </span>
                          <FeeStatusBadge student={student} />
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {student.national_id_passport ? toLatinDigits(student.national_id_passport) : '-'} | {student.email || '-'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warning if selected student can't join */}
          {selectedStudent && !canAddSelected && (
            <div className="px-6 py-2 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                هذا الطالب لم يدفع الرسوم. يرجى تسجيل الدفع أو تفعيل التجاوز الإداري من صفحة الرسوم أولاً.
              </p>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!selectedStudent || adding || !canAddSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {adding && <Loader2 className="h-4 w-4 animate-spin" />}
              إضافة الطالب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
