import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepartments, getStudent, updateStudent, deleteStudent as deleteStudentAPI, uploadStudentPhoto } from "../lib/jwt-api";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../contexts/JWTAuthContext";
import { QRService } from "../lib/qr-service";
import logo1 from "../assets/logo1.png";

export default function StudentDetail() {
  const { id } = useParams();
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
  
  const [form, setForm] = useState({
    name: "", name_en: "", national_id_passport: "", gender: "", birth_date: "", birth_place: "",
    nationality: "", phone: "", email: "", address: "", sponsor_name: "", sponsor_contact: "",
    academic_history: "", academic_score: "", department_id: "", year: "", status: "active", enrollment_date: "",
    certification_type: "", certification_date: "", certification_school: "", certification_specialization: "",
    port_of_entry: "", visa_type: "", mother_name: "", mother_nationality: "",
    passport_number: "", passport_issue_date: "", passport_expiry_date: "", passport_place_of_issue: ""
  });

  const isLibyan = form.nationality === "ليبيا" || form.nationality === "ليبي" || form.nationality === "ليبية";

  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const { data: student, isLoading, error } = useQuery({
    queryKey: ["student", id], queryFn: () => getStudent(id!), enabled: !!id
  });

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || "", name_en: student.name_en || "",
        national_id_passport: student.national_id_passport || "", gender: student.gender || "",
        birth_date: student.birth_date || "", birth_place: student.birth_place || "",
        nationality: student.nationality || "",
        phone: student.phone || "", email: student.email || "", address: student.address || "",
        sponsor_name: student.sponsor_name || "", sponsor_contact: student.sponsor_contact || "",
        academic_history: student.academic_history || "", academic_score: student.academic_score || "",
        department_id: String(student.department_id || ""), year: String(student.year || ""),
        status: student.status || "active", enrollment_date: student.enrollment_date || "",
        certification_type: student.certification_type || "", certification_date: student.certification_date || "",
        certification_school: student.certification_school || "", certification_specialization: student.certification_specialization || "",
        port_of_entry: student.port_of_entry || "", visa_type: student.visa_type || "",
        mother_name: student.mother_name || "", mother_nationality: student.mother_nationality || "",
        passport_number: student.passport_number || "", passport_issue_date: student.passport_issue_date || "",
        passport_expiry_date: student.passport_expiry_date || "", passport_place_of_issue: student.passport_place_of_issue || ""
      });
      generateQR(student);
    }
  }, [student]);

  const generateQR = async (s: any) => {
    try {
      const dept = departments.find((d: any) => d.id === s.department_id);
      const result = await QRService.generateStudentQR({
        studentId: s.id, name: s.name, nameEn: s.name_en || '',
        birthDate: s.birth_date || '', departmentId: s.department_id,
        departmentName: dept?.name || s.department?.name || '', academicYear: s.year || 1,
        registrationDate: s.enrollment_date || ''
      });
      setQrDataURL(result.qrDataURL);
    } catch { /* silent */ }
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.national_id_passport.trim()) e.national_id_passport = "الرقم القومي مطلوب";
    if (!form.gender) e.gender = "الجنس مطلوب";
    if (!form.birth_date) e.birth_date = "تاريخ الميلاد مطلوب";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "البريد غير صحيح";
    if (!form.department_id) e.department_id = "القسم مطلوب";
    if (!form.year) e.year = "السنة مطلوبة";
    if (!form.enrollment_date) e.enrollment_date = "تاريخ التسجيل مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const updateData: any = {
        name: form.name.trim(), name_en: form.name_en.trim() || null,
        national_id_passport: form.national_id_passport.trim(),
        gender: form.gender || null, birth_date: form.birth_date || null,
        birth_place: form.birth_place.trim() || null,
        nationality: form.nationality.trim() || null, phone: form.phone.trim() || null,
        email: form.email.trim() || null, address: form.address.trim() || null,
        sponsor_name: form.sponsor_name.trim() || null, sponsor_contact: form.sponsor_contact.trim() || null,
        academic_history: form.academic_history?.trim() || null,
        academic_score: form.academic_score?.trim() || null,
        certification_type: form.certification_type || null,
        certification_date: form.certification_date || null,
        certification_school: form.certification_school.trim() || null,
        certification_specialization: form.certification_specialization.trim() || null,
        department_id: form.department_id || null, year: form.year ? parseInt(form.year) : null,
        status: form.status, enrollment_date: form.enrollment_date || null,
        port_of_entry: form.port_of_entry.trim() || null,
        visa_type: form.visa_type.trim() || null,
        mother_name: form.mother_name.trim() || null,
        mother_nationality: form.mother_nationality.trim() || null,
        passport_number: form.passport_number.trim() || null,
        passport_issue_date: form.passport_issue_date || null,
        passport_expiry_date: form.passport_expiry_date || null,
        passport_place_of_issue: form.passport_place_of_issue.trim() || null,
      };
      await updateStudent(id!, updateData);
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsEditing(false);
    } catch (err: any) {
      setErrors({ submit: err.message || "خطأ في حفظ البيانات" });
    } finally { setSubmitting(false); }
  };

  const handleInputChange = (field: string, value: string) => {
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
      await uploadStudentPhoto(id!, file);
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch (err: any) {
      alert('خطأ في رفع الصورة: ' + err.message);
    } finally { setUploadingPhoto(false); }
  };

  const handleDeleteStudent = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await deleteStudentAPI(id!);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      navigate('/students');
    } catch { alert('خطأ في حذف الطالب'); }
  };

  const getDepartmentName = (did: string) => {
    if (!did) return 'غير محدد';
    return departments.find((d: any) => d.id === did)?.name || 'غير محدد';
  };
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('ar-LY') : 'غير محدد';
  const getStatusBadge = (status: string) => {
    const m: Record<string, { l: string; c: string }> = {
      active: { l: 'نشط', c: 'bg-gray-100 text-gray-800' },
      inactive: { l: 'غير نشط', c: 'bg-red-50 text-red-700' },
      graduated: { l: 'متخرج', c: 'bg-gray-200 text-gray-700' },
      suspended: { l: 'معلق', c: 'bg-yellow-50 text-yellow-700' },
    };
    const s = m[status] || m.inactive;
    return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${s.c}`}>{s.l}</span>;
  };

  const printRegistrationForm = () => {
    if (!student) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const deptName = getDepartmentName(student.department_id);
    const semesterLabel = '........';
    const studentIsLibyan = student.nationality === 'ليبيا' || student.nationality === 'ليبي' || student.nationality === 'ليبية';

    if (studentIsLibyan) {
      w.document.write(`<html><head><title>نموذج قبول وتسجيل طالب</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Noto Sans Arabic',Arial,sans-serif;direction:rtl;padding:40px;background:#fff;color:#1a2332;font-size:14px;line-height:2}
          .header{text-align:center;color:#1a4d8c;margin-bottom:30px}
          .header h1{font-size:18px;font-weight:700;margin-bottom:5px}
          .header h2{font-size:16px;font-weight:600}
          .section-title{font-weight:700;font-size:15px;margin:20px 0 10px;text-decoration:underline}
          .field{margin-bottom:8px}
          .field .dots{border-bottom:1px dotted #333;display:inline-block;min-width:150px;padding:0 5px}
          .signature{margin-top:40px;text-align:center}
          .signature .dots{display:block;margin-top:10px;border-bottom:1px dotted #333;width:200px;margin-left:auto;margin-right:auto}
          @media print{body{padding:20px}@page{size:A4;margin:15mm}}
        </style></head><body>
        <div class="header">
          <h1>نموذج قبول وتسجيل طالب للفصل الدراسي (${semesterLabel}) ....20م</h1>
          <h2>للعام الجامعي .....20\\\\....20م</h2>
        </div>
        <div class="section-title">بيانات الطالب:</div>
        <div class="field">اسم الطالب رباعي: <span class="dots">${student.name || '...................................................'}</span> رقم القيد الجامعي: (<span class="dots">${student.campus_id || student.id || '.............'}</span>)</div>
        <div class="field">تاريخ ومكان والميلاد: <span class="dots">${student.birth_date ? formatDate(student.birth_date) : '...............'} ${student.birth_place || '...............'}</span> محل الإقامة: <span class="dots">${student.address || '...................'}</span> المدرسة المتحصل منها الطالب على</div>
        <div class="field">الشهادة: <span class="dots">${student.certification_school || '.....................'}</span> التخصص: <span class="dots">${student.certification_specialization || '.....................'}</span> تاريخ الحصول عنها: <span class="dots">${student.certification_date ? formatDate(student.certification_date) : '...................'}</span> التقدير</div>
        <div class="field">العام: <span class="dots">${student.academic_score || '.........'}</span>%.</div>
        <div class="field">البرنامج العلمي الذي يرغب الطالب التسجيل فيه:</div>
        <div class="field"><span class="dots" style="width:100%">${deptName}</span></div>
        <div class="signature">
          <div>توقيع الطالب</div>
          <span class="dots">&nbsp;</span>
        </div>
      </body></html>`);
    } else {
      w.document.write(`<html><head><title>نموذج قبول وتسجيل طالب (وافد)</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Noto Sans Arabic',Arial,sans-serif;direction:rtl;padding:40px;background:#fff;color:#1a2332;font-size:14px;line-height:2}
          .header{text-align:center;color:#1a4d8c;margin-bottom:30px}
          .header h1{font-size:18px;font-weight:700;margin-bottom:5px}
          .header h2{font-size:16px;font-weight:600}
          .field{margin-bottom:8px}
          .field .dots{border-bottom:1px dotted #333;display:inline-block;min-width:120px;padding:0 5px}
          .signature{margin-top:40px;text-align:center}
          .signature .dots{display:block;margin-top:10px;border-bottom:1px dotted #333;width:200px;margin-left:auto;margin-right:auto}
          @media print{body{padding:20px}@page{size:A4;margin:15mm}}
        </style></head><body>
        <div class="header">
          <h1>نموذج قبول وتسجيل طالب (وافد)</h1>
          <h2>للفصل الدراسي (${semesterLabel}) ....20م للعام الجامعي .....20\\\\....20م</h2>
        </div>
        <div class="field">أنا مقدم الطلب:</div>
        <div class="field"><span class="dots" style="width:100%">${student.name || '...................................................'}</span></div>
        <div class="field">الجنس: <span class="dots">${student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : '...................'}</span> الجنسية: <span class="dots">${student.nationality || '.....................'}</span> مكان وتاريخ الميلاد: <span class="dots">${student.birth_place || '...............'} ${student.birth_date ? formatDate(student.birth_date) : '...............'}</span> رقم جواز</div>
        <div class="field">السفر: <span class="dots">${student.passport_number || '...............................'}</span> مكان وتاريخ الإصدار: <span class="dots">${student.passport_place_of_issue || '...............'} ${student.passport_issue_date ? formatDate(student.passport_issue_date) : '...............'}</span> تاريخ الصلاحية:</div>
        <div class="field"><span class="dots">${student.passport_expiry_date ? formatDate(student.passport_expiry_date) : '...............................'}</span> معبر الدخول: <span class="dots">${student.port_of_entry || '...................'}</span> نوع الإقامة: <span class="dots">${student.visa_type || '...................'}</span> اسم الأم: <span class="dots">${student.mother_name || '.....................'}</span></div>
        <div class="field">جنسيتها: <span class="dots">${student.mother_nationality || '.....................'}</span> محل الإقامة الحالي: <span class="dots">${student.address || '.....................'}</span> الشهادة ما قبل المرحلة الجامعية</div>
        <div class="field">المتحصل عليها: <span class="dots">${student.certification_school || '...............................'}</span> النسبة: <span class="dots">${student.academic_score || '...................'}</span>% التقدير: <span class="dots">${student.certification_type || '...................'}</span> العام</div>
        <div class="field">الدراسي: <span class="dots">${student.certification_date ? formatDate(student.certification_date) : '......'}</span>20م.</div>
        <div class="field">أتقدم إليكم بطلبي هذا بشأن قبولي كطالب ببرامج الدراسة الجامعية بقسم: <span class="dots">${deptName}</span></div>
        <div class="signature">
          <div>توقيع مقدم الطلب</div>
          <div>التاريخ: ......\\\\......\\\\....20م</div>
          <span class="dots">&nbsp;</span>
        </div>
      </body></html>`);
    }
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const printStudentCard = () => {
    if (!student || !qrDataURL) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const fmtDate = (ds: string) => { try { return new Date(ds).toLocaleDateString('en-GB'); } catch { return ds || '-'; } };
    const photoURL = student.photo_url ? (student.photo_url.startsWith('http') ? student.photo_url : `${API_URL}${student.photo_url}`) : null;
    w.document.write(`<html><head><title>بطاقة الطالب - ${student.name}</title>
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
        .student-name{font-size:12px;font-weight:700;color:#1a2332;margin-bottom:6px;border-bottom:2px solid #2dd4bf;padding-bottom:4px}
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
          <div class="badge">بطاقة طالب</div>
        </div>
        <div class="card-body">
          <div class="photo-col">
            ${photoURL ? `<img class="photo" src="${photoURL}" />` : `<div class="photo-placeholder">👤</div>`}
          </div>
          <div class="info-col">
            <div class="student-name">${student.name}</div>
            ${student.name_en ? `<div style="font-size:9px;color:#6b7280;margin-bottom:4px;font-family:Arial">${student.name_en}</div>` : ''}
            <div class="info-row"><span class="info-label">رقم الطالب:</span><span class="info-value">${student.campus_id || student.id}</span></div>
            <div class="info-row"><span class="info-label">التخصص:</span><span class="info-value">${getDepartmentName(student.department_id)}</span></div>
            <div class="info-row"><span class="info-label">السنة:</span><span class="info-value">السنة ${student.year || 1}</span></div>
            <div class="info-row"><span class="info-label">تاريخ الميلاد:</span><span class="info-value">${fmtDate(student.birth_date)}</span></div>
          </div>
          <div class="qr-col">
            <img src="${qrDataURL}" alt="QR" />
            <div class="qr-label">رمز التعريف</div>
          </div>
        </div>
        <div class="card-footer">
          <span>تاريخ الإصدار: ${fmtDate(student.enrollment_date)}</span>
          <span>جامعة الخليل الأهلية - بطاقة رسمية</span>
        </div>
      </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error || !student) return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-500 gap-3">
      <p>تعذر تحميل بيانات الطالب.</p>
      <button onClick={() => navigate('/students')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">العودة</button>
    </div>
  );

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
  const photoSrc = student.photo_url ? (student.photo_url.startsWith('http') ? student.photo_url : `${API_URL}${student.photo_url}`) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/students')} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "تعديل بيانات الطالب" : student.name}</h1>
            <p className="text-sm text-gray-500">{getDepartmentName(student.department_id)} - {student.campus_id || student.id}</p>
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
              <button onClick={printRegistrationForm} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                نموذج التسجيل
              </button>
              {canEdit('students') && (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">تعديل</button>
              )}
              {canDelete('students') && (
                <button onClick={handleDeleteStudent} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">حذف</button>
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
                { key: 'name', label: 'الاسم (عربي)', required: true, val: student.name },
                { key: 'name_en', label: 'الاسم (إنجليزي)', val: student.name_en },
                { key: 'national_id_passport', label: 'الرقم القومي', required: true, val: student.national_id_passport },
                { key: 'birth_date', label: 'تاريخ الميلاد', required: true, type: 'date', val: formatDate(student.birth_date) },
                { key: 'birth_place', label: 'مكان الميلاد', val: student.birth_place },
                { key: 'nationality', label: 'الجنسية', val: student.nationality },
                { key: 'phone', label: 'الهاتف', val: student.phone },
                { key: 'email', label: 'البريد الإلكتروني', type: 'email', val: student.email },
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الجنس<span className="text-red-400 mr-0.5">*</span></label>
                {isEditing ? (
                  <select value={form.gender} onChange={e => handleInputChange('gender', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-1 focus:ring-gray-400 ${errors.gender ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">اختر</option><option value="male">ذكر</option><option value="female">أنثى</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">{student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : 'غير محدد'}</p>
                )}
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">العنوان</label>
                {isEditing ? (
                  <textarea rows={2} value={form.address} onChange={e => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : (
                  <p className="text-sm text-gray-900">{student.address || 'غير محدد'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Foreign Student Info - only for non-Libyan */}
          {!isLibyan && (
            <div className="bg-white border border-orange-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-orange-100 flex items-center gap-2">
                بيانات الطالب الوافد
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">خاص بالطلاب غير الليبيين</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { key: 'mother_name', label: 'اسم الأم', val: student.mother_name },
                  { key: 'mother_nationality', label: 'جنسية الأم', val: student.mother_nationality },
                  { key: 'port_of_entry', label: 'معبر الدخول', val: student.port_of_entry },
                  { key: 'visa_type', label: 'نوع الإقامة / التأشيرة', val: student.visa_type },
                  { key: 'passport_number', label: 'رقم جواز السفر', val: student.passport_number },
                  { key: 'passport_place_of_issue', label: 'مكان إصدار الجواز', val: student.passport_place_of_issue },
                  { key: 'passport_issue_date', label: 'تاريخ إصدار الجواز', type: 'date', val: student.passport_issue_date ? formatDate(student.passport_issue_date) : '' },
                  { key: 'passport_expiry_date', label: 'تاريخ صلاحية الجواز', type: 'date', val: student.passport_expiry_date ? formatDate(student.passport_expiry_date) : '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    {isEditing ? (
                      <input type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => handleInputChange(f.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                    ) : (
                      <p className="text-sm text-gray-900">{f.val || 'غير محدد'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">المعلومات الأكاديمية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">القسم<span className="text-red-400 mr-0.5">*</span></label>
                {isEditing ? (
                  <select value={form.department_id} onChange={e => handleInputChange('department_id', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-1 focus:ring-gray-400 ${errors.department_id ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">اختر القسم</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">{getDepartmentName(student.department_id)}</p>}
                {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">السنة الدراسية<span className="text-red-400 mr-0.5">*</span></label>
                {isEditing ? (
                  <select value={form.year} onChange={e => handleInputChange('year', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-1 focus:ring-gray-400 ${errors.year ? 'border-red-300' : 'border-gray-200'}`}>
                    <option value="">اختر</option>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>السنة {['الأولى','الثانية','الثالثة','الرابعة','الخامسة'][y-1]}</option>)}
                  </select>
                ) : <p className="text-sm text-gray-900">السنة {student.year}</p>}
                {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">حالة الطالب</label>
                {isEditing ? (
                  <select value={form.status} onChange={e => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-gray-400">
                    <option value="active">نشط</option><option value="inactive">غير نشط</option>
                    <option value="graduated">متخرج</option><option value="suspended">معلق</option>
                  </select>
                ) : getStatusBadge(student.status)}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">تاريخ التسجيل<span className="text-red-400 mr-0.5">*</span></label>
                {isEditing ? (
                  <input type="date" value={form.enrollment_date} onChange={e => handleInputChange('enrollment_date', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-gray-400 ${errors.enrollment_date ? 'border-red-300' : 'border-gray-200'}`} />
                ) : <p className="text-sm text-gray-900">{formatDate(student.enrollment_date)}</p>}
                {errors.enrollment_date && <p className="text-xs text-red-500 mt-1">{errors.enrollment_date}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">المدرسة / المعهد المتحصل منها</label>
                {isEditing ? (
                  <input type="text" value={form.certification_school} onChange={e => handleInputChange('certification_school', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" placeholder="اسم المدرسة أو المعهد" />
                ) : <p className="text-sm text-gray-900">{student.certification_school || 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">تاريخ الحصول على الشهادة</label>
                {isEditing ? (
                  <input type="date" value={form.certification_date} onChange={e => handleInputChange('certification_date', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : <p className="text-sm text-gray-900">{student.certification_date ? formatDate(student.certification_date) : 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">التخصص</label>
                {isEditing ? (
                  <input type="text" value={form.certification_specialization} onChange={e => handleInputChange('certification_specialization', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" placeholder="تخصص الشهادة" />
                ) : <p className="text-sm text-gray-900">{student.certification_specialization || 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">الدرجة الأكاديمية</label>
                {isEditing ? (
                  <input type="text" value={form.academic_score} onChange={e => handleInputChange('academic_score', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" placeholder="85.5%" />
                ) : <p className="text-sm text-gray-900">{student.academic_score || 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ولي الأمر</label>
                {isEditing ? (
                  <input type="text" value={form.sponsor_name} onChange={e => handleInputChange('sponsor_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : <p className="text-sm text-gray-900">{student.sponsor_name || 'غير محدد'}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">هاتف ولي الأمر</label>
                {isEditing ? (
                  <input type="text" value={form.sponsor_contact} onChange={e => handleInputChange('sponsor_contact', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400" />
                ) : <p className="text-sm text-gray-900">{student.sponsor_contact || 'غير محدد'}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student ID Card Preview */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">بطاقة الطالب</h3>
              <div className="flex gap-1">
                <button onClick={() => setShowCardModal(true)} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100">عرض</button>
                <button onClick={printStudentCard} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100">طباعة</button>
              </div>
            </div>
            {/* Card-size preview (85.6mm x 53.98mm ratio = ~1.586) */}
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
                  <span className="text-[6px] text-[#2dd4bf] bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 px-1.5 py-0.5 rounded-full font-medium">بطاقة طالب</span>
                </div>
                {/* Mini card body */}
                <div className="flex p-2 gap-2 bg-white" style={{ minHeight: 0 }}>
                  {/* Photo */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-10 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {photoSrc ? (
                        <img src={photoSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-gray-900 truncate border-b border-gray-100 pb-0.5 mb-0.5">{student.name}</div>
                    <div className="text-[6.5px] text-gray-500 space-y-0.5">
                      <div className="flex justify-between"><span>رقم الطالب:</span><span className="font-medium text-gray-800">{student.campus_id || '-'}</span></div>
                      <div className="flex justify-between"><span>التخصص:</span><span className="font-medium text-gray-800 truncate mr-1">{getDepartmentName(student.department_id)}</span></div>
                      <div className="flex justify-between"><span>السنة:</span><span className="font-medium text-gray-800">{student.year || '-'}</span></div>
                    </div>
                  </div>
                  {/* QR */}
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
            <h3 className="text-sm font-semibold text-gray-900 mb-3">صورة الطالب</h3>
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
                { label: 'رقم الطالب', value: student.campus_id || student.id },
                { label: 'الحالة', value: getStatusBadge(student.status), isJsx: true },
                { label: 'تاريخ التسجيل', value: formatDate(student.enrollment_date) },
                { label: 'الهاتف', value: student.phone || '-' },
                { label: 'البريد', value: student.email || '-' },
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
              <h3 className="text-lg font-semibold text-gray-900">بطاقة الطالب</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Card at actual ratio */}
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
                <span className="text-[8px] text-[#2dd4bf] bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 px-2 py-0.5 rounded-full font-medium">بطاقة طالب</span>
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
                  <div className="text-sm font-bold text-[#1a2332] truncate border-b-2 border-[#2dd4bf] pb-1 mb-1">{student.name}</div>
                  {student.name_en && <div className="text-[10px] text-gray-500 mb-1">{student.name_en}</div>}
                  <div className="text-[10px] text-gray-600 space-y-1">
                    <div className="flex justify-between"><span>رقم الطالب:</span><span className="font-semibold text-[#1a2332]">{student.campus_id || student.id}</span></div>
                    <div className="flex justify-between"><span>التخصص:</span><span className="font-semibold text-[#1a2332] truncate mr-1">{getDepartmentName(student.department_id)}</span></div>
                    <div className="flex justify-between"><span>السنة الدراسية:</span><span className="font-semibold text-[#1a2332]">السنة {student.year || 1}</span></div>
                    <div className="flex justify-between"><span>تاريخ الميلاد:</span><span className="font-semibold text-[#1a2332]">{formatDate(student.birth_date)}</span></div>
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
                <span>تاريخ الإصدار: {formatDate(student.enrollment_date)}</span>
                <span>جامعة الخليل الأهلية - بطاقة رسمية</span>
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={printStudentCard} className="px-4 py-2 text-sm bg-[#1a2332] text-white rounded-lg hover:bg-[#243447]">طباعة البطاقة</button>
              <button onClick={() => setShowCardModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
