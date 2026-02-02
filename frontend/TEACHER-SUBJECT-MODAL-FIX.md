# إصلاح نموذج تكليف المدرسين بالمواد
# Teacher Subject Assignment Modal Fix

## ❌ **المشكلة / Problem**

عند إضافة مادة لمدرس من صفحة التفاصيل، كانت الأخطاء التالية تظهر:

```
GET .../study_years?select=name&id=eq.undefined 406 (Not Acceptable)
GET .../semesters?select=name&id=eq.undefined 406 (Not Acceptable)
POST .../teacher_subjects 400 (Bad Request)

Error: null value in column "study_year_id" violates not-null constraint
```

### السبب / Root Cause:
- النموذج (Modal) كان يستخدم الحقول القديمة:
  - `academic_year` (نص حر)
  - `semester` (قائمة ثابتة: fall, spring, summer)
- بينما قاعدة البيانات تم تحديثها لاستخدام مفاتيح خارجية:
  - `study_year_id` (مرتبط بجدول `study_years`)
  - `semester_id` (مرتبط بجدول `semesters`)

---

## ✅ **الحل / Solution**

### 1. **تحديث البيانات المستوردة / Updated Imports**
```typescript
import { 
  fetchStudyYears, 
  fetchSemesters 
} from "../../lib/api";
```

### 2. **تحديث حالة النموذج / Updated Form State**
```typescript
const [formData, setFormData] = useState({
  teacher_ids: [] as string[],
  subject_id: "",
  department_id: "",
  study_year_id: "",      // ✅ بدلاً من academic_year
  semester_id: "",        // ✅ بدلاً من semester
  is_primary_teacher: false,
  can_edit_grades: true,
  can_take_attendance: true,
  notes: ""
});
```

### 3. **جلب البيانات الأساسية / Fetch Master Data**
```typescript
const { data: studyYears } = useQuery({
  queryKey: ["study-years"],
  queryFn: () => fetchStudyYears()
});

const { data: semesters } = useQuery({
  queryKey: ["semesters"],
  queryFn: () => fetchSemesters()
});
```

### 4. **تحديث حقول النموذج / Updated Form Fields**

#### قبل (Before):
```typescript
// Academic Year - حقل نصي حر
<input
  type="number"
  min="2020"
  max="2030"
  value={formData.academic_year}
  onChange={(e) => handleInputChange("academic_year", e.target.value)}
/>

// Semester - قائمة منسدلة ثابتة
<select value={formData.semester}>
  <option value="fall">الفصل الأول</option>
  <option value="spring">الفصل الثاني</option>
  <option value="summer">الفصل الصيفي</option>
</select>
```

#### بعد (After):
```typescript
// Study Year - قائمة منسدلة من جدول study_years
<select value={formData.study_year_id}>
  <option value="">اختر السنة الأكاديمية</option>
  {studyYears?.map((year: any) => (
    <option key={year.id} value={year.id}>
      {year.name} {year.name_en && `(${year.name_en})`}
    </option>
  ))}
</select>

// Semester - قائمة منسدلة من جدول semesters
<select value={formData.semester_id}>
  <option value="">اختر الفصل الدراسي</option>
  {semesters?.map((semester: any) => (
    <option key={semester.id} value={semester.id}>
      {semester.name} {semester.name_en && `(${semester.name_en})`}
    </option>
  ))}
</select>
```

### 5. **التحقق من البيانات المطلوبة / Validation**
```typescript
// Validate required fields
if (!formData.study_year_id) {
  alert("يرجى اختيار السنة الأكاديمية");
  return;
}
if (!formData.semester_id) {
  alert("يرجى اختيار الفصل الدراسي");
  return;
}
```

