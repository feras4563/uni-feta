import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
type BulkFeeModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function BulkFeeModal({ open, onClose, onCreated }: BulkFeeModalProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ fee_type_id: "", payment_plan_id: "", academic_year: "2024/2025", amount: "" });
  const [types, setTypes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: s }, { data: t }, { data: p }] = await Promise.all([
        supabase.from("students").select("id,name").order("name"),
        supabase.from("fee_types").select("id,name").eq("is_active", true),
        supabase.from("payment_plans").select("id,name").eq("is_active", true)
      ]);
      setStudents(s ?? []);
      setTypes(t ?? []);
      setPlans(p ?? []);
    })();
  }, [open]);

  async function submit() {
    if (!form.fee_type_id || !form.payment_plan_id || !form.academic_year || !form.amount || selectedIds.length === 0) return;
    const rows = selectedIds.map((sid) => ({
      student_id: sid,
      type: form.fee_type_id,
      payment_plan_id: form.payment_plan_id,
      academic_year: form.academic_year,
      amount: Number(form.amount),
      status: "unpaid"
    }));
    const { error } = await supabase.from("fees").insert(rows);
    if (error) { console.error(error); return; }
    onCreated?.();
    onClose();
  }

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  return (
    <Modal open={open} onClose={onClose} title="????? ???? ?????">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">??? ??????</label>
            <select className="border p-2 rounded w-full" value={form.fee_type_id} onChange={(e) => setForm((f) => ({ ...f, fee_type_id: e.target.value }))}>
              <option value="">????</option>
              {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">??? ?????</label>
            <select className="border p-2 rounded w-full" value={form.payment_plan_id} onChange={(e) => setForm((f) => ({ ...f, payment_plan_id: e.target.value }))}>
              <option value="">????</option>
              {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">????? ????????</label>
            <input className="border p-2 rounded w-full" value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">??????</label>
          <input className="border p-2 rounded w-full" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        </div>

        <div className="max-h-64 overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">????</th>
                <th className="p-2">?????</th>
                <th className="p-2">?????</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggle(s.id)} /></td>
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose}>?????</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={submit}>???</button>
        </div>
      </div>
    </Modal>
  );
}
