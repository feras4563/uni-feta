import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDepartments } from "../../lib/api";
import { createStudent, updateStudent } from "../../lib/jwt-api";

type StudentModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: any | null;
  onSaved?: () => void;
};

export default function StudentModal({ open, onClose, initial, onSaved }: StudentModalProps) {
  const [form, setForm] = useState({
    // Personal Information
    name: "",
    name_en: "",
    national_id_passport: "",
    gender: "",
    birth_date: "",
    nationality: "",
    phone: "",
    email: "",
    address: "",
    sponsor_name: "",
    sponsor_contact: "",
    
    // Academic History
    academic_history: "",
    academic_history_type: "",
    academic_score: "",
    
    // Enrollment
    department_id: "",
    year: "",
    status: "active",
    enrollment_date: new Date().toISOString().split('T')[0] // Today's date
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(1);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);

  // Load departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    enabled: open
  });

  // Generate unique student ID
  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ST${year}${random}`;
  };

  // Note: QR code generation removed - will be handled by backend if needed

  // Reset form when modal opens/closes or initial changes
  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name || "",
          name_en: initial.name_en || "",
          national_id_passport: initial.national_id_passport || "",
          gender: initial.gender || "",
          birth_date: initial.birth_date || "",
          nationality: initial.nationality || "",
          phone: initial.phone || "",
          email: initial.email || "",
          address: initial.address || "",
          sponsor_name: initial.sponsor_name || "",
          sponsor_contact: initial.sponsor_contact || "",
          academic_history: initial.academic_history || "",
          academic_history_type: initial.academic_history_type || "",
          academic_score: initial.academic_score || "",
          department_id: String(initial.department_id || ""),
          year: String(initial.year || ""),
          status: initial.status || "active",
          enrollment_date: initial.enrollment_date || new Date().toISOString().split('T')[0]
        });
        setTranscriptFile(null); // Reset file upload
    } else {
        setForm({
          name: "",
          name_en: "",
          national_id_passport: "",
          gender: "",
          birth_date: "",
          nationality: "",
          phone: "",
          email: "",
          address: "",
          sponsor_name: "",
          sponsor_contact: "",
          academic_history: "",
          academic_history_type: "",
          academic_score: "",
          department_id: "",
          year: "",
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0]
        });
        setTranscriptFile(null); // Reset file upload
      }
      setErrors({});
      setCurrentSection(1);
    }
  }, [open, initial]);

  const validateSection = (section: number) => {
    const newErrors: Record<string, string> = {};
    
    if (section === 1) { // Personal Information
      if (!form.name.trim()) {
        newErrors.name = "????? ?????";
      }
      if (!form.national_id_passport.trim()) {
        newErrors.national_id_passport = "????? ??????/???? ????? ?????";
      }
      if (!form.gender) {
        newErrors.gender = "????? ?????";
      }
      if (!form.birth_date) {
        newErrors.birth_date = "????? ??????? ?????";
      }
      if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
        newErrors.email = "?????? ?????????? ??? ????";
      }
    } else if (section === 2) { // Academic History
      // Academic history is now optional - no required validation
      // Users can skip this section if they don't have prior academic history
    } else if (section === 3) { // Enrollment
      // Department is now optional
      if (!form.year) {
        newErrors.year = "????? ??????";
      }
      if (!form.enrollment_date) {
        newErrors.enrollment_date = "????? ??????";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentSection(currentSection - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSection(3)) return;
    
    setSubmitting(true);
    try {
      const formData: any = {
        name: form.name.trim(),
        name_en: form.name_en.trim() || null,
        national_id_passport: form.national_id_passport.trim(),
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        nationality: form.nationality.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        sponsor_name: form.sponsor_name.trim() || null,
        sponsor_contact: form.sponsor_contact.trim() || null,
        academic_history: form.academic_history ? String(form.academic_history).trim() || null : null,
        academic_score: form.academic_score ? String(form.academic_score).trim() || null : null,
        transcript_file: transcriptFile ? transcriptFile.name : null,
        department_id: form.department_id || null,
        year: form.year ? parseInt(form.year) : null,
        status: form.status,
        enrollment_date: form.enrollment_date || null
      };

      console.log('?? Attempting to save student data:', formData);

      if (initial?.id) {
        // Update existing student
        await updateStudent(initial.id, formData);
      } else {
        // Create new student
        await createStudent(formData);
      }

    onSaved?.();
    onClose();
    } catch (error: any) {
      console.error("Error saving student:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      setErrors({ submit: error.message || "??? ?? ??? ????????" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF or images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.type)) {
        setTranscriptFile(file);
        // Clear any existing error
        if (errors.transcript_file) {
          setErrors(prev => ({ ...prev, transcript_file: "" }));
        }
      } else {
        setErrors(prev => ({ ...prev, transcript_file: "???? ?????? ??? PDF ?? ???? (JPG, PNG, GIF)" }));
      }
    }
  };

    if (!open) return null;

  const renderPersonalSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Arabic Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
            ????? ?????? (????) <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="name"
              id="name"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.name ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="???? ????? ?????? ??????"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>
        </div>

        {/* English Name */}
        <div>
          <label htmlFor="name_en" className="block text-sm font-medium leading-6 text-gray-900">
            ????? ?????? (???????)
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="name_en"
              id="name_en"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.name_en}
              onChange={(e) => handleInputChange("name_en", e.target.value)}
              placeholder="Full Name in English"
            />
          </div>
        </div>

        {/* National ID */}
        <div>
          <label htmlFor="national_id" className="block text-sm font-medium leading-6 text-gray-900">
            ????? ??????/???? ????? <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="national_id"
              id="national_id"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.national_id_passport ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.national_id_passport}
              onChange={(e) => handleInputChange("national_id_passport", e.target.value)}
              placeholder="???? ????? ?????? ?? ??? ???? ?????"
            />
            {errors.national_id_passport && <p className="mt-2 text-sm text-red-600">{errors.national_id_passport}</p>}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium leading-6 text-gray-900">
            ????? <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <select
              id="gender"
              name="gender"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.gender ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.gender}
              onChange={(e) => handleInputChange("gender", e.target.value)}
            >
              <option value="">???? ?????</option>
              <option value="male">???</option>
              <option value="female">????</option>
            </select>
            {errors.gender && <p className="mt-2 text-sm text-red-600">{errors.gender}</p>}
          </div>
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium leading-6 text-gray-900">
            ????? ??????? <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="date"
              name="birth_date"
              id="birth_date"
              min="2000-01-01"
              max="2010-12-31"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.birth_date ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.birth_date}
              onChange={(e) => handleInputChange("birth_date", e.target.value)}
            />
            {errors.birth_date && <p className="mt-2 text-sm text-red-600">{errors.birth_date}</p>}
          </div>
        </div>

        {/* Nationality */}
        <div>
          <label htmlFor="nationality" className="block text-sm font-medium leading-6 text-gray-900">
            ???????
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="nationality"
              id="nationality"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.nationality}
              onChange={(e) => handleInputChange("nationality", e.target.value)}
              placeholder="????: ????"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
            ??? ??????
          </label>
          <div className="mt-2">
            <input
              type="tel"
              name="phone"
              id="phone"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+966 50 123 4567"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
            ?????? ??????????
          </label>
          <div className="mt-2">
            <input
              type="email"
              name="email"
              id="email"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.email ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="example@university.edu"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
            ???????
          </label>
          <div className="mt-2">
            <textarea
              name="address"
              id="address"
              rows={3}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="??????? ??????"
            />
          </div>
        </div>

        {/* Guardian/Sponsor Information */}
        <div className="sm:col-span-2">
          <h3 className="text-sm font-medium leading-6 text-gray-900 mb-3">??????? ??????? ???? ?????</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {/* Sponsor Name */}
            <div>
              <label htmlFor="sponsor_name" className="block text-sm font-medium leading-6 text-gray-900">
                ??? ??? ?????
          </label>
          <div className="mt-2">
            <input
              type="text"
                  name="sponsor_name"
                  id="sponsor_name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={form.sponsor_name}
                  onChange={(e) => handleInputChange("sponsor_name", e.target.value)}
                  placeholder="???? ??? ??? ?????"
                />
              </div>
            </div>

            {/* Sponsor Phone */}
            <div>
              <label htmlFor="sponsor_contact" className="block text-sm font-medium leading-6 text-gray-900">
                ??? ???? ??? ?????
              </label>
              <div className="mt-2">
                <input
                  type="tel"
              name="sponsor_contact"
              id="sponsor_contact"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.sponsor_contact}
              onChange={(e) => handleInputChange("sponsor_contact", e.target.value)}
                  placeholder="???? ??? ??????"
            />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicHistorySection = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          ??? ????? ??????? - ???? ???? ?????? ?????? ????? ???? ?????? ?????
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Academic History Type */}
        <div>
          <label htmlFor="academic_history_type" className="block text-sm font-medium leading-6 text-gray-900">
            ??? ?????? <span className="text-xs text-gray-500">(?????? ???)</span>
          </label>
          <div className="mt-2">
            <select
              id="academic_history_type"
              name="academic_history_type"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.academic_history_type ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.academic_history_type}
              onChange={(e) => handleInputChange("academic_history_type", e.target.value)}
            >
              <option value="">???? ??? ??????</option>
              <option value="high_school">???????? ??????</option>
              <option value="diploma">?????</option>
              <option value="bachelor">?????????</option>
              <option value="master">???????</option>
              <option value="other">????</option>
            </select>
            {errors.academic_history_type && <p className="mt-2 text-sm text-red-600">{errors.academic_history_type}</p>}
          </div>
        </div>

        {/* Academic Score */}
        <div>
          <label htmlFor="academic_score" className="block text-sm font-medium leading-6 text-gray-900">
            ?????? ??????????
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="academic_score"
              id="academic_score"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.academic_score ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.academic_score}
              onChange={(e) => handleInputChange("academic_score", e.target.value)}
              placeholder="????: 85.5% ?? 3.2 GPA ?? A"
            />
            {errors.academic_score && <p className="mt-2 text-sm text-red-600">{errors.academic_score}</p>}
            <p className="mt-1 text-sm text-gray-500">???? ?????? ??? ???? (???? ?????? GPA? ?? ???? ?????)</p>
          </div>
        </div>



        {/* Transcript File Upload */}
        <div>
          <label htmlFor="transcript_file" className="block text-sm font-medium leading-6 text-gray-900">
            ??? ????? ?????????
          </label>
          <div className="mt-2">
            <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0119.5 6v6a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 12V6zM3 16.06V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="transcript_file"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                  >
                    <span>??? ???</span>
            <input
              id="transcript_file"
                      name="transcript_file"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pr-1">?? ???? ?????</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PDF, JPG, PNG, GIF ??? 10MB</p>
                {transcriptFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ?? ??????: {transcriptFile.name}
                  </p>
                )}
              </div>
            </div>
            {errors.transcript_file && <p className="mt-2 text-sm text-red-600">{errors.transcript_file}</p>}
          </div>
        </div>

        {/* Academic History Details */}
        <div className="sm:col-span-2">
          <label htmlFor="academic_history" className="block text-sm font-medium leading-6 text-gray-900">
            ?????? ?????? ?????????
          </label>
          <div className="mt-2">
            <textarea
              name="academic_history"
              id="academic_history"
              rows={4}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.academic_history}
              onChange={(e) => handleInputChange("academic_history", e.target.value)}
              placeholder="?????? ?????? ??? ?????? ?????????? ???????/???????? ??????? ???..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnrollmentSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium leading-6 text-gray-900">
            ????? 
          </label>
          <div className="mt-2">
            <select
              id="department"
              name="department"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.department_id ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.department_id}
              onChange={(e) => handleInputChange("department_id", e.target.value)}
            >
              <option value="">???? ?????</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.department_id && <p className="mt-2 text-sm text-red-600">{errors.department_id}</p>}
          </div>
        </div>

        {/* Year */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium leading-6 text-gray-900">
            ????? ???????? <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <select
              id="year"
              name="year"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.year ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.year}
              onChange={(e) => handleInputChange("year", e.target.value)}
            >
              <option value="">???? ?????</option>
              <option value="1">????? ??????</option>
              <option value="2">????? ???????</option>
              <option value="3">????? ???????</option>
              <option value="4">????? ???????</option>
              <option value="5">????? ???????</option>
            </select>
            {errors.year && <p className="mt-2 text-sm text-red-600">{errors.year}</p>}
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
            ???? ??????
          </label>
          <div className="mt-2">
            <select
              id="status"
              name="status"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              value={form.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
            >
            <option value="active">???</option>
            <option value="inactive">??? ???</option>
              <option value="graduated">?????</option>
              <option value="suspended">????</option>
          </select>
          </div>
        </div>

        {/* Enrollment Date */}
        <div>
          <label htmlFor="enrollment_date" className="block text-sm font-medium leading-6 text-gray-900">
            ????? ??????? <span className="text-red-500">*</span>
          </label>
          <div className="mt-2">
            <input
              type="date"
              name="enrollment_date"
              id="enrollment_date"
              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                errors.enrollment_date ? 'ring-red-300 focus:ring-red-500' : ''
              }`}
              value={form.enrollment_date}
              onChange={(e) => handleInputChange("enrollment_date", e.target.value)}
            />
            {errors.enrollment_date && <p className="mt-2 text-sm text-red-600">{errors.enrollment_date}</p>}
          </div>
        </div>


      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex justify-center">
              <h3 className="text-xl font-semibold leading-6 text-gray-900">
                  {initial ? "????? ?????? ??????" : "????? ???? ????"}
                </h3>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4 space-x-reverse">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        currentSection >= step
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 text-gray-500'
                      }`}
                    >
                      {currentSection > step ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step
                      )}
                    </div>
                    <div className={`mr-2 text-sm font-medium ${currentSection >= step ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step === 1 && '????????? ???????'}
                      {step === 2 && '??????? ?????????'}
                      {step === 3 && '?????? ???????'}
                    </div>
                    {step < 3 && <div className="w-16 h-0.5 bg-gray-300 mx-4" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Content */}
            <div className="min-h-[400px]">
              {currentSection === 1 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <svg className="h-5 w-5 text-blue-600 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    ????????? ???????
                  </h4>
                  {renderPersonalSection()}
                </div>
              )}

              {currentSection === 2 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <svg className="h-5 w-5 text-blue-600 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                    ??????? ?????????
                  </h4>
                  {renderAcademicHistorySection()}
                </div>
              )}

              {currentSection === 3 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <svg className="h-5 w-5 text-blue-600 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
                    </svg>
                    ?????? ???????
                  </h4>
                  {renderEnrollmentSection()}
                  

                </div>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mr-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ??? ?? ??? ????????
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errors.submit}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  onClick={onClose}
                  disabled={submitting}
                >
                  ?????
                </button>
                {currentSection > 1 && (
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 disabled:opacity-50"
                    onClick={handlePrevious}
                    disabled={submitting}
                  >
                    ??????
                  </button>
                )}
              </div>

              <div>
                {currentSection < 3 ? (
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    onClick={handleNext}
                  >
                    ??????
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ???? ?????...
                      </>
                    ) : (
                      initial ? "????? ????????" : "????? ??????"
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
