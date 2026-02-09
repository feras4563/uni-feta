import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeacherSubjects,
  fetchDepartments,
  deleteTeacherSubjectAssignment,
  getTeacher,
  updateTeacher,
  deleteTeacher as deleteTeacherAPI,
  uploadTeacherPhoto,
} from "../lib/jwt-api";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/JWTAuthContext";
import { QRService } from "../lib/qr-service";
import logo1 from "../assets/logo1.png";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import TeacherSubjectModal from "../components/teacher/TeacherSubjectModal";

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, canDelete } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const [form, setForm] = useState({
    name: "", name_en: "", email: "", phone: "", specialization: "",
    department_id: "", qualification: "", education_level: "",
    years_experience: "", teaching_hours: "", basic_salary: "",
    hourly_rate: "", bio: "", office_location: "", office_hours: "",
    is_active: true,
  });

  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ["teacher", id], queryFn: () => getTeacher(id!), enabled: !!id
  });
  const { data: teacherSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["teacher-subjects", id],
    queryFn: () => fetchTeacherSubjects(Number(id)),
    enabled: !!id
  });

  useEffect(() => {
    if (teacher) {
      setForm({
        name: teacher.name || "", name_en: teacher.name_en || "",
        email: teacher.email || "", phone: teacher.phone || "",
        specialization: teacher.specialization || "",
        department_id: String(teacher.department_id || teacher.department?.id || ""),
        qualification: teacher.qualification || "",
        education_level: teacher.education_level || "",
        years_experience: String(teacher.years_experience ?? ""),
        teaching_hours: String(teacher.teaching_hours ?? ""),
        basic_salary: String(teacher.basic_salary ?? ""),
        hourly_rate: String(teacher.hourly_rate ?? ""),
        bio: teacher.bio || "", office_location: teacher.office_location || "",
        office_hours: teacher.office_hours || "",
        is_active: teacher.is_active !== false,
      });
      generateQR(teacher);
    }
  }, [teacher]);

  const generateQR = async (t: any) => {
    try {
      const result = await QRService.generateTeacherQR({
        teacherId: t.id,
        name: t.name,
        nameEn: t.name_en || '',
        departmentName: t.department?.name || getDepartmentName(t.department_id),
        qualification: t.qualification || '',
        specialization: t.specialization || '',
        campusId: t.campus_id || '',
      });
      setQrDataURL(result.qrDataURL);
    } catch { /* silent */ }
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.email.trim()) e.email = "البريد الإلكتروني مطلوب";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "البريد غير صحيح";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await updateTeacher(id!, {
        name: form.name.trim(), name_en: form.name_en.trim() || null,
        email: form.email.trim(), phone: form.phone.trim() || null,
        specialization: form.specialization.trim() || null,
        department_id: form.department_id || null,
        qualification: form.qualification || null,
        education_level: form.education_level.trim() || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        teaching_hours: form.teaching_hours ? parseInt(form.teaching_hours) : null,
        basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        bio: form.bio.trim() || null,
        office_location: form.office_location.trim() || null,
        office_hours: form.office_hours.trim() || null,
        is_active: form.is_active,
      });
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setIsEditing(false);
    } catch (err: any) {
      setErrors({ submit: err.message || "خطأ في حفظ البيانات" });
    } finally { setSubmitting(false); }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('يرجى اختيار صورة (JPG, PNG, WEBP)');
      return;
    }
    setUploadingPhoto(true);
    try {
      await uploadTeacherPhoto(id!, file);
      queryClient.invalidateQueries({ queryKey: ["teacher", id] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    } catch (err: any) {
      alert('خطأ في رفع الصورة: ' + err.message);
    } finally { setUploadingPhoto(false); }
  };

  const handleDeleteTeacher = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المدرس؟')) return;
    try {
      await deleteTeacherAPI(id!);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      navigate('/teachers');
    } catch { alert('خطأ في حذف المدرس'); }
  };

  const getDepartmentName = (did: string) => {
    if (!did) return 'غير محدد';
    return departments.find((d: any) => d.id === did)?.name || 'غير محدد';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">نشط</span>
      : <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">غير نشط</span>;
  };

  const printTeacherCard = () => {
    if (!teacher || !qrDataURL) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const photoURL = teacher.photo_url ? (teacher.photo_url.startsWith('http') ? teacher.photo_url : `${API_URL}${teacher.photo_url}`) : null;
    w.document.write(`<html><head><title>بطاقة المدرس - ${teacher.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Noto Sans Arabic',Arial,sans-serif;background:#f3f4f6;direction:rtl}
        .card{width:85.6mm;height:53.98mm;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
        .card-top{background:#1a2332;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;position:relative}
        .card-top::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#2dd4bf,#14b8a6,#2dd4bf)}
        .card-top .uni-block{display:flex;align-items:center;gap:8px}
        .card-top .logo-wrap{background:#fff;border-radius:4px;padding:2px;display:flex;align-items:center;justify-content:center}
        .card-top .uni-logo{width:24px;height:24px;object-fit:contain}
        .card-top .uni{color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px}
        .card-top .uni-en{color:#2dd4bf;font-size:7.5px;font-weight:600;font-family:Arial;letter-spacing:0.3px}
        .card-top .badge{background:rgba(45,212,191,0.15);color:#2dd4bf;font-size:7px;padding:2px 8px;border-radius:10px;font-weight:700;border:1px solid rgba(45,212,191,0.3)}
        .card-body{flex:1;display:flex;padding:10px 14px;gap:10px}
        .photo-col{display:flex;flex-direction:column;align-items:center;gap:4px}
        .photo{width:60px;height:72px;border-radius:6px;border:2px solid #1a2332;object-fit:cover;background:#f9fafb}
        .photo-placeholder{width:60px;height:72px;border-radius:6px;border:2px solid #e5e7eb;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:24px}
        .info-col{flex:1;display:flex;flex-direction:column;justify-content:center}
        .teacher-name{font-size:12px;font-weight:700;color:#1a2332;margin-bottom:6px;border-bottom:2px solid #2dd4bf;padding-bottom:4px}
        .info-row{display:flex;justify-content:space-between;font-size:8px;margin-bottom:3px;line-height:1.5}
        .info-label{color:#6b7280;font-weight:600}
        .info-value{color:#1a2332;font-weight:700}
        .qr-col{display:flex;flex-direction:column;align-items:center;justify-content:center}
        .qr-col img{width:70px;height:70px;border:2px solid #1a2332;border-radius:6px;padding:2px}
        .qr-label{font-size:6px;color:#1a2332;margin-top:2px;font-weight:600}
        .card-footer{background:#1a2332;padding:4px 14px;display:flex;justify-content:space-between;font-size:6.5px;color:#2dd4bf;font-weight:600}
        @media print{body{background:#fff!important}@page{size:85.6mm 53.98mm;margin:0}.card{border:none;box-shadow:none}}
      </style></head><body>
      <div class="card">
        <div class="card-top">
          <div class="uni-block">
            <div class="logo-wrap"><img class="uni-logo" src="${logo1}" alt="UKL" /></div>
            <div><div class="uni">جامعة الخليل الأهلية</div><div class="uni-en">UNIVERSITY OF ALKHALIL</div></div>
          </div>
          <div class="badge">بطاقة مدرس</div>
        </div>
        <div class="card-body">
          <div class="photo-col">
            ${photoURL ? `<img class="photo" src="${photoURL}" />` : `<div class="photo-placeholder">👤</div>`}
          </div>
          <div class="info-col">
            <div class="teacher-name">${teacher.name}</div>
            ${teacher.name_en ? `<div style="font-size:9px;color:#6b7280;margin-bottom:4px;font-family:Arial">${teacher.name_en}</div>` : ''}
            <div class="info-row"><span class="info-label">رقم المدرس:</span><span class="info-value">${teacher.campus_id || teacher.id}</span></div>
            <div class="info-row"><span class="info-label">القسم:</span><span class="info-value">${teacher.department?.name || getDepartmentName(teacher.department_id)}</span></div>
            <div class="info-row"><span class="info-label">الرتبة:</span><span class="info-value">${teacher.qualification || 'غير محدد'}</span></div>
            <div class="info-row"><span class="info-label">التخصص:</span><span class="info-value">${teacher.specialization || 'غير محدد'}</span></div>
          </div>
          <div class="qr-col">
            <img src="${qrDataURL}" alt="QR" />
            <div class="qr-label">رمز التعريف</div>
          </div>
        </div>
        <div class="card-footer">
          <span>تاريخ الإصدار: ${new Date().toLocaleDateString('en-GB')}</span>
          <span>جامعة الخليل الأهلية - بطاقة رسمية</span>
        </div>
      </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // Subject management handlers
  const handleAddSubject = () => { setEditingAssignment(null); setShowSubjectModal(true); };
  const handleEditAssignment = (assignment: any) => { setEditingAssignment(assignment); setShowSubjectModal(true); };
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التكليف؟")) return;
    try {
      await deleteTeacherSubjectAssignment(assignmentId);
      queryClient.invalidateQueries({ queryKey: ["teacher-subjects"] });
    } catch { alert("خطأ في حذف التكليف"); }
  };
  const handleCloseSubjectModal = () => {
    setShowSubjectModal(false);
    setEditingAssignment(null);
    queryClient.invalidateQueries({ queryKey: ["teacher-subjects"] });
  };

  // Availability data
  const workDays = [
    { key: "sunday", name: "الأحد" }, { key: "monday", name: "الاثنين" },
    { key: "tuesday", name: "الثلاثاء" }, { key: "wednesday", name: "الأربعاء" },
    { key: "thursday", name: "الخميس" }
  ];
  const timeSlots = [
    { key: "slot1", label: "08:00 - 10:00" }, { key: "slot2", label: "10:00 - 12:00" },
    { key: "slot3", label: "12:00 - 14:00" }, { key: "slot4", label: "14:00 - 16:00" },
    { key: "slot5", label: "16:00 - 18:00" }
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error || !teacher) return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-500 gap-3">
      <p>تعذر تحميل بيانات المدرس.</p>
      <button onClick={() => navigate('/teachers')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">العودة</button>
    </div>
  );

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
  const photoSrc = teacher.photo_url ? (teacher.photo_url.startsWith('http') ? teacher.photo_url : `${API_URL}${teacher.photo_url}`) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teachers')} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "تعديل بيانات المدرس" : teacher.name}</h1>
            <p className="text-sm text-gray-500">{teacher.department?.name || getDepartmentName(teacher.department_id)} - {teacher.campus_id || teacher.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">إلغاء</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {submitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </>
          ) : (
            <>
              {canEdit('teachers') && (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">تعديل</button>
              )}
              {canDelete('teachers') && (
                <button onClick={handleDeleteTeacher} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">حذف</button>
              )}
            </>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{errors.submit}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">المعلومات الشخصية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: 'name', label: 'الاسم (عربي)', required: true, val: teacher.name },
                { key: 'name_en', label: 'الاسم (إنجليزي)', val: teacher.name_en },
                { key: 'email', label: 'البريد الإلكتروني', required: true, type: 'email', val: teacher.email },
                { key: 'phone', label: 'الهاتف', val: teacher.phone },
                { key: 'specialization', label: 'التخصص', val: teacher.specialization },
                { key: 'office_location', label: 'موقع المكتب', val: teacher.office_location },
                { key: 'office_hours', label: 'ساعات الدوام', val: teacher.office_hours },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}{f.required && <span className="text-red-400 mr-0.5">*</span>}</label>
                  {isEditing ? (
                    <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => handleInputChange(f.key, e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 ${errors[f.key] ? 'border-red-300' : 'border-gray-200'}`} />
                  ) : (
                    <p className="text-sm text-gray-900">{f.val || 'غير محدد'}</p>
                  )}
                  {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">نبذة</label>
                {isEditing ? (
                  <textarea rows={2} value={form.bio} onChange={e => handleInputChange('bio', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : (
                  <p className="text-sm text-gray-900">{teacher.bio || 'غير محدد'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">المعلومات الأكاديمية والمالية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">القسم</label>
                {isEditing ? (
                  <select value={form.department_id} onChange={e => handleInputChange('department_id', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-gray-400">
                    <option value="">اختر القسم</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">{teacher.department?.name || getDepartmentName(teacher.department_id)}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الرتبة العلمية</label>
                {isEditing ? (
                  <select value={form.qualification} onChange={e => handleInputChange('qualification', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-gray-400">
                    <option value="">اختر</option>
                    <option value="رئيس قسم">رئيس قسم</option>
                    <option value="محاضر">محاضر</option>
                    <option value="متعاون">متعاون</option>
                  </select>
                ) : <p className="text-sm text-gray-900">{teacher.qualification || 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">المؤهل العلمي</label>
                {isEditing ? (
                  <input type="text" value={form.education_level} onChange={e => handleInputChange('education_level', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : <p className="text-sm text-gray-900">{teacher.education_level || 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">سنوات الخبرة</label>
                {isEditing ? (
                  <input type="number" value={form.years_experience} onChange={e => handleInputChange('years_experience', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : <p className="text-sm text-gray-900">{teacher.years_experience ? `${teacher.years_experience} سنة` : 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ساعات التدريس الأسبوعية</label>
                {isEditing ? (
                  <input type="number" value={form.teaching_hours} onChange={e => handleInputChange('teaching_hours', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : <p className="text-sm text-gray-900">{teacher.teaching_hours ? `${teacher.teaching_hours} ساعة` : 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الحالة</label>
                {isEditing ? (
                  <select value={form.is_active ? 'true' : 'false'} onChange={e => handleInputChange('is_active', e.target.value === 'true')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-gray-400">
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
                ) : getStatusBadge(teacher.is_active !== false)}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الراتب الأساسي</label>
                {isEditing ? (
                  <input type="number" step="0.01" value={form.basic_salary} onChange={e => handleInputChange('basic_salary', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" placeholder="0.00" />
                ) : <p className="text-sm text-gray-900">{teacher.basic_salary ? `${teacher.basic_salary} دينار` : 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">معدل الساعة الإضافية</label>
                {isEditing ? (
                  <input type="number" step="0.01" value={form.hourly_rate} onChange={e => handleInputChange('hourly_rate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" placeholder="0.00" />
                ) : <p className="text-sm text-gray-900">{teacher.hourly_rate ? `${teacher.hourly_rate} دينار` : 'غير محدد'}</p>}
              </div>
            </div>
          </div>

          {/* Assigned Subjects */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 ml-2 text-gray-600" />
                المواد المكلف بها
              </h2>
              <button onClick={handleAddSubject}
                className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5 ml-1" /> إضافة مادة
              </button>
            </div>
            {subjectsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : teacherSubjects.length > 0 ? (
              <div className="space-y-3">
                {teacherSubjects.map((assignment: any) => (
                  <div key={assignment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{assignment.subject?.name || "مادة غير معروفة"}</h4>
                          <span className="text-sm text-gray-500">({assignment.subject?.code || "N/A"})</span>
                          {assignment.is_primary_teacher && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">مدرس رئيسي</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center"><BookOpen className="w-4 h-4 ml-1" />{assignment.department?.name || "قسم غير محدد"}</div>
                          <div className="flex items-center"><Calendar className="w-4 h-4 ml-1" />{assignment.study_year?.name || assignment.academic_year || "سنة غير محددة"}</div>
                          <div className="flex items-center"><Clock className="w-4 h-4 ml-1" />{assignment.semester?.name || (assignment.semester === "fall" ? "الفصل الأول" : assignment.semester === "spring" ? "الفصل الثاني" : "الفصل الصيفي")}</div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          {assignment.can_edit_grades && <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 ml-1" />تعديل الدرجات</span>}
                          {assignment.can_take_attendance && <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 ml-1" />أخذ الحضور</span>}
                        </div>
                        {assignment.notes && <div className="mt-2 text-sm text-gray-600 italic">{assignment.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditAssignment(assignment)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="تعديل"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد مواد مكلف بها حالياً</p>
              </div>
            )}
          </div>

          {/* Weekly Availability */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 ml-2 text-gray-600" />
              الجدول الأسبوعي والتوفر
            </h2>
            {teacher.availability ? (
              <div className="overflow-x-auto">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 bg-gray-50 border-b">
                    <div className="px-4 py-3 font-medium text-gray-700 border-l text-center">الوقت</div>
                    {workDays.map(day => (
                      <div key={day.key} className="px-4 py-3 font-medium text-gray-700 text-center border-l last:border-l-0">{day.name}</div>
                    ))}
                  </div>
                  {timeSlots.map(slot => (
                    <div key={slot.key} className="grid grid-cols-6 border-b last:border-b-0">
                      <div className="px-4 py-4 bg-gray-50 border-l font-medium text-sm text-gray-700 text-center">{slot.label}</div>
                      {workDays.map(day => {
                        const isAvailable = teacher.availability?.[day.key]?.[slot.key] || false;
                        return (
                          <div key={day.key} className={`px-4 py-4 border-l last:border-l-0 flex justify-center items-center ${isAvailable ? "bg-green-50" : "bg-white"}`}>
                            {isAvailable ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-300" />}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <div className="flex items-center"><div className="w-4 h-4 bg-green-50 border border-green-200 rounded ml-2"></div><span className="text-gray-600">متاح</span></div>
                  <div className="flex items-center"><div className="w-4 h-4 bg-white border border-gray-200 rounded ml-2"></div><span className="text-gray-600">غير متاح</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لم يتم تحديد الجدول الأسبوعي</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teacher ID Card Preview */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">بطاقة المدرس</h3>
              <div className="flex gap-1">
                <button onClick={() => setShowCardModal(true)} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100">عرض</button>
                <button onClick={printTeacherCard} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100">طباعة</button>
              </div>
            </div>
            <div className="p-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ aspectRatio: '1.586' }}>
                {/* Mini card header */}
                <div className="bg-[#1a2332] px-3 py-1.5 flex justify-between items-center border-b-2 border-[#2dd4bf]">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white rounded p-0.5 flex items-center justify-center">
                      <img src={logo1} alt="UKL" className="h-4 w-auto object-contain" />
                    </div>
                    <div>
                      <div className="text-white text-[10px] font-bold">جامعة الخليل الأهلية</div>
                      <div className="text-[#2dd4bf] text-[6px]">UNIVERSITY OF ALKHALIL</div>
                    </div>
                  </div>
                  <span className="text-[6px] text-[#2dd4bf] bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 px-1.5 py-0.5 rounded-full font-medium">بطاقة مدرس</span>
                </div>
                {/* Mini card body */}
                <div className="flex p-2 gap-2 bg-white" style={{ minHeight: 0 }}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-10 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {photoSrc ? (
                        <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-gray-900 truncate border-b border-gray-100 pb-0.5 mb-0.5">{teacher.name}</div>
                    <div className="text-[6.5px] text-gray-500 space-y-0.5">
                      <div className="flex justify-between"><span>رقم المدرس:</span><span className="font-medium text-gray-800">{teacher.campus_id || '-'}</span></div>
                      <div className="flex justify-between"><span>القسم:</span><span className="font-medium text-gray-800 truncate mr-1">{teacher.department?.name || getDepartmentName(teacher.department_id)}</span></div>
                      <div className="flex justify-between"><span>الرتبة:</span><span className="font-medium text-gray-800">{teacher.qualification || '-'}</span></div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center justify-center">
                    {qrDataURL ? (
                      <img src={qrDataURL} alt="QR" className="w-11 h-11 border border-gray-200 rounded p-0.5" />
                    ) : (
                      <div className="w-11 h-11 border border-gray-200 rounded bg-gray-50"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">صورة المدرس</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-36 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                {photoSrc ? (
                  <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                )}
              </div>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {uploadingPhoto ? 'جاري الرفع...' : (photoSrc ? 'تغيير الصورة' : 'رفع صورة')}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">معلومات سريعة</h3>
            <div className="space-y-2.5">
              {[
                { label: 'رقم المدرس', value: teacher.campus_id || teacher.id },
                { label: 'الحالة', value: getStatusBadge(teacher.is_active !== false), isJsx: true },
                { label: 'الرتبة', value: teacher.qualification || '-' },
                { label: 'المواد', value: `${teacherSubjects.length} مادة` },
                { label: 'الهاتف', value: teacher.phone || '-' },
                { label: 'البريد', value: teacher.email || '-' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  {item.isJsx ? item.value : <span className="text-xs font-medium text-gray-900">{item.value as string}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-size Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCardModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">بطاقة المدرس</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '400px', aspectRatio: '1.586' }}>
              <div className="bg-[#1a2332] px-4 py-2 flex justify-between items-center border-b-[3px] border-[#2dd4bf]">
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-md p-0.5 flex items-center justify-center">
                    <img src={logo1} alt="UKL" className="h-6 w-auto object-contain" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">جامعة الخليل الأهلية</div>
                    <div className="text-[#2dd4bf] text-[8px] font-medium">UNIVERSITY OF ALKHALIL</div>
                  </div>
                </div>
                <span className="text-[8px] text-[#2dd4bf] bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 px-2 py-0.5 rounded-full font-medium">بطاقة مدرس</span>
              </div>
              <div className="flex p-3 gap-3 bg-white flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-16 h-20 rounded-md border-2 border-[#1a2332] overflow-hidden bg-gray-50 flex items-center justify-center">
                    {photoSrc ? (
                      <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1a2332] truncate border-b-2 border-[#2dd4bf] pb-1 mb-1">{teacher.name}</div>
                  {teacher.name_en && <div className="text-[10px] text-gray-500 mb-1">{teacher.name_en}</div>}
                  <div className="text-[10px] text-gray-600 space-y-1">
                    <div className="flex justify-between"><span>رقم المدرس:</span><span className="font-semibold text-[#1a2332]">{teacher.campus_id || teacher.id}</span></div>
                    <div className="flex justify-between"><span>القسم:</span><span className="font-semibold text-[#1a2332] truncate mr-1">{teacher.department?.name || getDepartmentName(teacher.department_id)}</span></div>
                    <div className="flex justify-between"><span>الرتبة:</span><span className="font-semibold text-[#1a2332]">{teacher.qualification || 'غير محدد'}</span></div>
                    <div className="flex justify-between"><span>التخصص:</span><span className="font-semibold text-[#1a2332]">{teacher.specialization || 'غير محدد'}</span></div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center justify-center">
                  {qrDataURL ? (
                    <>
                      <img src={qrDataURL} alt="QR" className="w-20 h-20 border-2 border-[#1a2332] rounded-md p-1" />
                      <span className="text-[7px] text-[#1a2332] font-semibold mt-1">رمز التعريف</span>
                    </>
                  ) : (
                    <div className="w-20 h-20 border border-gray-200 rounded bg-gray-50"></div>
                  )}
                </div>
              </div>
              <div className="bg-[#1a2332] px-4 py-1.5 flex justify-between text-[8px] text-[#2dd4bf] font-medium">
                <span>تاريخ الإصدار: {new Date().toLocaleDateString('en-GB')}</span>
                <span>جامعة الخليل الأهلية - بطاقة رسمية</span>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={printTeacherCard} className="px-4 py-2 text-sm bg-[#1a2332] text-white rounded-lg hover:bg-[#243447]">طباعة البطاقة</button>
              <button onClick={() => setShowCardModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">إغلاق</button>
            </div>
          </div>
        </div>
      )}

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
