import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Plus, Edit, Trash2, Search, X, Save,
  AlertCircle, CheckCircle, RefreshCw, Filter, Layers
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GlAccount {
  id: number;
  account_name: string;
  account_number: string;
  account_type: string;
}

interface FeeDefinition {
  id: string;
  name_ar: string;
  name_en: string | null;
  default_amount: number;
  is_refundable: boolean;
  frequency: 'one_time' | 'per_semester' | 'per_credit' | 'annual';
  is_active: boolean;
  description: string | null;
  gl_account_id: number | null;
  gl_account?: GlAccount | null;
  rules?: FeeRule[];
  created_at: string;
}

interface FeeRule {
  id: string;
  fee_definition_id: string;
  department_id: string | null;
  target_semester: number | null;
  override_amount: number | null;
  condition_type: string | null;
  condition_value: string | null;
  is_active: boolean;
  notes: string | null;
  fee_definition?: FeeDefinition;
  department?: { id: string; name: string; name_en: string | null };
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  name_en: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'مرة واحدة',
  per_semester: 'لكل فصل دراسي',
  per_credit: 'لكل ساعة معتمدة',
  annual: 'سنوي',
};

const CONDITION_LABELS: Record<string, string> = {
  none: 'بدون شرط',
  total_credits_gt: 'إجمالي الساعات أكبر من',
  total_credits_lt: 'إجمالي الساعات أقل من',
  student_year_eq: 'سنة الطالب تساوي',
  nationality_eq: 'الجنسية تساوي',
};

// ─── API Functions ───────────────────────────────────────────────────────────

const fetchFeeDefinitions = (): Promise<FeeDefinition[]> => api.get('/fee-definitions');
const fetchFeeRules = (): Promise<FeeRule[]> => api.get('/fee-rules');
const fetchDepartments = (): Promise<Department[]> => api.get('/departments');
const fetchAccounts = (): Promise<GlAccount[]> => api.get('/accounts');

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FeeStructure() {
  const queryClient = useQueryClient();
  const { canEdit, canCreate, canDelete } = usePermissions();
  const canManage = canEdit('fee-structure') || canCreate('fee-structure');
  const [activeTab, setActiveTab] = useState<'definitions' | 'rules'>('definitions');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">هيكل الرسوم</h1>
          <p className="text-sm text-gray-500 mt-0.5">إعداد وإدارة أنواع الرسوم الجامعية وقواعد تطبيقها</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('definitions')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'definitions'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            تعريفات الرسوم
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'rules'
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            قواعد التطبيق
          </button>
        </div>

        {activeTab === 'definitions' ? (
          <FeeDefinitionsTab isManager={canManage} queryClient={queryClient} />
        ) : (
          <FeeRulesTab isManager={canManage} queryClient={queryClient} />
        )}
      </div>
    </div>
  );
}

// ─── Fee Definitions Tab ─────────────────────────────────────────────────────

