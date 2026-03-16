const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const FORM_STATIC_URL = `${API_BASE.replace('/api', '')}/storage/forms/student_registration_form.pdf`;

interface StudentFormData {
  name?: string;
  name_en?: string;
  campus_id?: string;
  national_id_passport?: string;
  gender?: string;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
  sponsor_name?: string;
  sponsor_contact?: string;
  academic_history?: string;
  academic_score?: string;
  certification_type?: string;
  certification_date?: string;
  certification_school?: string;
  certification_specialization?: string;
  department_name?: string;
  semester_label?: string;
  enrollment_date?: string;
  port_of_entry?: string;
  visa_type?: string;
  mother_name?: string;
  mother_nationality?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_place_of_issue?: string;
}

const dots = (n: number) => '.'.repeat(n);
const v = (val?: string, fallbackDots = 20) => val || dots(fallbackDots);

function buildFormHtml(data: StudentFormData, isLibyan: boolean): string {
  const currentYear = new Date().getFullYear();
  const semesterLabel = data.semester_label || dots(8);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800;900&display=swap');
    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 210mm; min-height: 297mm; background: #fff; }
    body {
      font-family: 'Noto Sans Arabic', 'Arial', sans-serif;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color: #1a2744;
    }
    .page {
      width: 210mm; min-height: 297mm;
      padding: 8mm 12mm 10mm 12mm;
      position: relative;
    }
    /* Watermark */
    .watermark {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.06; pointer-events: none; z-index: 0;
      font-size: 120px; font-weight: 900; color: #1a4d8c;
      white-space: nowrap; letter-spacing: 8px;
    }
    .content { position: relative; z-index: 1; }

    /* Header */
    .header { text-align: center; margin-bottom: 2mm; position: relative; }
    .header-top {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 3mm; padding: 0 2mm;
    }
    .header-right { text-align: right; font-size: 9px; line-height: 1.6; }
    .header-left { text-align: left; font-size: 9px; line-height: 1.6; direction: ltr; }
    .header-center { text-align: center; }
    .logo-text {
      font-size: 22px; font-weight: 900; color: #1a4d8c;
      letter-spacing: 3px; margin-bottom: 1mm;
    }
    .logo-sub { font-size: 10px; color: #1a4d8c; font-weight: 600; }
    .ref-date {
      display: flex; justify-content: space-between;
      font-size: 10px; margin-top: 3mm; padding: 0 5mm;
      border-top: 1.5px solid #1a4d8c; padding-top: 2mm;
    }

    /* Title */
    .form-title {
      text-align: center; margin: 5mm 0 4mm;
    }
    .form-title h1 {
      font-size: 18px; font-weight: 800; color: #1a2744;
      margin-bottom: 1mm;
    }
    .form-title h2 {
      font-size: 14px; font-weight: 700; color: #1a2744;
    }

    /* Sections */
    .section {
      border: 1.5px solid #1a4d8c;
      border-radius: 4px;
      margin-bottom: 4mm;
      overflow: hidden;
    }
    .section-title {
      background: #1a4d8c; color: #fff;
      font-size: 13px; font-weight: 700;
      padding: 2mm 4mm;
    }
    .section-body {
      padding: 3mm 4mm;
      font-size: 11px;
      line-height: 2.2;
    }

    /* Field rows */
    .row { display: flex; flex-wrap: wrap; gap: 0; }
    .field { display: inline; }
    .label { font-weight: 600; }
    .val {
      display: inline-block;
      min-width: 25mm;
      border-bottom: 1px dotted #555;
      padding: 0 2mm;
      font-weight: 500;
      text-align: center;
    }
    .val-wide { min-width: 50mm; }
    .val-full { min-width: 100%; display: block; text-align: right; }

    .sig-area {
      display: flex; justify-content: center; align-items: center;
      margin-top: 3mm; gap: 30mm;
    }
    .sig-block { text-align: center; font-size: 11px; }
    .sig-line {
      width: 50mm; border-bottom: 1px dotted #555;
      margin: 8mm auto 0; height: 1px;
    }

    /* Footer */
    .footer {
      border-top: 1.5px solid #1a4d8c;
      margin-top: 3mm; padding-top: 2mm;
      font-size: 8px; color: #666;
      display: flex; justify-content: space-between;
    }

    @media print {
      .no-print { display: none !important; }
      .page { padding: 8mm 12mm 10mm 12mm; }
    }
    @media screen {
      body { background: #e5e7eb; }
      .page { margin: 20px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.15); background: #fff; }
      .toolbar {
        position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
        z-index: 1000; background: #1a2332; color: #fff;
        padding: 10px 24px; border-radius: 10px;
        display: flex; gap: 14px; align-items: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        font-family: 'Noto Sans Arabic', sans-serif; font-size: 13px;
      }
      .toolbar button {
        background: #2dd4bf; color: #1a2332; border: none;
        padding: 7px 18px; border-radius: 7px; cursor: pointer;
        font-weight: 600; font-size: 13px;
        font-family: 'Noto Sans Arabic', sans-serif;
      }
      .toolbar button:hover { background: #14b8a6; }
    }`;

  const studentDataSection = isLibyan ? `
    <div class="section-body">
      <span class="label">اسم الطالب رباعي:</span> <span class="val val-wide">${v(data.name, 40)}</span>
      <span class="label">رقم القيد الجامعي:</span>(<span class="val">${v(data.campus_id, 12)}</span>)
      <br>
      <span class="label">تاريخ ومكان والميلاد:</span> <span class="val">${v(data.birth_date, 15)}</span>
      <span class="val">${v(data.birth_place, 15)}</span>
      <span class="label">محل الإقامة:</span> <span class="val">${v(data.address, 18)}</span>
      <span class="label">المدرسة المتحصل منها الطالب على</span>
      <br>
      <span class="label">الشهادة:</span> <span class="val">${v(data.certification_school, 20)}</span>
      <span class="label">التخصص:</span> <span class="val">${v(data.certification_specialization, 18)}</span>
      <span class="label">تاريخ الحصول عنها:</span> <span class="val">${v(data.certification_date, 15)}</span>
      <span class="label">التقدير</span>
      <br>
      <span class="label">العام:</span> <span class="val">${v(data.academic_score, 8)}</span>%.
      <br>
      <span class="label">البرنامج العلمي الذي يرغب الطالب التسجيل فيه:</span>
      <br>
      <span class="val val-full">${v(data.department_name, 50)}</span>
      <div class="sig-area">
        <div class="sig-block">
          <span>توقيع الطالب</span>
          <div class="sig-line"></div>
        </div>
      </div>
    </div>` : `
    <div class="section-body">
      <span class="label">أنا مقدم الطلب:</span>
      <span class="val val-full">${v(data.name, 50)}</span>
      <span class="label">الجنس:</span> <span class="val">${data.gender === 'male' ? 'ذكر' : data.gender === 'female' ? 'أنثى' : dots(15)}</span>
      <span class="label">الجنسية:</span> <span class="val">${v(data.nationality, 18)}</span>
      <span class="label">مكان وتاريخ الميلاد:</span> <span class="val">${v(data.birth_place, 12)}</span> <span class="val">${v(data.birth_date, 12)}</span>
      <span class="label">رقم جواز</span>
      <br>
      <span class="label">السفر:</span> <span class="val">${v(data.passport_number, 22)}</span>
      <span class="label">مكان وتاريخ الإصدار:</span> <span class="val">${v(data.passport_place_of_issue, 12)}</span> <span class="val">${v(data.passport_issue_date, 12)}</span>
      <span class="label">تاريخ الصلاحية:</span>
      <br>
      <span class="val">${v(data.passport_expiry_date, 22)}</span>
      <span class="label">معبر الدخول:</span> <span class="val">${v(data.port_of_entry, 15)}</span>
      <span class="label">نوع الإقامة:</span> <span class="val">${v(data.visa_type, 15)}</span>
      <span class="label">اسم الأم:</span> <span class="val">${v(data.mother_name, 18)}</span>
      <br>
      <span class="label">جنسيتها:</span> <span class="val">${v(data.mother_nationality, 18)}</span>
      <span class="label">محل الإقامة الحالي:</span> <span class="val">${v(data.address, 18)}</span>
      <span class="label">الشهادة ما قبل المرحلة الجامعية</span>
      <br>
      <span class="label">المتحصل عليها:</span> <span class="val">${v(data.certification_school, 25)}</span>
      <span class="label">النسبة:</span> <span class="val">${v(data.academic_score, 10)}</span>%
      <span class="label">التقدير:</span> <span class="val">${v(data.certification_type, 15)}</span>
      <span class="label">العام</span>
      <br>
      <span class="label">الدراسي:</span> <span class="val">${v(data.certification_date, 6)}</span>20م.
      <br>
      <span class="label">أتقدم إليكم بطلبي هذا بشأن قبولي كطالب ببرامج الدراسة الجامعية بقسم:</span> <span class="val">${v(data.department_name, 30)}</span>
      <div class="sig-area">
        <div class="sig-block">
          <span>توقيع مقدم الطلب</span>
          <div class="sig-line"></div>
          <div style="margin-top:3mm; font-size:10px;">التاريخ: ${dots(6)}\\${dots(6)}\\${dots(4)}20م</div>
        </div>
      </div>
    </div>`;

  const title = isLibyan
    ? `نموذج قبول وتسجيل طالب للفصل الدراسي (${semesterLabel}) ${dots(4)}20م`
    : `نموذج قبول وتسجيل طالب (وافد) للفصل الدراسي (${semesterLabel}) ${dots(4)}20م`;
  const subtitle = `للعام الجامعي ${dots(5)}20\\${dots(5)}20م`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>نموذج قبول وتسجيل طالب - ${data.name || ''}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="toolbar no-print">
    <span>نموذج قبول وتسجيل طالب - ${data.name || 'طالب'}</span>
    <button onclick="window.print()">طباعة</button>
  </div>

  <div class="page">
    <div class="watermark">U.K.L</div>
    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div class="header-right">
            دولة ليبيا<br>
            وزارة التعليم العالي والبحث العلمي<br>
            إدارة التعليم العالي الخاص
          </div>
          <div class="header-center">
            <div class="logo-text">U.K.L</div>
            <div class="logo-sub">UNIVERSITY OF ALKHALIL</div>
          </div>
          <div class="header-left">
            جـامـعـة الـخـلـيـل الأهـلـيـة<br>
            www.ukl.com.ly
          </div>
        </div>
        <div class="ref-date">
          <span>الرقم الإشاري: &nbsp; Refno.</span>
          <span>التاريـــــخ: &nbsp; / &nbsp; / &nbsp; DATE</span>
        </div>
      </div>

      <!-- Title -->
      <div class="form-title">
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
      </div>

      <!-- بيانات الطالب -->
      <div class="section">
        <div class="section-title">بيانات الطالب:</div>
        ${studentDataSection}
      </div>

      <!-- بيانات تخص القسم المالي -->
      <div class="section">
        <div class="section-title">بيانات تخص القسم المالي:</div>
        <div class="section-body">
          <span class="label">سدد الطالب مبلغ وقدره:</span> (<span class="val">${dots(7)}</span>) دينار فقط
          &emsp;
          <span class="label">بتاريخ :</span><span class="val">${dots(6)}</span>\\<span class="val">${dots(6)}</span>\\<span class="val">${dots(6)}</span>20م.
          <br>
          <div style="text-align:center; margin-top:2mm;">الخزينة</div>
          <div class="sig-line" style="margin: 2mm auto;"></div>
        </div>
      </div>

      <!-- بيانات تخص القسم العلمي -->
      <div class="section">
        <div class="section-title">بيانات تخص القسم العلمي :</div>
        <div class="section-body">
          <span class="label">تم قبول الطالب في قسم:</span> <span class="val val-wide">${v(data.department_name, 30)}</span>
          <span class="label">توقيع رئيس القسم:</span> <span class="val">${dots(25)}</span>
        </div>
      </div>

      <!-- اعتماد -->
      <div style="text-align:center; margin-top: 5mm;">
        <div style="font-size: 12px; font-weight: 700;">اعتماد</div>
        <div style="font-size: 11px; margin-top: 2mm;">مسجل عام الجامعة</div>
        <div class="sig-line" style="margin: 5mm auto;"></div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <span>Janzour, Tripoli, Libya - جنزور، طرابلس، ليبيا</span>
        <span>info@ukl.com.ly | +218 92 504 8815 | +218 91 888 85 47 | www.ukl.com.ly</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Opens a new window with the filled registration form — instant, no PDF fetch needed.
 */
export function printFilledRegistrationForm(data: StudentFormData, isLibyan: boolean) {
  const w = window.open('', '_blank');
  if (!w) return;
  const html = buildFormHtml(data, isLibyan);
  w.document.write(html);
  w.document.close();
}

/**
 * Opens the blank form template for viewing/printing.
 */
export function viewBlankForm() {
  window.open(FORM_STATIC_URL, '_blank');
}

/**
 * Downloads the blank form template.
 */
export function downloadBlankForm() {
  const a = document.createElement('a');
  a.href = FORM_STATIC_URL;
  a.download = 'student_registration_form.pdf';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export { FORM_STATIC_URL as FORM_PDF_URL };
export type { StudentFormData };
