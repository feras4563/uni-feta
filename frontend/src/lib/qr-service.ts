import QRCode from 'qrcode';

// QR Code generation service for class attendance
export class QRService {
  private static readonly SECRET_KEY = 'UNI_ERP_QR_SECRET_2024';
  
  /**
   * Generate QR code data URL for display
   */
  static async generateQRCodeDataURL(data: string, options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }): Promise<string> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    try {
      return await QRCode.toDataURL(data, defaultOptions);
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRCodeSVG(data: string, options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }): Promise<string> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    try {
      return await QRCode.toString(data, { 
        type: 'svg',
        ...defaultOptions 
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code SVG: ${error}`);
    }
  }

  /**
   * Create secure session QR payload
   */
  static createSessionQRPayload(sessionData: {
    sessionId: string;
    teacherId: string;
    subjectId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  }): {
    payload: string;
    signature: string;
    expiresAt: number;
  } {
    // Calculate expiry time (1 hour after class ends)
    const sessionEnd = new Date(`${sessionData.sessionDate}T${sessionData.endTime}`);
    const expiresAt = sessionEnd.getTime() + (60 * 60 * 1000); // +1 hour

    const qrPayload = {
      type: 'class_session',
      sessionId: sessionData.sessionId,
      teacherId: sessionData.teacherId,
      subjectId: sessionData.subjectId,
      timestamp: Date.now(),
      expiresAt,
      version: '1.0'
    };

    // Create signature
    const signature = this.createSignature(qrPayload);
    
    const payload = JSON.stringify({
      ...qrPayload,
      signature
    });

    return {
      payload,
      signature,
      expiresAt
    };
  }

  /**
   * Validate session QR payload
   */
  static validateSessionQRPayload(payload: string): {
    valid: boolean;
    data?: any;
    error?: string;
  } {
    try {
      const data = JSON.parse(payload);
      
      // Check required fields
      if (!data.type || data.type !== 'class_session') {
        return { valid: false, error: 'Invalid QR type' };
      }

      if (!data.sessionId || !data.teacherId || !data.signature) {
        return { valid: false, error: 'Missing required fields' };
      }

      // Check expiry
      if (Date.now() > data.expiresAt) {
        return { valid: false, error: 'QR code has expired' };
      }

      // Verify signature
      const expectedSignature = this.createSignature({
        type: data.type,
        sessionId: data.sessionId,
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        timestamp: data.timestamp,
        expiresAt: data.expiresAt,
        version: data.version
      });

      if (data.signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: 'Invalid QR format' };
    }
  }

  /**
   * Create cryptographic signature for QR data
   */
  private static createSignature(data: any): string {
    // Simple signature - in production, use proper HMAC-SHA256
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    const combined = dataString + this.SECRET_KEY;
    
    // Base64 encode and take first 32 characters
    return btoa(combined).replace(/[+/=]/g, '').substring(0, 32);
  }

  /**
   * Generate student QR code (for student identification)
   */
  static async generateStudentQR(studentData: {
    studentId: string;
    name: string;
    nameEn?: string;
    birthDate: string;
    departmentId: string;
    departmentName?: string;
    academicYear: number;
    registrationDate?: string;
  }): Promise<{
    payload: string;
    qrDataURL: string;
    formattedData: string;
  }> {
    // Format dates using Gregorian calendar
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      } catch {
        return dateStr;
      }
    };

    // Create well-formatted student information
    const formattedData = [
      `الاسم: ${studentData.name}`,
      studentData.nameEn ? `Name: ${studentData.nameEn}` : '',
      `رقم الطالب: ${studentData.studentId}`,
      `تاريخ الميلاد: ${formatDate(studentData.birthDate)}`,
      `التخصص: ${studentData.departmentName || 'غير محدد'}`,
      `السنة الدراسية: ${studentData.academicYear}`,
      `تاريخ الإصدار: ${formatDate(studentData.registrationDate || new Date().toISOString())}`
    ].filter(line => line.trim() !== '').join('\n');

    // Create structured payload for system use
    const payload = JSON.stringify({
      type: 'student',
      student_id: studentData.studentId,
      name: studentData.name,
      name_en: studentData.nameEn || '',
      birth_date: studentData.birthDate,
      department_id: studentData.departmentId,
      department_name: studentData.departmentName || '',
      academic_year: studentData.academicYear,
      generated_at: new Date().toISOString(),
      formatted_display: formattedData,
      version: '2.0'
    });

    const qrDataURL = await this.generateQRCodeDataURL(formattedData, {
      width: 300,
      margin: 3,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    });

    return {
      payload,
      qrDataURL,
      formattedData
    };
  }

  /**
   * Generate teacher QR code (for teacher identification)
   */
  static async generateTeacherQR(teacherData: {
    teacherId: string;
    name: string;
    nameEn?: string;
    departmentName?: string;
    qualification?: string;
    specialization?: string;
    campusId?: string;
  }): Promise<{
    payload: string;
    qrDataURL: string;
    formattedData: string;
  }> {
    const formattedData = [
      '\u0627\u0644\u0627\u0633\u0645: ' + teacherData.name,
      teacherData.nameEn ? 'Name: ' + teacherData.nameEn : '',
      '\u0631\u0642\u0645 \u0627\u0644\u0645\u062F\u0631\u0633: ' + (teacherData.campusId || teacherData.teacherId),
      '\u0627\u0644\u0642\u0633\u0645: ' + (teacherData.departmentName || '\u063A\u064A\u0631 \u0645\u062D\u062F\u062F'),
      teacherData.qualification ? '\u0627\u0644\u0631\u062A\u0628\u0629: ' + teacherData.qualification : '',
      teacherData.specialization ? '\u0627\u0644\u062A\u062E\u0635\u0635: ' + teacherData.specialization : '',
      '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0635\u062F\u0627\u0631: ' + new Date().toLocaleDateString('en-GB')
    ].filter(line => line.trim() !== '').join('\n');

    const payload = JSON.stringify({
      type: 'teacher',
      teacher_id: teacherData.teacherId,
      campus_id: teacherData.campusId || '',
      name: teacherData.name,
      name_en: teacherData.nameEn || '',
      department_name: teacherData.departmentName || '',
      qualification: teacherData.qualification || '',
      generated_at: new Date().toISOString(),
      formatted_display: formattedData,
      version: '2.0'
    });

    const qrDataURL = await this.generateQRCodeDataURL(formattedData, {
      width: 300,
      margin: 3,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    });

    return {
      payload,
      qrDataURL,
      formattedData
    };
  }

  /**
   * Validate student QR code
   */
  static validateStudentQR(payload: string): {
    valid: boolean;
    studentId?: string;
    error?: string;
  } {
    try {
      const data = JSON.parse(payload);
      
      if (!data.type || data.type !== 'student') {
        return { valid: false, error: 'Invalid student QR type' };
      }

      if (!data.studentId) {
        return { valid: false, error: 'Missing student ID' };
      }

      return { 
        valid: true, 
        studentId: data.studentId 
      };
    } catch (error) {
      return { valid: false, error: 'Invalid student QR format' };
    }
  }

  /**
   * Create QR code for attendance scanning (combines session + student)
   */
  static createAttendanceQRPayload(sessionQRPayload: string, studentQRPayload: string): {
    valid: boolean;
    combinedPayload?: string;
    error?: string;
  } {
    const sessionValidation = this.validateSessionQRPayload(sessionQRPayload);
    const studentValidation = this.validateStudentQR(studentQRPayload);

    if (!sessionValidation.valid) {
      return { valid: false, error: sessionValidation.error };
    }

    if (!studentValidation.valid) {
      return { valid: false, error: studentValidation.error };
    }

    const combinedPayload = JSON.stringify({
      type: 'attendance_scan',
      sessionId: sessionValidation.data.sessionId,
      studentId: studentValidation.studentId,
      timestamp: Date.now(),
      version: '1.0'
    });

    return {
      valid: true,
      combinedPayload
    };
  }

  /**
   * Get QR code display options based on context
   */
  static getDisplayOptions(context: 'session' | 'student' | 'attendance') {
    const baseOptions = {
      margin: 2,
      width: 300
    };

    switch (context) {
      case 'session':
        return {
          ...baseOptions,
          color: {
            dark: '#059669', // Green for session QR
            light: '#ffffff'
          }
        };
      
      case 'student':
        return {
          ...baseOptions,
          width: 200,
          color: {
            dark: '#1f2937', // Dark gray for student QR
            light: '#ffffff'
          }
        };
      
      case 'attendance':
        return {
          ...baseOptions,
          color: {
            dark: '#7c3aed', // Purple for attendance QR
            light: '#ffffff'
          }
        };
      
      default:
        return baseOptions;
    }
  }

  /**
   * Calculate QR expiry time based on session
   */
  static calculateQRExpiry(sessionDate: string, endTime: string, bufferHours: number = 1): Date {
    const sessionEnd = new Date(`${sessionDate}T${endTime}`);
    return new Date(sessionEnd.getTime() + (bufferHours * 60 * 60 * 1000));
  }

  /**
   * Check if QR code is still valid based on time
   */
  static isQRValid(expiresAt: number): {
    valid: boolean;
    timeRemaining?: number;
    error?: string;
  } {
    const now = Date.now();
    
    if (now > expiresAt) {
      return { valid: false, error: 'QR code has expired' };
    }

    const timeRemaining = expiresAt - now;
    return { 
      valid: true, 
      timeRemaining 
    };
  }

  /**
   * Format time remaining for display
   */
  static formatTimeRemaining(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
