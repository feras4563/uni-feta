import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  fetchTeacherSubjects,
  fetchDepartments,
  deleteTeacherSubjectAssignment,
  updateTeacher
} from "../lib/api";
import { getTeacher } from "../lib/jwt-api";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  Award,
  Briefcase,
  CheckCircle,
  XCircle
} from "lucide-react";
import TeacherSubjectModal from "../components/teacher/TeacherSubjectModal";

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  // Fetch teacher data
  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher", id],
    queryFn: () => getTeacher(id!),
    enabled: !!id
  });

  // Fetch teacher subjects
  const { data: teacherSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["teacher-subjects", id],
    queryFn: () => fetchTeacherSubjects(Number(id)),
    enabled: !!id
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const handleAddSubject = () => {
    setEditingAssignment(null);
    setShowSubjectModal(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowSubjectModal(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التكليف؟")) return;

    try {
      await deleteTeacherSubjectAssignment(assignmentId);
      alert("تم حذف التكليف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["teacher-subjects"] });
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      alert("خطأ في حذف التكليف");
    }
  };

  const handleCloseSubjectModal = () => {
    setShowSubjectModal(false);
    setEditingAssignment(null);
    queryClient.invalidateQueries({ queryKey: ["teacher-subjects"] });
  };

  const handleEdit = () => {
    navigate(`/teachers/edit/${id}`, {
      state: {
        teacher: {
          ...teacher,
          availability: teacher.availability || {
            sunday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
            monday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
            tuesday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
            wednesday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false },
            thursday: { slot1: false, slot2: false, slot3: false, slot4: false, slot5: false }
          },
          specializations: teacher.specializations || [],
          department_ids: teacher.department?.id ? [teacher.department.id] : [],
          primary_department_id: teacher.department?.id || "",
          years_experience: teacher.years_experience || "",
          teaching_hours: teacher.teaching_hours || "",
          hourly_rate: teacher.hourly_rate || "",
          basic_salary: teacher.basic_salary || ""
        }
      }
    });
  };

  const workDays = [
    { key: "sunday", name: "الأحد" },
    { key: "monday", name: "الاثنين" },
    { key: "tuesday", name: "الثلاثاء" },
    { key: "wednesday", name: "الأربعاء" },
    { key: "thursday", name: "الخميس" }
  ];

  const timeSlots = [
    { key: "slot1", label: "08:00 - 10:00" },
    { key: "slot2", label: "10:00 - 12:00" },
    { key: "slot3", label: "12:00 - 14:00" },
    { key: "slot4", label: "14:00 - 16:00" },
    { key: "slot5", label: "16:00 - 18:00" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">جاري تحميل بيانات المدرس...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">لم يتم العثور على المدرس</h3>
          <p className="mt-1 text-sm text-gray-500">المدرس المطلوب غير موجود</p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/teachers")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للقائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/teachers")}
                className="p-2 ml-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{teacher.name}</h1>
                {teacher.name_en && (
                  <p className="text-sm text-gray-600 mt-1">{teacher.name_en}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل البيانات
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">الرتبة العلمية</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {teacher.qualification || "غير محدد"}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">سنوات الخبرة</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {teacher.years_experience ? `${teacher.years_experience} سنة` : "غير محدد"}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">المواد المكلف بها</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {teacherSubjects.length}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">ساعات التدريس</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {teacher.teaching_hours ? `${teacher.teaching_hours} ساعة` : "غير محدد"}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 ml-2 text-gray-600" />
                المعلومات الشخصية
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">الاسم الكامل</div>
                  <div className="text-gray-900 mt-1">{teacher.name}</div>
                  {teacher.name_en && (
                    <div className="text-gray-600 text-sm mt-0.5">{teacher.name_en}</div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">البريد الإلكتروني</div>
                  <div className="flex items-center text-gray-900">
                    <Mail className="w-4 h-4 ml-2 text-gray-400" />
                    {teacher.email || "غير محدد"}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">رقم الهاتف</div>
                  <div className="flex items-center text-gray-900">
                    <Phone className="w-4 h-4 ml-2 text-gray-400" />
                    {teacher.phone || "غير محدد"}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 ml-2 text-gray-600" />
                المعلومات الأكاديمية
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">المؤهل العلمي</div>
                  <div className="text-gray-900 mt-1">{teacher.education_level || "غير محدد"}</div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600">الرتبة العلمية</div>
                  <div className="text-gray-900 mt-1">{teacher.qualification || "غير محدد"}</div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600">سنوات الخبرة</div>
                  <div className="text-gray-900 mt-1">
                    {teacher.years_experience ? `${teacher.years_experience} سنة` : "غير محدد"}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">الأقسام</div>
                  {teacher.departments && teacher.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teacher.departments.map((dept: any, index: number) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${
                            dept.is_primary_department
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {dept.department_name}
                          {dept.is_primary_department && (
                            <span className="mr-1 px-1.5 bg-blue-200 text-blue-900 text-xs rounded-full">
                              رئيسي
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">غير محدد</div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">التخصصات الدقيقة</div>
                  {teacher.specializations && teacher.specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teacher.specializations.map((spec: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">غير محدد</div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 ml-2 text-gray-600" />
                المعلومات المالية
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">الراتب الأساسي</div>
                  <div className="text-gray-900 mt-1">
                    {teacher.basic_salary ? `${teacher.basic_salary} دينار` : "غير محدد"}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600">معدل الساعة الإضافية</div>
                  <div className="text-gray-900 mt-1">
                    {teacher.hourly_rate ? `${teacher.hourly_rate} دينار` : "غير محدد"}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium text-gray-600">ساعات التدريس الأسبوعية</div>
                  <div className="text-gray-900 mt-1">
                    {teacher.teaching_hours ? `${teacher.teaching_hours} ساعة` : "غير محدد"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Subjects & Availability */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Subjects */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpen className="w-5 h-5 ml-2 text-gray-600" />
                  المواد المكلف بها
                </h3>
                <button
                  onClick={handleAddSubject}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مادة
                </button>
              </div>

              {subjectsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600">جاري تحميل المواد...</p>
                </div>
              ) : teacherSubjects.length > 0 ? (
                <div className="space-y-3">
                  {teacherSubjects.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {assignment.subjects?.name || "مادة غير معروفة"}
                            </h4>
                            <span className="text-sm text-gray-500">
                              ({assignment.subjects?.code || "N/A"})
                            </span>
                            {assignment.is_primary_teacher && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                مدرس رئيسي
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 ml-1" />
                              {assignment.departments?.name || "قسم غير محدد"}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 ml-1" />
                              {assignment.study_years?.name || assignment.academic_year || "سنة غير محددة"}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 ml-1" />
                              {assignment.semesters?.name ||
                                (assignment.semester === "fall"
                                  ? "الفصل الأول"
                                  : assignment.semester === "spring"
                                  ? "الفصل الثاني"
                                  : "الفصل الصيفي")}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-4 text-sm">
                            {assignment.can_edit_grades && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 ml-1" />
                                تعديل الدرجات
                              </span>
                            )}
                            {assignment.can_take_attendance && (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 ml-1" />
                                أخذ الحضور
                              </span>
                            )}
                          </div>

                          {assignment.notes && (
                            <div className="mt-2 text-sm text-gray-600 italic">
                              {assignment.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">لا توجد مواد مكلف بها حالياً</p>
                  <button
                    onClick={handleAddSubject}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول مادة
                  </button>
                </div>
              )}
            </div>

            {/* Weekly Availability */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 ml-2 text-gray-600" />
                الجدول الأسبوعي والتوفر
              </h3>

              {teacher.availability ? (
                <div className="overflow-x-auto">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-6 bg-gray-50 border-b">
                      <div className="px-4 py-3 font-medium text-gray-700 border-l text-center">
                        الوقت
                      </div>
                      {workDays.map((day) => (
                        <div
                          key={day.key}
                          className="px-4 py-3 font-medium text-gray-700 text-center border-l last:border-l-0"
                        >
                          {day.name}
                        </div>
                      ))}
                    </div>

                    {timeSlots.map((slot) => (
                      <div key={slot.key} className="grid grid-cols-6 border-b last:border-b-0">
                        <div className="px-4 py-4 bg-gray-50 border-l font-medium text-sm text-gray-700 text-center">
                          {slot.label}
                        </div>
                        {workDays.map((day) => {
                          const isAvailable =
                            teacher.availability?.[day.key]?.[slot.key] || false;
                          return (
                            <div
                              key={day.key}
                              className={`px-4 py-4 border-l last:border-l-0 flex justify-center items-center ${
                                isAvailable ? "bg-green-50" : "bg-white"
                              }`}
                            >
                              {isAvailable ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-50 border border-green-200 rounded ml-2"></div>
                      <span className="text-gray-600">متاح</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-white border border-gray-200 rounded ml-2"></div>
                      <span className="text-gray-600">غير متاح</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">لم يتم تحديد الجدول الأسبوعي</p>
                  <button
                    onClick={handleEdit}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    تحديد الجدول
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Subject Modal */}
      <TeacherSubjectModal
        isOpen={showSubjectModal}
        onClose={handleCloseSubjectModal}
        teacherId={teacher.id}
        editingAssignment={editingAssignment}
        mode="teacher"
      />
    </div>
  );
}


