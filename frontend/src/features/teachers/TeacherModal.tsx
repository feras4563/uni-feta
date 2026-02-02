import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDepartments } from "../../lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  teacher?: any | null;
};

export default function TeacherModal({ open, onClose, onSaved, teacher }: Props) {
  const [form, setForm] = useState({
    name: "",
    department_id: "",
    status: "active",
    phone: "",
    email: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    enabled: open
  });

  // Reset form when modal opens/closes or teacher changes
  useEffect(() => {
    if (open) {
      if (teacher) {
        setForm({
          name: teacher.name || "",
          department_id: String(teacher.department_id || ""),
          status: teacher.status || "active",
          phone: teacher.phone || "",
          email: teacher.email || ""
        });
      } else {
        setForm({
          name: "",
          department_id: "",
          status: "active",
          phone: "",
          email: ""
        });
      }
      setErrors({});
    }
  }, [open, teacher]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "????? ?????";
    }

    if (!form.department_id) {
      newErrors.department_id = "????? ?????";
    }

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "?????? ?????????? ??? ????";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('?? Teacher form submitted with data:', form);
    
    if (!validateForm()) {
      console.log('? Form validation failed');
      return;
    }

    console.log('? Form validation passed, proceeding with teacher creation');
    setSubmitting(true);
    try {
      const formData = {
        name: form.name,
        department_id: parseInt(form.department_id),
        status: form.status,
        phone: form.phone || null,
        email: form.email || null
      };

      if (teacher?.id) {
        // Update existing teacher
        const { error } = await supabase
          .from("teachers")
          .update(formData)
          .eq("id", teacher.id);

        if (error) throw error;
      } else {
        // Create new teacher
        console.log('?? Creating teacher record with data:', formData);
        const { data: newTeacher, error: teacherError } = await supabase
          .from("teachers")
          .insert(formData)
          .select()
          .single();

        if (teacherError) {
          console.error('? Teacher creation failed:', teacherError);
          throw teacherError;
        }
        
        console.log('? Teacher record created:', newTeacher);

        // Auto-create user account if email is provided
        console.log('?? Checking email field:', form.email ? `"${form.email}"` : 'EMPTY');
        if (form.email) {
          console.log('?? Starting auth user creation for:', form.email);
          let authCreationSuccess = false;
          const defaultPassword = 'teacher123';
          
          try {
            // Method 1: Try admin createUser (requires service role key)
            console.log('?? Attempting admin createUser...');
            const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
              email: form.email,
              password: defaultPassword,
              email_confirm: true, // Skip email confirmation
              user_metadata: {
                full_name: form.name,
                role: 'teacher',
                teacher_id: newTeacher.id
              }
            });

            if (!adminAuthError && adminAuthData.user) {
              console.log('? Admin createUser successful');
              
              // Update teacher with auth_user_id
              await supabase
                .from("teachers")
                .update({ auth_user_id: adminAuthData.user.id })
                .eq("id", newTeacher.id);

              authCreationSuccess = true;
            } else {
              console.warn('?? Admin createUser failed:', adminAuthError?.message);
              
              // Method 2: Try regular signUp as fallback
              console.log('?? Falling back to regular signUp...');
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: defaultPassword,
                options: {
                  data: {
                    full_name: form.name,
                    role: 'teacher',
                    teacher_id: newTeacher.id
                  }
                }
              });

              if (!signUpError && signUpData.user) {
                console.log('? Regular signUp successful');
                
                // Update teacher with auth_user_id
                await supabase
                  .from("teachers")
                  .update({ auth_user_id: signUpData.user.id })
                  .eq("id", newTeacher.id);

                authCreationSuccess = true;
                
                // Note about email confirmation if needed
                if (!signUpData.session) {
                  console.log('?? Email confirmation may be required');
                }
              } else {
                console.error('? Both auth methods failed:', signUpError?.message);
              }
            }

            // Show result message
            if (authCreationSuccess) {
              const successMessage = `? ?? ????? ?????? ??????? ?????!

?? ?????? ????? ??????:
?? ?????? ??????????: ${form.email}
?? ???? ??????: ${defaultPassword}

?? ??????? ????:
• ????? ?????? ???? ?????? ??? ??? ????? ????
• ??? ?? ????? ?????? ?? ????? ??????? ?? ????? ?????? ?????? ??????????
• ???? ?????? ???? ?????? ??? ???? ?????? ????????

?? ?????? ???? ?????????!`;
              
              alert(successMessage);
              console.log('?? Teacher and auth user created successfully');
            } else {
              const failureMessage = `?? ?? ????? ?????? ?? ????? ???????? ?????

? ??? ??? ?? ????? ???? ????? ??????

??? ?????? ????????:
• ???? ?? ??????? Supabase Auth
• ?? ????? ??????? ?????? ?????? ??????????
• ???? ????? ?????? ?????? ?? ???? ???? Supabase

?? ?????? ???????: ${form.email}
?? ???? ?????? ????????: ${defaultPassword}`;
              
              alert(failureMessage);
              console.warn('?? Teacher created but auth user creation failed');
            }
            
          } catch (error: any) {
            console.error('?? Unexpected error in auth creation:', error);
            alert(`? ??? ??? ????? ?? ????? ??????:

${error.message}

? ?? ????? ?????? ?? ????? ????????
? ??? ?? ????? ???? ????? ??????

???? ???????? ??? ???? ?? ????? ?????? ??????.`);
          }
        } else {
          // No email provided
          alert(`? ?? ????? ?????? ?????!

?? ?? ??? ????? ???? ????????? ???? ?? ??? ????? ???? ????? ????.

?? ?????? ???? ??????:
• ?? ?????? ?????? ?????? ???? ?????? ??????????
• ?? ???? ?????? ?????? ?? ??????? ??????`);
        }
      }

      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving teacher:", error);
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  {teacher ? "????? ?????? ??????" : "????? ???? ????"}
                </h3>
                <p className="text-sm text-gray-500">
                  {teacher ? "????? ??????? ?????? ?? ??????" : "????? ?????? ???? ????"}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-4 w-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                ????????? ???????
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Name Field */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    ????? ?????? <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 ${
                        errors.name ? 'ring-red-300 focus:ring-red-500' : ''
                      }`}
                      value={form.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="???? ????? ?????? ??????"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-4 w-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                ????????? ??????????
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium leading-6 text-gray-900">
                    ????? <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      id="department"
                      name="department"
                      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 ${
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
                    {errors.department_id && (
                      <p className="mt-2 text-sm text-red-600">{errors.department_id}</p>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                    ??????
                  </label>
                  <div className="mt-2">
                    <select
                      id="status"
                      name="status"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                      value={form.status}
                      onChange={(e) => handleInputChange("status", e.target.value)}
                    >
                      <option value="active">???</option>
                      <option value="inactive">??? ???</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-4 w-4 text-gray-400 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                ??????? ???????
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
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
                      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 ${
                        errors.email ? 'ring-red-300 focus:ring-red-500' : ''
                      }`}
                      value={form.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="example@university.edu"
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                onClick={onClose}
                disabled={submitting}
              >
                ?????
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
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
                  teacher ? "????? ????????" : "????? ??????"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
