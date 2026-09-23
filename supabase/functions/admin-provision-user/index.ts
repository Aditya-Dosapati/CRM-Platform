// Supabase Edge Function: admin-provision-user
// Handles Single User Provisioning and CSV Bulk Roster Import for Administrators
// Uses Supabase Admin Auth API with email_confirm = true and immediate activation (status = 'active').

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Verify Caller is an Authenticated Administrator
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: '401 Unauthorized: Missing authorization token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !callerData?.user) {
      return new Response(
        JSON.stringify({ error: '401 Unauthorized: Invalid authentication token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerUid = callerData.user.id;
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('id, role, status')
      .eq('id', callerUid)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: '403 Forbidden: Administrator privileges required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const action = body.action || 'single'; // 'single' | 'bulk'

    // =========================================================================
    // ACTION 1: SINGLE USER PROVISIONING
    // =========================================================================
    if (action === 'single') {
      const {
        email,
        password,
        name,
        role: rawRole,
        departmentId,
        rollNumber,
        employeeId,
        program,
        year,
        section,
        designation,
        status = 'active'
      } = body;

      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (name || '').trim();
      const cleanRole = (rawRole || 'student').trim().toLowerCase();
      const cleanPassword = (password || 'GMRIT@' + Math.floor(1000 + Math.random() * 9000)).trim();
      const cleanStatus = (status || 'active').trim().toLowerCase();

      if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
        return new Response(
          JSON.stringify({ error: 'Valid Name and Email are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      let targetUserId = existingUser?.id;

      if (!targetUserId) {
        // Create new Auth User
        const { data: newAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            name: cleanName,
            role: cleanRole,
            status: cleanStatus
          }
        });

        if (authErr) {
          return new Response(
            JSON.stringify({ error: `Auth creation failed: ${authErr.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetUserId = newAuth.user.id;

        // Insert into public.users
        await supabaseAdmin.from('users').insert([{
          id: targetUserId,
          email: cleanEmail,
          full_name: cleanName,
          role: cleanRole,
          status: cleanStatus,
          created_at: new Date().toISOString()
        }]);
      } else {
        // Update existing user profile
        await supabaseAdmin.from('users').update({
          full_name: cleanName,
          role: cleanRole,
          status: cleanStatus
        }).eq('id', targetUserId);
      }

      // Insert or Update students / faculty
      if (cleanRole === 'student') {
        const numYear = year ? (isNaN(Number(year)) ? 1 : Number(year)) : 1;
        const { data: existingStudent } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (existingStudent) {
          await supabaseAdmin.from('students').update({
            roll_number: rollNumber ? rollNumber.trim().toUpperCase() : undefined,
            department_id: departmentId || undefined,
            year: numYear,
            semester: numYear * 2 - 1,
            section: section || 'A',
            program: program || 'B.Tech'
          }).eq('user_id', targetUserId);
        } else {
          await supabaseAdmin.from('students').insert([{
            user_id: targetUserId,
            roll_number: rollNumber ? rollNumber.trim().toUpperCase() : null,
            department_id: departmentId || null,
            year: numYear,
            semester: numYear * 2 - 1,
            section: section || 'A',
            program: program || 'B.Tech'
          }]);
        }
      } else if (cleanRole === 'faculty') {
        const { data: existingFaculty } = await supabaseAdmin
          .from('faculty')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (existingFaculty) {
          await supabaseAdmin.from('faculty').update({
            employee_id: employeeId ? employeeId.trim().toUpperCase() : undefined,
            department_id: departmentId || undefined,
            designation: designation || 'Assistant Professor'
          }).eq('user_id', targetUserId);
        } else {
          await supabaseAdmin.from('faculty').insert([{
            user_id: targetUserId,
            employee_id: employeeId ? employeeId.trim().toUpperCase() : null,
            department_id: departmentId || null,
            designation: designation || 'Assistant Professor'
          }]);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          userId: targetUserId,
          email: cleanEmail,
          name: cleanName,
          role: cleanRole,
          status: cleanStatus,
          tempPass: cleanPassword,
          message: `Account for ${cleanName} successfully provisioned and activated.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // ACTION 2: BULK CSV ROSTER PROVISIONING
    // =========================================================================
    if (action === 'bulk') {
      const { rows, role: bulkRole = 'student', fallbackDeptId } = body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No data rows provided for bulk import.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = [];
      let succeeded = 0;
      let failed = 0;

      for (const row of rows) {
        const cleanEmail = (row.email || '').trim().toLowerCase();
        const cleanName = (row.name || '').trim();
        const deptId = row.departmentId || fallbackDeptId || null;
        const tempPass = 'GMRIT@' + Math.floor(1000 + Math.random() * 9000);

        try {
          // Check if already in auth/users
          const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

          let uid = existing?.id;

          if (!uid) {
            const { data: newAuth, error: aErr } = await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: tempPass,
              email_confirm: true,
              user_metadata: {
                full_name: cleanName,
                name: cleanName,
                role: bulkRole,
                status: 'active'
              }
            });

            if (aErr) throw aErr;
            uid = newAuth.user.id;

            await supabaseAdmin.from('users').insert([{
              id: uid,
              email: cleanEmail,
              full_name: cleanName,
              role: bulkRole,
              status: 'active',
              created_at: new Date().toISOString()
            }]);
          }

          if (bulkRole === 'student') {
            const numYear = row.year ? Number(row.year) : 1;
            await supabaseAdmin.from('students').upsert([{
              user_id: uid,
              roll_number: row.rollNumber ? String(row.rollNumber).trim().toUpperCase() : null,
              department_id: deptId,
              year: numYear,
              semester: numYear * 2 - 1,
              section: (row.section || 'A').trim().toUpperCase(),
              program: (row.program || 'B.Tech').trim()
            }], { onConflict: 'user_id' });
          } else {
            await supabaseAdmin.from('faculty').upsert([{
              user_id: uid,
              employee_id: row.employeeId ? String(row.employeeId).trim().toUpperCase() : null,
              department_id: deptId,
              designation: (row.designation || 'Assistant Professor').trim()
            }], { onConflict: 'user_id' });
          }

          succeeded++;
          results.push({ rowNumber: row._rowNumber, email: cleanEmail, status: 'success' });
        } catch (err: any) {
          failed++;
          results.push({ rowNumber: row._rowNumber, email: cleanEmail, status: 'failed', error: err.message });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          total: rows.length,
          succeeded,
          failed,
          results
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Server error processing request.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
