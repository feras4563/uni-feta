# 🔐 Role-Based Access Control (RBAC) Setup Instructions

This document provides complete instructions for setting up the RBAC system in your UniERP application.

## 📋 Prerequisites

- Supabase project with admin access
- Access to Supabase SQL Editor
- Access to Supabase Authentication settings

## 🗄️ Step 1: Database Setup

### 1.1 Run the SQL Schema
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire content of `supabase-rbac-setup.sql`
4. Click **Run** to execute the SQL

### 1.2 Verify Tables Created
After running the SQL, verify these tables were created:
- `app_users`
- `permissions`
- `user_actions_log`

## 👤 Step 2: Create Initial Users

### 2.1 Create Manager User
1. Go to **Authentication > Users** in Supabase dashboard
2. Click **Add User**
3. Enter manager credentials:
   - **Email**: `manager@university.edu`
   - **Password**: `password123`
   - **Email Confirm**: Yes
4. Click **Add User**

### 2.2 Create Staff User
1. Click **Add User** again
2. Enter staff credentials:
   - **Email**: `staff@university.edu`
   - **Password**: `password123`
   - **Email Confirm**: Yes
3. Click **Add User**

### 2.3 Link Users to App Users Table
1. Go back to **SQL Editor**
2. Run these INSERT statements (update the UUIDs with actual auth user IDs):

```sql
-- Get the auth user IDs first
SELECT id, email FROM auth.users WHERE email IN ('manager@university.edu', 'staff@university.edu');

-- Insert manager user (replace UUID with actual auth user ID)
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
VALUES (
  'REPLACE_WITH_MANAGER_AUTH_USER_ID',
  'manager@university.edu',
  'System Manager',
  'manager',
  'active'
);

-- Insert staff user (replace UUID with actual auth user ID)
INSERT INTO app_users (auth_user_id, email, full_name, role, status)
VALUES (
  'REPLACE_WITH_STAFF_AUTH_USER_ID',
  'staff@university.edu',
  'Staff Member',
  'staff',
  'active'
);
```

## 🛡️ Step 3: Enable Row Level Security

The SQL script already enables RLS, but verify:

1. Go to **Database > Tables**
2. Check these tables have RLS enabled:
   - `students`
   - `fees`
   - `teachers`
   - `departments`
   - `app_users`

## 🚀 Step 4: Test the Implementation

### 4.1 Start the Development Server
```bash
bun dev
```

### 4.2 Test Manager Login
1. Navigate to your app
2. Login with:
   - **Email**: `manager@university.edu`
   - **Password**: `password123`
3. Verify you can see all navigation items
4. Test creating, editing, and deleting students/fees

### 4.3 Test Staff Login
1. Logout and login with:
   - **Email**: `staff@university.edu`
   - **Password**: `password123`
2. Verify you only see Students and Fees in navigation
3. Test that you can only view and create (no edit/delete buttons)

## 🔧 Step 5: Customization

### 5.1 Add More Users
Use the Supabase dashboard to add more users and assign roles.

### 5.2 Modify Permissions
Update the `permissions` table to customize role permissions:

```sql
-- Example: Allow staff to view teachers
INSERT INTO permissions (role, resource, actions)
VALUES ('staff', 'teachers', ARRAY['view']);
```

### 5.3 Add New Roles
1. Add new role to enum:
```sql
ALTER TYPE user_role ADD VALUE 'accountant';
```

2. Add permissions for new role:
```sql
INSERT INTO permissions (role, resource, actions)
VALUES ('accountant', 'finance', ARRAY['view', 'create', 'edit']);
```

## 🐛 Troubleshooting

### Issue: Can't login
- **Solution**: Verify users exist in both `auth.users` and `app_users` tables
- Check that `auth_user_id` in `app_users` matches `id` in `auth.users`

### Issue: No permissions working
- **Solution**: Check RLS policies are enabled
- Verify permissions exist in `permissions` table

### Issue: Navigation not updating
- **Solution**: Clear browser cache and reload
- Check browser console for JavaScript errors

### Issue: API errors
- **Solution**: Check Supabase logs in dashboard
- Verify RLS policies allow the intended operations

## 🔍 Monitoring

### View User Actions
```sql
SELECT 
  au.full_name,
  ual.action,
  ual.resource,
  ual.created_at
FROM user_actions_log ual
JOIN app_users au ON au.id = ual.user_id
ORDER BY ual.created_at DESC
LIMIT 50;
```

### Check User Permissions
```sql
SELECT * FROM get_user_permissions('manager');
SELECT * FROM get_user_permissions('staff');
```

## 📚 Role Summary

### Manager Role
- **Access**: Full system access
- **Students**: ✅ View, Create, Edit, Delete
- **Fees**: ✅ View, Create, Edit, Delete
- **Teachers**: ✅ View, Create, Edit, Delete
- **Departments**: ✅ View, Create, Edit, Delete
- **Finance**: ✅ View, Create, Edit, Delete

### Staff Role
- **Access**: Limited access
- **Students**: ✅ View, Create ❌ Edit, Delete
- **Fees**: ✅ View, Create ❌ Edit, Delete
- **Teachers**: ❌ No access
- **Departments**: ❌ No access
- **Finance**: ❌ No access

## 🎯 Next Steps

1. **Test thoroughly** with both user types
2. **Add more staff users** as needed
3. **Customize permissions** based on your requirements
4. **Monitor user actions** through the audit log
5. **Consider adding more roles** (Teacher, Accountant, etc.)

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify the SQL was executed correctly
4. Ensure RLS policies are properly configured

---

**🎉 Congratulations!** Your RBAC system is now ready. Users will see different interfaces based on their roles, and all actions are protected at both the UI and database levels.
