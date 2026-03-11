import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/JWTAuthContext';
import {
  fetchMySessions,
  fetchSessionDetail,
  markSessionAttendance,
  generateSessionQR,
} from '../../lib/jwt-api';
import QRDisplay from '../../components/teacher/QRDisplay';
import { formatLongDate } from '../../lib/utils';

type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

interface StudentRow {
  student_id: string;
  name: string;
  name_en?: string;
  campus_id: string;
  photo_url?: string;
  attendance: {
    id: string;
    status: AttendanceStatus;
    notes?: string;
    is_override?: boolean;
    marked_by?: { id: number; name: string };
  } | null;
}

export default function ClassSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance panel
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // QR modal
  const [showQR, setShowQR] = useState(false);
  const [qrSession, setQrSession] = useState<any>(null);
  const [qrData, setQrData] = useState('');
  const [qrExpires, setQrExpires] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMySessions({ date: selectedDate });
      setSessions(data.filter((s: any) => s.status !== 'cancelled'));
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الحصص');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (user) loadSessions();
  }, [user, loadSessions]);

  // Open attendance panel for a session
  const openAttendance = async (sessionId: string) => {
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      return;
    }
    try {
      setDetailLoading(true);
      setActiveSessionId(sessionId);
      const data = await fetchSessionDetail(sessionId);
      setSessionDetail(data);
      setStudents(data.students || []);
      // Initialize attendance map from existing records
      const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
      (data.students || []).forEach((s: StudentRow) => {
        map[s.student_id] = {
          status: s.attendance?.status || 'absent',
          notes: s.attendance?.notes || '',
        };
      });
      setAttendanceMap(map);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات الحصة');
    } finally {
      setDetailLoading(false);
    }
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const setStudentNotes = (studentId: string, notes: string) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes } }));
  };

  const markAllAs = (status: AttendanceStatus) => {
    setAttendanceMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => { next[id] = { ...next[id], status }; });
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!activeSessionId) return;
    try {
      setSaving(true);
      const records = Object.entries(attendanceMap).map(([student_id, val]) => ({
        student_id,
        status: val.status,
        notes: val.notes || undefined,
      }));
      await markSessionAttendance(activeSessionId, records);
      // Reload sessions to update counts
      await loadSessions();
      // Reload detail
      const data = await fetchSessionDetail(activeSessionId);
      setSessionDetail(data);
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الحضور');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = async (session: any) => {
    try {
      const result = await generateSessionQR(session.id);
      setQrSession(session);
      setQrData(result.qrData);
      setQrExpires(result.expiresAt);
      setShowQR(true);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء QR');
    }
  };

  // Date navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setActiveSessionId(null);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { text: 'مكتملة', cls: 'bg-green-100 text-green-700' };
      case 'cancelled': return { text: 'ملغية', cls: 'bg-gray-100 text-gray-500' };
      default: return { text: 'مجدولة', cls: 'bg-blue-100 text-blue-700' };
    }
  };

  const statusButtons: { status: AttendanceStatus; label: string; icon: string; color: string; activeColor: string }[] = [
    { status: 'present', label: 'حاضر', icon: 'fa-check', color: 'text-gray-400 hover:text-green-600', activeColor: 'text-green-600 bg-green-50' },
    { status: 'late', label: 'متأخر', icon: 'fa-clock', color: 'text-gray-400 hover:text-yellow-600', activeColor: 'text-yellow-600 bg-yellow-50' },
    { status: 'absent', label: 'غائب', icon: 'fa-times', color: 'text-gray-400 hover:text-red-600', activeColor: 'text-red-600 bg-red-50' },
    { status: 'excused', label: 'معذور', icon: 'fa-shield-alt', color: 'text-gray-400 hover:text-blue-600', activeColor: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          <i className="fas fa-clipboard-check ml-2 text-gray-500"></i>
          الحصص والحضور
        </h1>
        <p className="text-sm text-gray-500 mt-1">تسجيل حضور الطلاب للحصص المجدولة</p>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600">
          <i className="fas fa-chevron-right"></i>
        </button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setActiveSessionId(null); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          {!isToday && (
            <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setActiveSessionId(null); }}
              className="text-xs text-blue-600 hover:underline">اليوم</button>
          )}
        </div>
        <button onClick={() => shiftDate(1)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600">
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="text-sm text-gray-500">
          {formatLongDate(selectedDate)}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i> {error}
          <button onClick={() => setError(null)} className="mr-auto text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">جاري تحميل الحصص...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <i className="fas fa-calendar-day text-gray-300 text-4xl mb-3"></i>
          <h3 className="text-base font-medium text-gray-900 mb-1">لا توجد حصص في هذا اليوم</h3>
          <p className="text-sm text-gray-500">تأكد من أن الجدول الدراسي تم إنشاؤه وتوليد الحصص</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => {
            const badge = getStatusBadge(session.status);
            const isActive = activeSessionId === session.id;
            const enrolled = session.enrolled_count || 0;
            const marked = session.attendance_records_count || 0;

            return (
              <div key={session.id} className={`bg-white rounded-lg shadow-sm border transition-all ${isActive ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}>
                {/* Session Row */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => openAttendance(session.id)}>
                  {/* Time */}
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-bold text-gray-900">{session.start_time?.slice(0, 5)}</div>
                    <div className="text-[10px] text-gray-400">{session.end_time?.slice(0, 5)}</div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{session.subject?.name || session.session_name}</span>
                      {session.subject?.code && <span className="text-xs text-gray-400 font-mono">{session.subject.code}</span>}
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {session.room && <><i className="fas fa-map-marker-alt ml-1"></i>{session.room}<span className="mx-2">·</span></>}
                      {session.department?.name && <span>{session.department.name}</span>}
                    </div>
                  </div>
                  {/* Attendance Summary */}
                  <div className="flex items-center gap-3 text-xs">
                    {marked > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-600 font-medium">{session.present_count || 0}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-600">{enrolled}</span>
                      </div>
                    )}
                    {marked === 0 && enrolled > 0 && (
                      <span className="text-gray-400">{enrolled} طالب</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGenerateQR(session); }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      title="QR"
                    >
                      <i className="fas fa-qrcode text-sm"></i>
                    </button>
                    <i className={`fas fa-chevron-${isActive ? 'down' : 'left'} text-gray-400 text-xs mr-1`}></i>
                  </div>
                </div>

                {/* Attendance Panel */}
                {isActive && (
                  <div className="border-t border-gray-200">
                    {detailLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-400">جاري تحميل الطلاب...</p>
                      </div>
                    ) : (
                      <>
                        {/* Stats bar */}
                        {sessionDetail?.stats && (
                          <div className="flex items-center gap-4 px-5 py-2 bg-gray-50 text-xs border-b border-gray-100">
                            <span className="text-gray-500">مسجلين: <strong>{sessionDetail.stats.enrolled}</strong></span>
                            <span className="text-green-600">حاضر: <strong>{sessionDetail.stats.present}</strong></span>
                            <span className="text-yellow-600">متأخر: <strong>{sessionDetail.stats.late}</strong></span>
                            <span className="text-red-600">غائب: <strong>{sessionDetail.stats.absent}</strong></span>
                            <span className="text-blue-600">معذور: <strong>{sessionDetail.stats.excused}</strong></span>
                            {sessionDetail.stats.unmarked > 0 && (
                              <span className="text-gray-400">غير مسجل: <strong>{sessionDetail.stats.unmarked}</strong></span>
                            )}
                          </div>
                        )}

                        {/* Quick actions */}
                        <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100">
                          <span className="text-xs text-gray-500 ml-2">تعيين الكل:</span>
                          {statusButtons.map(btn => (
                            <button key={btn.status} onClick={() => markAllAs(btn.status)}
                              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                              <i className={`fas ${btn.icon} ml-1`}></i>{btn.label}
                            </button>
                          ))}
                        </div>

                        {/* Student list */}
                        <div className="max-h-[500px] overflow-y-auto">
                          {students.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">
                              <i className="fas fa-users text-2xl mb-2"></i>
                              <p>لا يوجد طلاب مسجلين في هذه المادة</p>
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50/50 sticky top-0">
                                <tr>
                                  <th className="text-right px-5 py-2 font-medium text-gray-500 text-xs">#</th>
                                  <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">الطالب</th>
                                  <th className="text-center px-3 py-2 font-medium text-gray-500 text-xs">الرقم الجامعي</th>
                                  <th className="text-center px-3 py-2 font-medium text-gray-500 text-xs">الحالة</th>
                                  <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {students.map((student, idx) => {
                                  const current = attendanceMap[student.student_id];
                                  return (
                                    <tr key={student.student_id} className="hover:bg-gray-50">
                                      <td className="px-5 py-2 text-gray-400 text-xs">{idx + 1}</td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          {student.photo_url ? (
                                            <img src={student.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                          ) : (
                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                                              <i className="fas fa-user text-gray-400 text-[10px]"></i>
                                            </div>
                                          )}
                                          <span className="text-gray-900">{student.name}</span>
                                          {student.attendance?.is_override && (
                                            <span className="text-[9px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">override</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-center text-gray-500 font-mono text-xs">{student.campus_id}</td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-center gap-1">
                                          {statusButtons.map(btn => (
                                            <button
                                              key={btn.status}
                                              onClick={() => setStudentStatus(student.student_id, btn.status)}
                                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                current?.status === btn.status ? btn.activeColor + ' ring-1 ring-current' : btn.color + ' hover:bg-gray-100'
                                              }`}
                                              title={btn.label}
                                            >
                                              <i className={`fas ${btn.icon} text-xs`}></i>
                                            </button>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="text"
                                          value={current?.notes || ''}
                                          onChange={e => setStudentNotes(student.student_id, e.target.value)}
                                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                                          placeholder="ملاحظة..."
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Save button */}
                        {students.length > 0 && (
                          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {Object.values(attendanceMap).filter(v => v.status === 'present').length} حاضر
                              {' · '}
                              {Object.values(attendanceMap).filter(v => v.status === 'absent').length} غائب
                            </span>
                            <button
                              onClick={handleSaveAttendance}
                              disabled={saving}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {saving ? (
                                <><i className="fas fa-spinner fa-spin ml-2"></i>جاري الحفظ...</>
                              ) : (
                                <><i className="fas fa-save ml-2"></i>حفظ الحضور</>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      {showQR && qrSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-medium">رمز QR للحضور</h3>
              <button onClick={() => setShowQR(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-4">
              <QRDisplay
                sessionId={String(qrSession.id)}
                sessionName={qrSession.session_name || qrSession.subject?.name || ''}
                expiresAt={qrExpires}
                qrData={qrData}
                onExpired={() => {}}
                onRefresh={() => handleGenerateQR(qrSession)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
