import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchTeacherSessions, 
  fetchTeacherSubjects,
  createClassSession, 
  updateClassSession,
  deleteClassSession,
  generateSessionQR,
  fetchSessionAttendance,
  type ClassSession,
  type TeacherSubject,
  type AttendanceRecord
} from '../../lib/teacher-api';
import { QRService } from '../../lib/qr-service';
import QRDisplay, { QRScanner } from '../../components/teacher/QRDisplay';

export default function ClassSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [sessionAttendance, setSessionAttendance] = useState<AttendanceRecord[]>([]);
  
  // QR states
  const [qrData, setQrData] = useState<string>('');
  const [qrExpiresAt, setQrExpiresAt] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    subject_id: '',
    session_name: '',
    session_date: '',
    start_time: '',
    end_time: '',
    room: '',
    notes: ''
  });

  // Load data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user?.teacherId) {
        console.warn('No teacher ID found, using empty data');
        setSessions([]);
        setSubjects([]);
        setError('Teacher data not available. Please contact administrator to link your account.');
        return;
      }
      const [sessionsData, subjectsData] = await Promise.all([
        fetchTeacherSessions(user.teacherId),
        fetchTeacherSubjects(user.teacherId)
      ]);
      setSessions(sessionsData);
      setSubjects(subjectsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setSessions([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.teacherId) return;

    try {
      const selectedSubject = subjects.find(s => s.subject_id === formData.subject_id);
      if (!selectedSubject) return;

      const sessionData = {
        teacher_id: user.teacherId,
        subject_id: formData.subject_id,
        department_id: selectedSubject.department_id,
        session_name: formData.session_name,
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room: formData.room,
        notes: formData.notes,
        status: 'scheduled' as const,
        max_students: 50
      };

      await createClassSession(sessionData);
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
  };

  // Generate QR for session
  const handleGenerateQR = async (session: ClassSession) => {
    try {
      const qrResult = await generateSessionQR(session.id);
      setSelectedSession(session);
      setQrData(qrResult.qrData);
      setQrExpiresAt(qrResult.expiresAt);
      setShowQRModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  };

  // View session attendance
  const handleViewAttendance = async (session: ClassSession) => {
    try {
      const attendance = await fetchSessionAttendance(session.id);
      setSelectedSession(session);
      setSessionAttendance(attendance);
      setShowAttendanceModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return;
    
    try {
      await deleteClassSession(sessionId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: '',
      session_name: '',
      session_date: '',
      start_time: '',
      end_time: '',
      room: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'completed': return 'bg-gray-200 text-gray-900 border border-gray-400';
      case 'cancelled': return 'bg-gray-100 text-gray-600 border border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدولة';
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4 mx-auto"></div>
          <p className="text-gray-600">جاري تحميل الجلسات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الحصص والحضور</h1>
          <p className="text-gray-600 mt-2">إدارة الحصص الدراسية ونظام الحضور بـ QR</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          حصة جديدة
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">الحصص الدراسية</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحصة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المادة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ والوقت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  القاعة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{session.session_name}</div>
                    <div className="text-sm text-gray-500">{session.notes}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.subject?.name}</div>
                    <div className="text-sm text-gray-500">{session.subject?.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(session.session_date).toLocaleDateString('ar-LY')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.start_time} - {session.end_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.room || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                      {getStatusText(session.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleGenerateQR(session)}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                        title="إنشاء QR"
                      >
                        <i className="fas fa-qrcode"></i>
                      </button>
                      <button
                        onClick={() => handleViewAttendance(session)}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                        title="عرض الحضور"
                      >
                        <i className="fas fa-users"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                        title="حذف"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-calendar-alt text-gray-300 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حصص</h3>
              <p className="text-gray-500 mb-4">ابدأ بإنشاء حصة جديدة</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                إنشاء حصة جديدة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">إنشاء حصة جديدة</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">اختر المادة</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject?.name} ({subject.subject?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحصة</label>
                <input
                  type="text"
                  value={formData.session_name}
                  onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مثال: محاضرة الأسبوع الثالث"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وقت البداية</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">وقت النهاية</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القاعة</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="مثال: A-101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  إنشاء الحصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">رمز QR للحضور</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <QRDisplay
                sessionId={selectedSession.id}
                sessionName={selectedSession.session_name}
                expiresAt={qrExpiresAt}
                qrData={qrData}
                onExpired={() => console.log('QR expired')}
                onRefresh={() => handleGenerateQR(selectedSession)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">حضور الحصة</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{selectedSession.session_name}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(selectedSession.session_date).toLocaleDateString('ar-LY')} | 
                  {selectedSession.start_time} - {selectedSession.end_time}
                </p>
              </div>

              {sessionAttendance.length > 0 ? (
                <div className="space-y-2">
                  {sessionAttendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{record.student?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.scan_time).toLocaleTimeString('ar-LY')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status === 'present' ? 'حاضر' : 
                         record.status === 'late' ? 'متأخر' : 'غائب'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-users text-gray-300 text-4xl mb-4"></i>
                  <p className="text-gray-500">لم يتم تسجيل أي حضور بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
