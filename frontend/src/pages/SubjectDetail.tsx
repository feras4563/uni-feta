import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSubjectWithStats, updateSubject, updateSubjectDepartments, getSubjectDepartments, fetchDepartments, fetchTeachers, createSubjectTitle, updateSubjectTitle, deleteSubjectTitle, uploadSubjectPDF, deleteSubjectPDF, fetchSubjectTeachers, createTeacherSubjectAssignment, updateTeacherSubjectAssignment, deleteTeacherSubjectAssignment } from "../lib/api";
import { usePermissions } from "../hooks/usePermissions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import TeacherSubjectModal from "../components/teacher/TeacherSubjectModal";

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasClientPermission } = usePermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    name_en: "",
    credits: 0,
    teacher_id: "",
    semester: "",
    max_students: 0,
    department_ids: [] as string[],
    primary_department_id: "",
    cost_per_credit: 0,
    total_cost: 0,
    is_required: true,
    semester_number: 1,
  });

  // Subject titles management
  const [showAddTitle, setShowAddTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState<any>(null);
  const [titleForm, setTitleForm] = useState({
    title: "",
    title_en: "",
    description: "",
  });

  // PDF management
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Teacher management
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  const { data: subjectData, isLoading, error } = useQuery({
    queryKey: ["subject", id],
    queryFn: () => fetchSubjectWithStats(id!),
    enabled: !!id,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => fetchTeachers(),
  });

  const { data: subjectDepartments, error: departmentsError } = useQuery({
    queryKey: ["subject-departments", id],
    queryFn: () => getSubjectDepartments(id!),
    enabled: !!id,
  });


  const { data: subjectTeachers = [] } = useQuery({
    queryKey: ["subject-teachers", id],
    queryFn: () => fetchSubjectTeachers(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (subjectData?.subject) {
      console.log("Loading subject data:", subjectData.subject);
      console.log("Subject departments:", subjectDepartments);
      console.log("Departments error:", departmentsError);
      setEditForm({
        code: subjectData.subject.code || "",
        name: subjectData.subject.name || "",
        name_en: subjectData.subject.name_en || "",
        credits: subjectData.subject.credits || 0,
        teacher_id: subjectData.subject.teacher_id || "",
        semester: subjectData.subject.semester || "",
        max_students: subjectData.subject.max_students || 0,
        department_ids: subjectDepartments ? subjectDepartments.map((sd: any) => sd.department_id) : [],
        primary_department_id: subjectDepartments ? subjectDepartments.find((sd: any) => sd.is_primary_department)?.department_id || "" : "",
        cost_per_credit: subjectData.subject.cost_per_credit || 0,
        total_cost: subjectData.subject.total_cost || 0,
        is_required: subjectData.subject.is_required !== false,
        semester_number: subjectData.subject.semester_number || 1,
      });
    }
  }, [subjectData, subjectDepartments]);

  // Separate effect to update department data when it becomes available
  useEffect(() => {
    if (subjectDepartments && subjectData?.subject) {
      setEditForm(prev => ({
        ...prev,
        department_ids: subjectDepartments.map((sd: any) => sd.department_id),
        primary_department_id: subjectDepartments.find((sd: any) => sd.is_primary_department)?.department_id || "",
      }));
    }
  }, [subjectDepartments]);

  const handleInputChange = (field: string, value: any) => {
    setEditForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Auto-calculate total cost when credits or cost_per_credit changes
      if (field === 'credits' || field === 'cost_per_credit') {
        newForm.total_cost = newForm.credits * newForm.cost_per_credit;
      }
      
      return newForm;
    });
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setEditForm(prev => {
      const newDepartmentIds = prev.department_ids.includes(departmentId)
        ? prev.department_ids.filter(id => id !== departmentId)
        : [...prev.department_ids, departmentId];
      
      // If we're removing the primary department, set a new one
      let newPrimaryDepartmentId = prev.primary_department_id;
      if (prev.primary_department_id === departmentId && newDepartmentIds.length > 0) {
        newPrimaryDepartmentId = newDepartmentIds[0];
      }
      
      return {
        ...prev,
        department_ids: newDepartmentIds,
        primary_department_id: newPrimaryDepartmentId
      };
    });
  };

  const handlePrimaryDepartmentChange = (departmentId: string) => {
    setEditForm(prev => ({ ...prev, primary_department_id: departmentId }));
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!editForm.code.trim()) {
        alert("كود المقرر مطلوب");
        return;
      }
      
      if (!editForm.name.trim()) {
        alert("اسم المقرر مطلوب");
        return;
      }
      
      if (editForm.department_ids.length === 0) {
        alert("يجب اختيار قسم واحد على الأقل");
        return;
      }
      
      if (editForm.credits <= 0) {
        alert("عدد الساعات المعتمدة يجب أن يكون أكبر من صفر");
        return;
      }

      // Update subject basic information
      const subjectData = {
        code: editForm.code.trim(),
        name: editForm.name.trim(),
        name_en: editForm.name_en.trim() || null,
        credits: editForm.credits,
        teacher_id: editForm.teacher_id || null,
        semester: editForm.semester || null,
        max_students: editForm.max_students || null,
        cost_per_credit: editForm.cost_per_credit || null,
        semester_number: editForm.semester_number || null,
        is_required: editForm.is_required,
      };
      
      await updateSubject(id!, subjectData);
      
      // Update department relationships
      await updateSubjectDepartments(
        id!,
        editForm.department_ids,
        editForm.primary_department_id || editForm.department_ids[0]
      );
      
      queryClient.invalidateQueries({ queryKey: ["subject", id] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subject-departments", id] });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating subject:", error);
      alert("خطأ في تحديث المقرر الدراسي");
    }
  };

  const handleCancel = () => {
    if (subjectData?.subject) {
      setEditForm({
        code: subjectData.subject.code || "",
        name: subjectData.subject.name || "",
        name_en: subjectData.subject.name_en || "",
        credits: subjectData.subject.credits || 0,
        teacher_id: subjectData.subject.teacher_id || "",
        semester: subjectData.subject.semester || "",
        max_students: subjectData.subject.max_students || 0,
        department_ids: subjectDepartments ? subjectDepartments.map((sd: any) => sd.department_id) : [],
        primary_department_id: subjectDepartments ? subjectDepartments.find((sd: any) => sd.is_primary_department)?.department_id || "" : "",
        cost_per_credit: subjectData.subject.cost_per_credit || 0,
        total_cost: subjectData.subject.total_cost || 0,
        is_required: subjectData.subject.is_required !== false,
        semester_number: subjectData.subject.semester_number || 1,
      });
    }
    setIsEditing(false);
  };

  // Teacher management handlers
  const handleAddTeacher = () => {
    setEditingAssignment(null);
    setShowTeacherModal(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowTeacherModal(true);
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

  const handleCloseTeacherModal = () => {
    setShowTeacherModal(false);
    setEditingAssignment(null);
    queryClient.invalidateQueries({ queryKey: ["subject-teachers"] });
  };

  // Subject titles functions
  const handleAddTitle = () => {
    setTitleForm({ title: "", title_en: "", description: "" });
    setEditingTitle(null);
    setShowAddTitle(true);
  };

  const handleEditTitle = (title: any) => {
    setTitleForm({
      title: title.title || "",
      title_en: title.title_en || "",
      description: title.description || "",
    });
    setEditingTitle(title);
    setShowAddTitle(true);
  };

  const handleSaveTitle = async () => {
    try {
      const titleData = {
        subject_id: id!,
        title: titleForm.title.trim(),
        title_en: titleForm.title_en.trim() || null,
        description: titleForm.description.trim() || null,
        order_index: subjectData?.titles?.length || 0,
      };

      if (editingTitle) {
        await updateSubjectTitle(editingTitle.id, titleData);
      } else {
        await createSubjectTitle(titleData);
      }

      queryClient.invalidateQueries({ queryKey: ["subject", id] });
      setShowAddTitle(false);
      setEditingTitle(null);
      setTitleForm({ title: "", title_en: "", description: "" });
    } catch (error) {
      console.error("Error saving title:", error);
      alert("خطأ في حفظ العنوان");
    }
  };

  const handleDeleteTitle = async (titleId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العنوان؟")) {
      try {
        await deleteSubjectTitle(titleId);
        queryClient.invalidateQueries({ queryKey: ["subject", id] });
      } catch (error) {
        console.error("Error deleting title:", error);
        alert("خطأ في حذف العنوان");
      }
    }
  };

  const handleCancelTitle = () => {
    setShowAddTitle(false);
    setEditingTitle(null);
    setTitleForm({ title: "", title_en: "", description: "" });
  };

  // PDF management functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        alert('يجب أن يكون الملف من نوع PDF');
        return;
      }
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleUploadPDF = async () => {
    if (!pdfFile || !id) return;

    setUploadingPdf(true);
    try {
      const pdfData = await uploadSubjectPDF(pdfFile, id);
      await updateSubject(id, {
        pdf_file_url: pdfData.url,
        pdf_file_name: pdfData.fileName,
        pdf_file_size: pdfData.fileSize,
      });
      queryClient.invalidateQueries({ queryKey: ["subject", id] });
      setPdfFile(null);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("خطأ في رفع الملف");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeletePDF = async () => {
    if (!subject?.pdf_file_url || !id) return;

    if (window.confirm("هل أنت متأكد من حذف ملف PDF؟")) {
      try {
        await deleteSubjectPDF(subject.pdf_file_url);
        await updateSubject(id, {
          pdf_file_url: null,
          pdf_file_name: null,
          pdf_file_size: null,
        });
        queryClient.invalidateQueries({ queryKey: ["subject", id] });
      } catch (error) {
        console.error("Error deleting PDF:", error);
        alert("خطأ في حذف الملف");
      }
    }
  };

  const removePdfFile = () => {
    setPdfFile(null);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="خطأ في تحميل بيانات المقرر الدراسي" />;
  if (!subjectData?.subject) return <ErrorMessage message="المقرر الدراسي غير موجود" />;

  const { subject, students, department, teacher } = subjectData;
  const titles = subject.titles || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/study-materials")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-4"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-3 bg-blue-100 rounded-lg ml-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0-2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? "تعديل المقرر الدراسي" : subject.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditing ? "تعديل تفاصيل المقرر الدراسي" : `كود المقرر: ${subject.code}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {!isEditing && hasClientPermission("subjects", "edit") && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  تعديل المقرر
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200 shadow-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    حفظ التغييرات
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  المعلومات الأساسية
                </h3>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        كود المقرر <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.code}
                        onChange={(e) => handleInputChange("code", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم المقرر (عربي) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم المقرر (إنجليزي)
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.name_en}
                        onChange={(e) => handleInputChange("name_en", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عدد الساعات المعتمدة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.credits}
                        onChange={(e) => handleInputChange("credits", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الفصل الدراسي
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.semester}
                        onChange={(e) => handleInputChange("semester", e.target.value)}
                      >
                        <option value="">اختر الفصل الدراسي</option>
                        <option value="1">الفصل الأول</option>
                        <option value="2">الفصل الثاني</option>
                        <option value="3">الفصل الثالث</option>
                        <option value="4">الفصل الرابع</option>
                        <option value="5">الفصل الخامس</option>
                        <option value="6">الفصل السادس</option>
                        <option value="7">الفصل السابع</option>
                        <option value="8">الفصل الثامن</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدرس المسؤول
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.teacher_id}
                        onChange={(e) => handleInputChange("teacher_id", e.target.value)}
                      >
                        <option value="">اختر المدرس</option>
                        {teachers?.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الحد الأقصى للطلاب
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.max_students}
                        onChange={(e) => handleInputChange("max_students", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تكلفة الساعة المعتمدة (دينار)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.cost_per_credit}
                        onChange={(e) => handleInputChange("cost_per_credit", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        التكلفة الإجمالية (دينار)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        value={editForm.total_cost}
                        readOnly
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        الساعات المعتمدة × تكلفة الساعة المعتمدة
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الفصل الدراسي
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.semester_number}
                        onChange={(e) => handleInputChange("semester_number", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نوع المقرر
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editForm.is_required ? "required" : "optional"}
                        onChange={(e) => handleInputChange("is_required", e.target.value === "required")}
                      >
                        <option value="required">مقرر مطلوب</option>
                        <option value="optional">مقرر اختياري</option>
                      </select>
                    </div>
                    
                    {/* Department Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الأقسام <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {/* Department Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {departments?.map((dept) => (
                            <label key={dept.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.department_ids.includes(dept.id)}
                                onChange={() => handleDepartmentToggle(dept.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                              {dept.name_en && (
                                <span className="text-xs text-gray-500">({dept.name_en})</span>
                              )}
                            </label>
                          ))}
                        </div>
                        
                        {/* Primary Department Selection */}
                        {editForm.department_ids.length > 1 && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                              القسم الرئيسي
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={editForm.primary_department_id}
                              onChange={(e) => handlePrimaryDepartmentChange(e.target.value)}
                            >
                              <option value="">اختر القسم الرئيسي</option>
                              {editForm.department_ids.map((deptId) => {
                                const dept = departments?.find(d => d.id === deptId);
                                return dept ? (
                                  <option key={deptId} value={deptId}>
                                    {dept.name}
                                  </option>
                                ) : null;
                              })}
                            </select>
                          </div>
                        )}
                        
                        {/* Selected Departments Summary */}
                        {editForm.department_ids.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-2">الأقسام المختارة:</p>
                            <div className="flex flex-wrap gap-2">
                              {editForm.department_ids.map((deptId) => {
                                const dept = departments?.find(d => d.id === deptId);
                                const isPrimary = deptId === editForm.primary_department_id;
                                return dept ? (
                                  <span
                                    key={deptId}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      isPrimary 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {dept.name}
                                    {isPrimary && <span className="ml-1">(رئيسي)</span>}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">كود المقرر</label>
                        <p className="text-lg font-semibold text-gray-900">{subject.code}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">اسم المقرر (عربي)</label>
                        <p className="text-lg font-semibold text-gray-900">{subject.name}</p>
                      </div>
                      {subject.name_en && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">اسم المقرر (إنجليزي)</label>
                          <p className="text-lg font-semibold text-gray-900">{subject.name_en}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">عدد الساعات المعتمدة</label>
                        <p className="text-lg font-semibold text-gray-900">{subject.credits} ساعة</p>
                      </div>
                      {subject.cost_per_credit && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">تكلفة الساعة المعتمدة</label>
                          <p className="text-lg font-semibold text-green-600">{subject.cost_per_credit.toLocaleString()} دينار</p>
                        </div>
                      )}
                      {subject.total_cost && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">التكلفة الإجمالية</label>
                          <p className="text-lg font-semibold text-green-600">{subject.total_cost.toLocaleString()} دينار</p>
                        </div>
                      )}
                      {subject.semester_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">رقم الفصل الدراسي</label>
                          <p className="text-lg font-semibold text-gray-900">الفصل {subject.semester_number}</p>
                        </div>
                      )}
                      {subject.is_required !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">نوع المقرر</label>
                          <p className="text-lg font-semibold text-gray-900">
                            {subject.is_required ? 'مقرر مطلوب' : 'مقرر اختياري'}
                          </p>
                        </div>
                      )}
                      {subject.semester && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">الفصل الدراسي</label>
                          <p className="text-lg font-semibold text-gray-900">الفصل {subject.semester}</p>
                        </div>
                      )}
                      {subject.max_students && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">الحد الأقصى للطلاب</label>
                          <p className="text-lg font-semibold text-gray-900">{subject.max_students} طالب</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Department Information */}
                    {subjectDepartments && subjectDepartments.length > 0 && (
                      <div className="md:col-span-2 mt-6">
                        <label className="block text-sm font-medium text-gray-500 mb-3">الأقسام</label>
                        <div className="flex flex-wrap gap-2">
                          {subjectDepartments.map((sd: any) => {
                            const dept = departments?.find(d => d.id === sd.department_id);
                            return dept ? (
                              <span
                                key={sd.id}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  sd.is_primary_department 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}
                              >
                                {dept.name}
                                {sd.is_primary_department && (
                                  <span className="mr-1 text-xs">(رئيسي)</span>
                                )}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Students Enrolled */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  الطلاب المسجلين ({students?.length || 0})
                </h3>
              </div>
              <div className="p-6">
                {students && students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student: any) => (
                      <div key={student.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 text-sm">{student.name}</h5>
                            <p className="text-xs text-gray-600 mt-1">ID: {student.id}</p>
                            <div className="flex items-center mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.status === 'active' ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد طلاب مسجلين</h3>
                    <p className="mt-1 text-sm text-gray-500">لم يتم تسجيل أي طلاب في هذا المقرر بعد.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Teachers Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    المدرسين المسؤولين ({subjectTeachers.length})
                  </h3>
                  {hasClientPermission("subjects", "edit") && (
                    <button
                      onClick={handleAddTeacher}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إضافة مدرس
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {subjectTeachers.length > 0 ? (
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
                                <span>{assignment.academic_year}</span>
                              </div>
                              <div className="mt-1">
                                {assignment.semester === 'fall' ? 'الفصل الأول' : 
                                 assignment.semester === 'spring' ? 'الفصل الثاني' : 'الفصل الصيفي'}
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
                          
                          {hasClientPermission("subjects", "edit") && (
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
                          )}
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
                    {hasClientPermission("subjects", "edit") && (
                      <button
                        onClick={handleAddTeacher}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        إضافة أول مدرس
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subject Titles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    عناوين المقرر ({titles?.length || 0})
                  </h3>
                  {hasClientPermission("subjects", "edit") && (
                    <button
                      onClick={handleAddTitle}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      إضافة عنوان
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {titles && titles.length > 0 ? (
                  <div className="space-y-4">
                    {titles.map((title: any, index: number) => (
                      <div key={title.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                                {index + 1}
                              </span>
                              <h5 className="font-medium text-gray-900">{title.title}</h5>
                            </div>
                            {title.title_en && (
                              <p className="text-sm text-gray-600 mb-2">{title.title_en}</p>
                            )}
                            {title.description && (
                              <p className="text-sm text-gray-500">{title.description}</p>
                            )}
                          </div>
                          {hasClientPermission("subjects", "edit") && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditTitle(title)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="تعديل العنوان"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTitle(title.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="حذف العنوان"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد عناوين</h3>
                    <p className="mt-1 text-sm text-gray-500">لم يتم إضافة أي عناوين لهذا المقرر بعد.</p>
                    {hasClientPermission("subjects", "edit") && (
                      <button
                        onClick={handleAddTitle}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        إضافة أول عنوان
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PDF File */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  ملف PDF للمقرر
                </h3>
              </div>
              <div className="p-6">
                {subject.pdf_file_url ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{subject.pdf_file_name}</p>
                        <p className="text-xs text-gray-500">
                          {subject.pdf_file_size ? `${(subject.pdf_file_size / 1024 / 1024).toFixed(2)} ميجابايت` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={subject.pdf_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        عرض الملف
                      </a>
                      {hasClientPermission("subjects", "edit") && (
                        <button
                          onClick={handleDeletePDF}
                          className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد ملف PDF</h3>
                    <p className="mt-1 text-sm text-gray-500">لم يتم رفع ملف PDF لهذا المقرر بعد.</p>
                    {hasClientPermission("subjects", "edit") && (
                      <div className="mt-4">
                        {!pdfFile ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors duration-200">
                            <label htmlFor="pdf-upload-detail" className="cursor-pointer">
                              <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                اختر ملف PDF
                              </span>
                            </label>
                            <input
                              id="pdf-upload-detail"
                              type="file"
                              accept=".pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500 mt-2">PDF فقط، الحد الأقصى 10 ميجابايت</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <svg className="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{pdfFile.name}</p>
                                <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} ميجابايت</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={removePdfFile}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <button
                                onClick={handleUploadPDF}
                                disabled={uploadingPdf}
                                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                              >
                                {uploadingPdf ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    رفع...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    رفع الملف
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Department Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  الأقسام
                </h3>
              </div>
              <div className="p-6">
                {departmentsError ? (
                  <div className="text-center py-4">
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-sm text-red-600">خطأ في تحميل الأقسام</p>
                      <p className="text-xs text-gray-400 mt-1">{departmentsError?.message}</p>
                    </div>
                  </div>
                ) : subjectDepartments === undefined ? (
                  <div className="text-center py-4">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm text-gray-500">جاري تحميل الأقسام...</p>
                    </div>
                  </div>
                ) : subjectDepartments && subjectDepartments.length > 0 ? (
                  <div className="space-y-3">
                    {subjectDepartments.map((departmentRelation: any) => {
                      // The API returns departments as a nested object, not department_id
                      const department = departmentRelation.departments;
                      
                      if (!department) {
                        return null;
                      }

                      return (
                        <div key={departmentRelation.id} className={`p-3 rounded-lg border ${
                          departmentRelation.is_primary_department 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium text-sm ${
                                departmentRelation.is_primary_department 
                                  ? 'text-blue-900' 
                                  : 'text-gray-900'
                              }`}>
                                {department.name}
                                {departmentRelation.is_primary_department && (
                                  <span className="mr-2 text-xs text-blue-600">(رئيسي)</span>
                                )}
                              </h4>
                              {department.name_en && (
                                <p className="text-xs text-gray-600 mt-1">{department.name_en}</p>
                              )}
                            </div>
                            <button
                              onClick={() => navigate(`/departments/${department.id}`)}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                                departmentRelation.is_primary_department 
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              عرض
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm text-gray-500">لا توجد أقسام مرتبطة</p>
                      <p className="text-xs text-gray-400 mt-1">يمكن إضافة أقسام من خلال تحرير المادة</p>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* Prerequisites & Dependents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  المتطلبات السابقة
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Prerequisites */}
                {subject.prerequisite_subjects && subject.prerequisite_subjects.length > 0 ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">يجب اجتياز</label>
                    <div className="space-y-2">
                      {subject.prerequisite_subjects.map((prereq: any) => (
                        <div key={prereq.id} className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-red-800">{prereq.name}</span>
                            {prereq.name_en && <span className="text-xs text-red-600 block">{prereq.name_en}</span>}
                          </div>
                          <span className="text-xs font-mono font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">{prereq.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">لا توجد متطلبات سابقة</p>
                )}

                {/* Min units required */}
                {subject.min_units_required && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm font-medium text-orange-800">
                        يجب إكمال {subject.min_units_required} وحدة دراسية على الأقل
                      </span>
                    </div>
                  </div>
                )}

                {/* Dependent subjects */}
                {subject.dependent_subjects && subject.dependent_subjects.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">متطلب لـ</label>
                    <div className="space-y-2">
                      {subject.dependent_subjects.map((dep: any) => (
                        <div key={dep.id} className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-blue-800">{dep.name}</span>
                            {dep.name_en && <span className="text-xs text-blue-600 block">{dep.name_en}</span>}
                          </div>
                          <span className="text-xs font-mono font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{dep.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hours breakdown */}
                {(subject.theoretical_hours > 0 || subject.practical_hours > 0) && (
                  <div className="pt-3 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">توزيع الساعات</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{subject.theoretical_hours || 0}</div>
                        <div className="text-xs text-gray-500">نظري</div>
                      </div>
                      <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{subject.practical_hours || 0}</div>
                        <div className="text-xs text-gray-500">عملي</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  الإحصائيات
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الطلاب المسجلين</span>
                  <span className="text-lg font-semibold text-gray-900">{students?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الساعات المعتمدة</span>
                  <span className="text-lg font-semibold text-gray-900">{subject.credits}</span>
                </div>
                {subject.max_students && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">السعة القصوى</span>
                    <span className="text-lg font-semibold text-gray-900">{subject.max_students}</span>
                  </div>
                )}
                {subject.max_students && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">نسبة الامتلاء</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {Math.round(((students?.length || 0) / subject.max_students) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Title Modal */}
      {showAddTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleCancelTitle} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTitle ? "تعديل العنوان" : "إضافة عنوان جديد"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={titleForm.title}
                  onChange={(e) => setTitleForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="عنوان الموضوع"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={titleForm.title_en}
                  onChange={(e) => setTitleForm(prev => ({ ...prev, title_en: e.target.value }))}
                  placeholder="Title in English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={titleForm.description}
                  onChange={(e) => setTitleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للموضوع"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCancelTitle}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveTitle}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {editingTitle ? "حفظ التغييرات" : "إضافة العنوان"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Subject Modal */}
      {showTeacherModal && (
        <TeacherSubjectModal
          isOpen={showTeacherModal}
          onClose={handleCloseTeacherModal}
          subjectId={id!}
          editingAssignment={editingAssignment}
          mode="subject"
          subjectDepartmentIds={editForm.department_ids}
        />
      )}
    </div>
  );
}
