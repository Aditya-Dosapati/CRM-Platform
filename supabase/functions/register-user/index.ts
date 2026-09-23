// Supabase Edge Function: register-user
// Handles Student and Faculty self-registration using Supabase Admin Auth API
// Automatically confirms Auth email (email_confirm: true) to bypass SMTP rate limits,
// while enforcing Admin-controlled approval (public.users.status = 'pending').

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing service credentials.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Admin Client (Service Role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    const {
      name,
      email,
      password,
      role: rawRole,
      department,
      rollNumber,
      employeeId,
      program,
      year,
      section,
      designation
    } = body;

    // 1. Validation
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanRole = (rawRole || 'student').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Full name is required (minimum 2 characters).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return new Response(
        JSON.stringify({ error: 'A valid email address is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strict RBAC: Block admin self-registration
    if (cleanRole !== 'student' && cleanRole !== 'faculty') {
      return new Response(
        JSON.stringify({ error: '403 Forbidden: Administrator self-registration is strictly prohibited.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check for duplicate email in public.users
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'An account with this email address already exists. Please sign in instead.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check for unique roll number / employee ID
    const cleanIdentifier = cleanRole === 'student'
      ? (rollNumber || '').trim().toUpperCase()
      : (employeeId || '').trim().toUpperCase();

    if (cleanRole === 'student' && cleanIdentifier) {
      const { data: existingStudent } = await supabaseAdmin
        .from('students')
        .select('id, roll_number')
        .eq('roll_number', cleanIdentifier)
        .limit(1);

      if (existingStudent && existingStudent.length > 0) {
        return new Response(
          JSON.stringify({ error: `A student with Roll Number "${cleanIdentifier}" is already registered.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (cleanRole === 'faculty' && cleanIdentifier) {
      const { data: existingFaculty } = await supabaseAdmin
        .from('faculty')
        .select('id, employee_id')
        .eq('employee_id', cleanIdentifier)
        .limit(1);

      if (existingFaculty && existingFaculty.length > 0) {
        return new Response(
          JSON.stringify({ error: `A faculty member with Employee ID "${cleanIdentifier}" is already registered.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Resolve department_id
    let resolvedDeptId = null;
    if (department) {
      const cleanDept = String(department).trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanDept)) {
        resolvedDeptId = cleanDept;
      } else {
        const { data: deptRows } = await supabaseAdmin
          .from('departments')
          .select('id, code, name')
          .or(`code.eq.${cleanDept},name.ilike.%${cleanDept}%`)
          .limit(1);
        if (deptRows && deptRows.length > 0) {
          resolvedDeptId = deptRows[0].id;
        }
      }
    }

    // 5. Create Auth user via Supabase Admin Auth API
    // Setting email_confirm = true bypasses GoTrue SMTP email sending rate limits
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        name: cleanName,
        role: cleanRole,
        status: 'pending'
      }
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message || 'Failed to create user authentication record.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authUser.user.id;

    // 6. Insert profile into public.users with status = 'pending'
    try {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: newUserId,
          email: cleanEmail,
          full_name: cleanName,
          role: cleanRole,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (profileError) {
        // Rollback Auth user on profile creation failure
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({ error: `Database error creating user profile: ${profileError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 7. Insert role-specific record (students or faculty)
      if (cleanRole === 'student') {
        const numYear = year ? (isNaN(Number(year)) ? 1 : Number(year)) : 1;
        const { error: studentError } = await supabaseAdmin
          .from('students')
          .insert([{
            user_id: newUserId,
            roll_number: cleanIdentifier || null,
            department_id: resolvedDeptId,
            semester: numYear * 2 - 1,
            year: numYear,
            section: (section || 'A').trim().toUpperCase(),
            program: (program || 'B.Tech').trim()
          }]);

        if (studentError) {
          console.warn('[register-user] Student table insert error:', studentError.message);
        }
      } else if (cleanRole === 'faculty') {
        const { error: facultyError } = await supabaseAdmin
          .from('faculty')
          .insert([{
            user_id: newUserId,
            employee_id: cleanIdentifier || null,
            department_id: resolvedDeptId,
            designation: (designation || 'Assistant Professor').trim()
          }]);

        if (facultyError) {
          console.warn('[register-user] Faculty table insert error:', facultyError.message);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId: newUserId,
          email: cleanEmail,
          name: cleanName,
          role: cleanRole,
          status: 'pending',
          message: 'Registration submitted successfully. Your account is waiting for administrator approval.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (err: any) {
      // Rollback Auth user on exception
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: err.message || 'An unexpected error occurred during profile registration.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Invalid registration request.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
