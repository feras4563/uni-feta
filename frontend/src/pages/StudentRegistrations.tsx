import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { fetchAllStudentSubjectEnrollments } from "@/lib/api";

 const toLatinDigits = (value: string | number | null | undefined) => {
   const input = String(value ?? "");
   return input
     .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
     .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
 };

 const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

 const formatCurrency = (value: number) => `${formatNumber(value)} دينار`;

 const formatDate = (value: string) =>
   toLatinDigits(
     new Intl.DateTimeFormat("en-GB", {
       day: "2-digit",
       month: "2-digit",
       year: "numeric",
     }).format(new Date(value))
   );

export default function StudentRegistrations() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const trimmedSearchTerm = searchTerm.trim();
  const shouldShowResults = trimmedSearchTerm.length >= 2;

  // Fetch all student enrollments
  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ["all-student-enrollments"],
    queryFn: fetchAllStudentSubjectEnrollments,
  });

  const filteredEnrollments = useMemo(() => {
    if (!enrollments) return [];

    if (!shouldShowResults) return [];

    return enrollments.filter((enrollment: any) => {
      const normalizedSearch = trimmedSearchTerm.toLowerCase();
      const matchesSearch =
        enrollment.student?.name?.toLowerCase().includes(normalizedSearch) ||
        enrollment.student?.email?.toLowerCase().includes(normalizedSearch) ||
        enrollment.subject?.name?.toLowerCase().includes(normalizedSearch) ||
        enrollment.subject?.code?.toLowerCase().includes(normalizedSearch);

      const paymentStatus = enrollment.payment_status || "unpaid";
      const matchesStatus = statusFilter === "all" || paymentStatus === statusFilter;
      const matchesSemester =
        semesterFilter === "all" || String(enrollment.semester?.id || "") === semesterFilter;

      return matchesSearch && matchesStatus && matchesSemester;
    });
  }, [enrollments, shouldShowResults, trimmedSearchTerm, statusFilter, semesterFilter]);

  const semesterOptions = useMemo(() => {
    if (!enrollments) return [];

    const seen = new Map<string, string>();
    enrollments.forEach((enrollment: any) => {
      if (enrollment.semester?.id && enrollment.semester?.name) {
        seen.set(String(enrollment.semester.id), enrollment.semester.name);
      }
    });

    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [enrollments]);

  const studentCards = useMemo(() => {
    const grouped = new Map<string, any>();

    filteredEnrollments.forEach((enrollment: any) => {
      const student = enrollment.student || {};
      const studentKey = String(student.id || enrollment.student_id || enrollment.id);
      const subjectCost = (enrollment.subject?.credits || 0) * (enrollment.subject?.cost_per_credit || 0);

      if (!grouped.has(studentKey)) {
        grouped.set(studentKey, {
          key: studentKey,
          student,
          enrollments: [],
          totalCost: 0,
          paidCount: 0,
          partialCount: 0,
          unpaidCount: 0,
          latestEnrollment: enrollment,
          semesters: new Set<string>(),
        });
      }

      const entry = grouped.get(studentKey);
      entry.enrollments.push(enrollment);
      entry.totalCost += subjectCost;
      entry.semesters.add(enrollment.semester?.name || "-");

      if (
        enrollment.enrollment_date &&
        (!entry.latestEnrollment?.enrollment_date ||
          new Date(enrollment.enrollment_date).getTime() > new Date(entry.latestEnrollment.enrollment_date).getTime())
      ) {
        entry.latestEnrollment = enrollment;
      }

      if (enrollment.payment_status === "paid") {
        entry.paidCount += 1;
      } else if (enrollment.payment_status === "partial") {
        entry.partialCount += 1;
      } else {
        entry.unpaidCount += 1;
      }
    });

    return Array.from(grouped.values())
      .map((entry) => ({
        ...entry,
        semesters: Array.from(entry.semesters),
      }))
      .sort((a, b) => (a.student?.name || "").localeCompare(b.student?.name || "ar"));
  }, [filteredEnrollments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            <CheckCircle className="h-3 w-3" />
            مدفوع
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            <AlertCircle className="h-3 w-3" />
            جزئي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            <AlertCircle className="h-3 w-3" />
            غير مدفوع
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"></div>
          <p className="text-sm text-slate-600">جاري تحميل تسجيلات الطلاب...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">خطأ في تحميل البيانات</h3>
          <p className="mt-2 text-sm text-slate-500">حدث خطأ أثناء تحميل تسجيلات الطلاب</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">تسجيل الطلاب في الفصل الدراسي</h1>
            <p className="mt-2 text-sm text-slate-600">ابحث أولاً عن الطالب لعرض تسجيلاته بشكل منظم ومختصر حسب الطالب.</p>
          </div>
          <button
            onClick={() => navigate("/student-registrations/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            تسجيل جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو البريد أو رمز المقرر"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="all">كل حالات الدفع</option>
            <option value="paid">مدفوع</option>
            <option value="partial">مدفوع جزئياً</option>
            <option value="unpaid">غير مدفوع</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="all">كل الفصول</option>
            {semesterOptions.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">عرض حسب الطالب</h2>
          <p className="mt-1 text-sm text-slate-500">
            {trimmedSearchTerm.length === 0
              ? "لن تظهر النتائج إلا بعد البحث عن الطالب."
              : trimmedSearchTerm.length < 2
              ? "اكتب حرفين على الأقل لإظهار النتائج."
              : `${formatNumber(studentCards.length)} طالب مطابق للفلاتر الحالية`}
          </p>
        </div>
      </div>

      {trimmedSearchTerm.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">ابدأ بالبحث عن طالب</h3>
          <p className="mt-2 text-sm text-slate-500">اكتب اسم الطالب أو بريده الإلكتروني أو رمز المقرر لإظهار النتائج.</p>
        </div>
      ) : trimmedSearchTerm.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Search className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">البحث يحتاج حرفين على الأقل</h3>
          <p className="mt-2 text-sm text-slate-500">أكمل كتابة عبارة البحث ليتم عرض الطلاب.</p>
        </div>
      ) : studentCards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-900">لا توجد نتائج</h3>
          <p className="mt-2 text-sm text-slate-500">لم يتم العثور على تسجيلات تطابق معايير البحث الحالية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {studentCards.map((card) => (
            <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {(card.student?.name || "ط").trim().charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{card.student?.name || "طالب غير معروف"}</h3>
                    <p className="mt-1 text-sm text-slate-500">{card.student?.email || "لا يوجد بريد إلكتروني"}</p>
                    {card.student?.national_id_passport && (
                      <p className="mt-1 text-xs text-slate-400">{toLatinDigits(card.student.national_id_passport)}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/student-registrations/${card.latestEnrollment.id}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  عرض التفاصيل
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">عدد المقررات</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(card.enrollments.length)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">التكلفة الإجمالية</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(card.totalCost)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">مدفوع</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(card.paidCount)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">يتطلب متابعة</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(card.partialCount + card.unpaidCount)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  <Calendar className="h-3.5 w-3.5" />
                  {toLatinDigits(card.semesters.join("، "))}
                </span>
                {card.latestEnrollment?.enrollment_date && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    آخر تسجيل: {formatDate(card.latestEnrollment.enrollment_date)}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {card.enrollments.slice(0, 3).map((enrollment: any) => (
                  <div key={enrollment.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{enrollment.subject?.code} - {enrollment.subject?.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(enrollment.subject?.credits || 0)} ساعة معتمدة
                        {enrollment.semester?.name ? ` - ${enrollment.semester.name}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency((enrollment.subject?.credits || 0) * (enrollment.subject?.cost_per_credit || 0))}
                      </span>
                      {getStatusBadge(enrollment.payment_status || "unpaid")}
                    </div>
                  </div>
                ))}

                {card.enrollments.length > 3 && (
                  <div className="text-sm text-slate-500">
                    + {formatNumber(card.enrollments.length - 3)} مقررات أخرى لهذا الطالب
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