### 6. **تحديث البيانات المرسلة / Updated Submission Data**
```typescript
const assignment = {
  teacher_id: teacherId,
  subject_id: formData.subject_id,
  department_id: formData.department_id,
  study_year_id: formData.study_year_id,  // ✅ المفتاح الخارجي
  semester_id: formData.semester_id,      // ✅ المفتاح الخارجي
  is_primary_teacher: formData.is_primary_teacher,
  can_edit_grades: formData.can_edit_grades,
  can_take_attendance: formData.can_take_attendance,
  notes: formData.notes
};
```

---

## 📋 **الملفات المعدلة / Modified Files**

### `src/components/teacher/TeacherSubjectModal.tsx`
- ✅ إضافة استيراد `fetchStudyYears` و `fetchSemesters`
- ✅ تحديث `formData` لاستخدام `study_year_id` و `semester_id`
- ✅ جلب بيانات السنوات الدراسية والفصول من قاعدة البيانات
- ✅ استبدال حقول النموذج بقوائم منسدلة ديناميكية
- ✅ إضافة تحقق من البيانات المطلوبة
- ✅ تحديث دالة الإرسال لاستخدام المفاتيح الخارجية

---

## 🎯 **النتيجة / Result**

### ✅ **يعمل الآن / Now Working:**
1. إضافة مادة لمدرس من صفحة تفاصيل المدرس
2. اختيار السنة الأكاديمية من القائمة المنسدلة
3. اختيار الفصل الدراسي من القائمة المنسدلة
4. حفظ التكليف بنجاح في قاعدة البيانات
5. ربط صحيح بجداول `study_years` و `semesters`

### ✅ **التكامل الكامل / Full Integration:**
- النموذج متوافق مع التحديثات الأخيرة في:
  - صفحة "تكليف المدرسين بالمواد"
  - دالة `createTeacherSubjectAssignment` في `api.ts`
  - جدول `teacher_subjects` في قاعدة البيانات

---

## 🔍 **الاختبار / Testing**

### خطوات الاختبار / Test Steps:
1. ✅ افتح صفحة تفاصيل أي مدرس
2. ✅ اضغط "إضافة مادة"
3. ✅ اختر المادة من القائمة
4. ✅ اختر القسم من القائمة
5. ✅ **اختر السنة الأكاديمية** من القائمة المنسدلة (جديد)
6. ✅ **اختر الفصل الدراسي** من القائمة المنسدلة (جديد)
7. ✅ حدد الصلاحيات
8. ✅ اضغط "إضافة المدرسين"
9. ✅ يتم الحفظ بنجاح بدون أخطاء

### النتيجة المتوقعة / Expected Result:
- ✅ لا توجد أخطاء 406 في Console
- ✅ لا توجد أخطاء 400 في Console
- ✅ رسالة نجاح (أو إغلاق النموذج)
- ✅ ظهور المادة في قائمة "المواد المكلف بها"
- ✅ البيانات محفوظة بشكل صحيح في `teacher_subjects`

---

## 📝 **ملاحظات مهمة / Important Notes**

### ⚠️ **متطلبات النظام / System Requirements:**
1. يجب أن يحتوي جدول `study_years` على بيانات
2. يجب أن يحتوي جدول `semesters` على بيانات
3. العلاقات الخارجية يجب أن تكون موجودة في قاعدة البيانات

### ✅ **التوافق / Compatibility:**
- متوافق مع جميع الصفحات التي تستخدم `TeacherSubjectModal`
- متوافق مع نظام RBAC
- متوافق مع API الجديد

### 🔄 **التحديثات المستقبلية / Future Updates:**
- يمكن إضافة تصفية الفصول بناءً على السنة الأكاديمية المختارة
- يمكن إضافة تصفية المواد بناءً على القسم المختار
- يمكن إضافة عرض معلومات إضافية عن السنة/الفصل

---

## ✅ **الخلاصة / Summary**

تم إصلاح النموذج بنجاح ليستخدم المفاتيح الخارجية الجديدة (`study_year_id`, `semester_id`) بدلاً من الحقول النصية القديمة. النظام الآن متكامل بشكل كامل مع البيانات الأساسية (Master Data) ويعمل بدون أخطاء! 🎉