function FeeDefinitionsTab({ isManager, queryClient }: { isManager: boolean; queryClient: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeDefinition | null>(null);

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ['fee-definitions'],
    queryFn: fetchFeeDefinitions,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fee-definitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-definitions'] });
    },
    onError: (error: any) => {
      alert(error.message || 'فشل في حذف تعريف الرسم');
    },
  });

  const filtered = useMemo(() => {
    if (!searchTerm) return definitions;
    const s = searchTerm.toLowerCase();
    return definitions.filter(
      (d) =>
        d.name_ar.toLowerCase().includes(s) ||
        d.name_en?.toLowerCase().includes(s)
    );
  }, [definitions, searchTerm]);

  const handleDelete = (fee: FeeDefinition) => {
    if (window.confirm(`هل أنت متأكد من حذف الرسم "${fee.name_ar}"؟`)) {
      deleteMutation.mutate(fee.id);
    }
  };

  const handleEdit = (fee: FeeDefinition) => {
    setEditingFee(fee);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFee(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث..."
            className="w-full pr-9 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
          />
        </div>
        {isManager && (
          <button
            onClick={() => { setEditingFee(null); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            إضافة رسم
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">{searchTerm ? 'لم يتم العثور على نتائج' : 'لا توجد تعريفات رسوم بعد'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الرسم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">التكرار</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحساب المحاسبي</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                  {isManager && <th className="px-4 py-3 w-20"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{fee.name_ar}</div>
                      {fee.name_en && <div className="text-xs text-gray-400 mt-0.5">{fee.name_en}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm tabular-nums text-gray-900">
                        {Number(fee.default_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-gray-400 text-xs">د.ل</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{FREQUENCY_LABELS[fee.frequency]}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {fee.gl_account ? (
                        <span className="text-xs text-gray-600" dir="ltr">
                          {fee.gl_account.account_number} - {fee.gl_account.account_name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs ${fee.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${fee.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {fee.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(fee)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="تعديل">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(fee)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="حذف" disabled={deleteMutation.isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <FeeDefinitionFormModal fee={editingFee} onClose={handleCloseForm} queryClient={queryClient} />
      )}
    </>
  );
}

// ─── Fee Definition Form Modal ───────────────────────────────────────────────

function FeeDefinitionFormModal({
  fee,
  onClose,
  queryClient,
}: {
  fee: FeeDefinition | null;
  onClose: () => void;
  queryClient: any;
}) {
  const isEdit = !!fee;
  type FeeFrequency = FeeDefinition['frequency'];

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const [formData, setFormData] = useState({
    name_ar: fee?.name_ar || '',
    name_en: fee?.name_en || '',
    default_amount: fee?.default_amount?.toString() || '',
    is_refundable: fee?.is_refundable || false,
    frequency: (fee?.frequency || 'one_time') as FeeFrequency,
    is_active: fee?.is_active ?? true,
    description: fee?.description || '',
    gl_account_id: fee?.gl_account_id?.toString() || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.put(`/fee-definitions/${fee!.id}`, data) : api.post('/fee-definitions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-definitions'] });
      onClose();
    },
    onError: (error: any) => {
      if (error.errors) setErrors(error.errors);
      else alert(error.message || 'فشل في حفظ تعريف الرسم');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!formData.name_ar.trim()) newErrors.name_ar = 'الاسم بالعربية مطلوب';
    if (!formData.default_amount || parseFloat(formData.default_amount) < 0) newErrors.default_amount = 'المبلغ مطلوب';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    saveMutation.mutate({
      ...formData,
      default_amount: parseFloat(formData.default_amount),
      gl_account_id: formData.gl_account_id ? parseInt(formData.gl_account_id) : null,
    });
  };

  // Filter to revenue-type accounts for the GL dropdown
  const revenueAccounts = accounts.filter((a: GlAccount) => a.account_type === 'revenue' || a.account_type === 'liability');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'تعديل تعريف الرسم' : 'إضافة تعريف رسم جديد'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالعربية *</label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.name_ar ? 'border-red-300' : 'border-gray-200'} focus:ring-1 focus:ring-gray-300 focus:border-gray-300`}
                placeholder="رسوم التسجيل"
              />
              {errors.name_ar && <p className="text-xs text-red-500 mt-1">{errors.name_ar}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالإنجليزية</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                placeholder="Registration Fee"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">المبلغ الافتراضي (د.ل) *</label>
              <input
                type="number"
                value={formData.default_amount}
                onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.default_amount ? 'border-red-300' : 'border-gray-200'} focus:ring-1 focus:ring-gray-300 focus:border-gray-300`}
                placeholder="0.00"
                min="0"
                step="0.001"
                dir="ltr"
              />
              {errors.default_amount && <p className="text-xs text-red-500 mt-1">{errors.default_amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">التكرار *</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as FeeFrequency })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الحساب المحاسبي (دفتر الأستاذ)</label>
            <select
              value={formData.gl_account_id}
              onChange={(e) => setFormData({ ...formData, gl_account_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            >
              <option value="">— الحساب الافتراضي —</option>
              {revenueAccounts.map((acc: GlAccount) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_number} - {acc.account_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">اختر الحساب الذي ستُسجل فيه إيرادات هذا الرسم</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              rows={2}
              placeholder="وصف اختياري..."
            />
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_refundable}
                onChange={(e) => setFormData({ ...formData, is_refundable: e.target.checked })}
                className="h-3.5 w-3.5 text-gray-900 focus:ring-gray-300 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">قابل للاسترداد</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-3.5 w-3.5 text-gray-900 focus:ring-gray-300 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">نشط</span>
            </label>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fee Rules Tab ───────────────────────────────────────────────────────────

function FeeRulesTab({ isManager, queryClient }: { isManager: boolean; queryClient: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null);
  const [filterFeeId, setFilterFeeId] = useState('all');

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['fee-rules'],
    queryFn: fetchFeeRules,
  });

  const { data: definitions = [] } = useQuery({
    queryKey: ['fee-definitions'],
    queryFn: fetchFeeDefinitions,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fee-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-rules'] });
      queryClient.invalidateQueries({ queryKey: ['fee-definitions'] });
    },
    onError: (error: any) => {
      alert(error.message || 'فشل في حذف القاعدة');
    },
  });

  const filtered = useMemo(() => {
    if (filterFeeId === 'all') return rules;
    return rules.filter((r) => r.fee_definition_id === filterFeeId);
  }, [rules, filterFeeId]);

  const handleDelete = (rule: FeeRule) => {
    if (window.confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
      deleteMutation.mutate(rule.id);
    }
  };

  const handleEdit = (rule: FeeRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <select
          value={filterFeeId}
          onChange={(e) => setFilterFeeId(e.target.value)}
          className="max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
        >
          <option value="all">جميع الرسوم</option>
          {definitions.map((d) => (
            <option key={d.id} value={d.id}>{d.name_ar}</option>
          ))}
        </select>
        {isManager && (
          <button
            onClick={() => { setEditingRule(null); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            إضافة قاعدة
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">{filterFeeId !== 'all' ? 'لا توجد قواعد لهذا الرسم' : 'لا توجد قواعد بعد'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الرسم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">القسم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الفصل</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الشرط</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                  {isManager && <th className="px-4 py-3 w-20"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{rule.fee_definition?.name_ar || '—'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{rule.department?.name || 'الكل'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{rule.target_semester ? `الفصل ${rule.target_semester}` : 'الكل'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rule.override_amount ? (
                        <span className="text-sm tabular-nums text-gray-900">
                          {Number(rule.override_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-gray-400 text-xs">د.ل</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">الافتراضي</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rule.condition_type && rule.condition_type !== 'none' ? (
                        <span className="text-xs text-gray-600">
                          {CONDITION_LABELS[rule.condition_type] || rule.condition_type} {rule.condition_value}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {rule.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(rule)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="تعديل">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(rule)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="حذف" disabled={deleteMutation.isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <FeeRuleFormModal
          rule={editingRule}
          definitions={definitions}
          onClose={handleCloseForm}
          queryClient={queryClient}
        />
      )}
    </>
  );
}

// ─── Fee Rule Form Modal ─────────────────────────────────────────────────────

function FeeRuleFormModal({
  rule,
  definitions,
  onClose,
  queryClient,
}: {
  rule: FeeRule | null;
  definitions: FeeDefinition[];
  onClose: () => void;
  queryClient: any;
}) {
  const isEdit = !!rule;
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const [formData, setFormData] = useState({
    fee_definition_id: rule?.fee_definition_id || '',
    department_id: rule?.department_id || '',
    target_semester: rule?.target_semester?.toString() || '',
    override_amount: rule?.override_amount?.toString() || '',
    condition_type: rule?.condition_type || 'none',
    condition_value: rule?.condition_value || '',
    is_active: rule?.is_active ?? true,
    notes: rule?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.put(`/fee-rules/${rule!.id}`, data) : api.post('/fee-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-rules'] });
      queryClient.invalidateQueries({ queryKey: ['fee-definitions'] });
      onClose();
    },
    onError: (error: any) => {
      if (error.errors) setErrors(error.errors);
      else alert(error.message || 'فشل في حفظ القاعدة');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!formData.fee_definition_id) newErrors.fee_definition_id = 'يجب اختيار الرسم';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    saveMutation.mutate({
      fee_definition_id: formData.fee_definition_id,
      department_id: formData.department_id || null,
      target_semester: formData.target_semester ? parseInt(formData.target_semester) : null,
      override_amount: formData.override_amount ? parseFloat(formData.override_amount) : null,
      condition_type: formData.condition_type || null,
      condition_value: formData.condition_value || null,
      is_active: formData.is_active,
      notes: formData.notes || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'تعديل قاعدة التطبيق' : 'إضافة قاعدة تطبيق جديدة'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الرسم *</label>
            <select
              value={formData.fee_definition_id}
              onChange={(e) => setFormData({ ...formData, fee_definition_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.fee_definition_id ? 'border-red-300' : 'border-gray-200'} focus:ring-1 focus:ring-gray-300 focus:border-gray-300`}
            >
              <option value="">اختر الرسم...</option>
              {definitions.filter((d) => d.is_active).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_ar} ({Number(d.default_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} د.ل)
                </option>
              ))}
            </select>
            {errors.fee_definition_id && <p className="text-xs text-red-500 mt-1">{errors.fee_definition_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">القسم</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                <option value="">جميع الأقسام</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الفصل الدراسي</label>
              <select
                value={formData.target_semester}
                onChange={(e) => setFormData({ ...formData, target_semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                <option value="">جميع الفصول</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>الفصل {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              تجاوز المبلغ (د.ل) <span className="text-gray-400">— فارغ = الافتراضي</span>
            </label>
            <input
              type="number"
              value={formData.override_amount}
              onChange={(e) => setFormData({ ...formData, override_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              placeholder="المبلغ الافتراضي"
              min="0"
              step="0.001"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">نوع الشرط</label>
              <select
                value={formData.condition_type}
                onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            {formData.condition_type && formData.condition_type !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">قيمة الشرط</label>
                <input
                  type="text"
                  value={formData.condition_value}
                  onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                  placeholder={
                    formData.condition_type.includes('credits') ? 'مثال: 12' :
                    formData.condition_type === 'student_year_eq' ? 'مثال: 3' :
                    'مثال: أجنبي'
                  }
                  dir="ltr"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              rows={2}
              placeholder="ملاحظات اختيارية..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-3.5 w-3.5 text-gray-900 focus:ring-gray-300 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">نشط</span>
          </label>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
            >
              {saveMutation.isPending ? 'جاري الحفظ...' : isEdit ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
