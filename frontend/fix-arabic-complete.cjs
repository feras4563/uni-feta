const fs = require('fs');
const path = require('path');

console.log('='.repeat(50));
console.log('Complete Arabic text fix');
console.log('='.repeat(50));
console.log('');

// Read and fix Students.tsx
console.log('Fixing Students.tsx...');
let studentsContent = fs.readFileSync('src/pages/Students.tsx', 'utf8');

// Replace all corrupted patterns with proper Arabic
const studentsPatterns = [
    // Mixed corrupted text
    [/\?\?جميع السنوات\?\?/g, 'البحث والتصفية'],
    [/\?جميع السنوات\?\?/g, 'جميع الأقسام'],
    [/\?جميع السنوات\?/g, 'جميع السنوات'],
    [/\?\?جميع السنوات/g, 'السنة الأولى'],
    [/\?\?جميع السنوات\?/g, 'السنة الثانية'],
    [/جميع السنوات \?\? \?\?\?\? \?\?\?\?/g, 'عرض بيانات الطالب'],
    [/\?\?\?\?\? \?\? \?\?جميع السنوات/g, 'تعديل بيانات الطالب'],
    [/\?\?\? \?\?جميع السنوات/g, 'عرض التفاصيل'],
    [/\?\?\?جميع السنوات\?\?\?\?/g, 'معلومات الطالب'],
    [/\?\?\?جميع السنوات\?\?\?\?\?/g, 'معلومات الاتصال'],
    [/جميع السنوات:/g, 'رقم الهاتف:'],
    [/\?\?\?جميع السنوات\?\?\?\?:/g, 'البريد الإلكتروني:'],
    [/\?\? \?\?\? \?\?\?\? \?\?\? QR \?جميع السنوات \?\?\?/g, 'لا يوجد رمز QR لهذا الطالب'],
    [/\?\?\?جميع السنوات\?/g, 'التخصص'],
    [/\?\?\?جميع السنوات \?\? \?\?\?\?\? \?\?\?\?\?/g, 'خطأ في تحميل البيانات'],
    [/\?\?\? \?\? \?\? \?\?جميع السنوات\?\?/g, 'خطأ في تحميل الطلاب'],
    [/\?\?\? \?\? جميع السنوات/g, 'خطأ في حذف الطالب'],
    [/\?\? \?\?\?\? \?\?\? QR \?جميع السنوات \?\?\?\?\?\?\?/g, 'لا يوجد رمز QR لهذا الطالب'],
    [/\?\?جميع السنوات\?\?/g, 'تصدير البيانات'],
    [/\?\?\?/g, 'نشط'],
    [/\?\?\? \?\?\?/g, 'غير نشط'],
];

studentsPatterns.forEach(([pattern, replacement]) => {
    studentsContent = studentsContent.replace(pattern, replacement);
});

fs.writeFileSync('src/pages/Students.tsx', studentsContent, 'utf8');
console.log('✓ Students.tsx fixed');

// Read and fix Teachers.tsx
console.log('Fixing Teachers.tsx...');
let teachersContent = fs.readFileSync('src/pages/Teachers.tsx', 'utf8');

const teachersPatterns = [
    // Teachers specific patterns
    [/\?توفر المدرسين\?/g, 'توفر المدرسين'],
    [/المدرسون النشطون\?/g, 'المدرسون النشطون'],
    [/مدرسون بدوام كامل\?/g, 'مدرسون بدوام كامل'],
    [/مدرسون بدوام جزئي\?/g, 'مدرسون بدوام جزئي'],
    [/جميع الأقسام\?\?/g, 'جميع الأقسام'],
    [/نشط فقط\?/g, 'نشط فقط'],
    [/رقم الهاتف\?\?/g, 'رقم الهاتف'],
    [/\?\?\?\?\?\?\?/g, 'الإجراءات'],
    [/\?\?\?\?\?\?/g, 'التخصص'],
    [/\?\?\?\?/g, 'الاسم'],
    [/\?\?\?/g, 'نشط'],
    [/\?\?\? \?\?\?/g, 'غير نشط'],
];

teachersPatterns.forEach(([pattern, replacement]) => {
    teachersContent = teachersContent.replace(pattern, replacement);
});

fs.writeFileSync('src/pages/Teachers.tsx', teachersContent, 'utf8');
console.log('✓ Teachers.tsx fixed');

console.log('');
console.log('='.repeat(50));
console.log('✓ All files fixed successfully!');
console.log('='.repeat(50));
console.log('');
console.log('Please refresh your browser (Ctrl+F5) to see changes.');
