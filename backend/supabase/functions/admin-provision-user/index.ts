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
    // ACTION 0: APPLY MIGRATION (DB ALTER / RPC)
    // =========================================================================
    if (action === 'migrate_must_change_password') {
      const dbUrl = Deno.env.get('SUPABASE_DB_URL') || '';
      console.log('[admin-provision-user] SUPABASE_DB_URL present:', !!dbUrl);

      if (!dbUrl) {
        return new Response(
          JSON.stringify({ error: 'SUPABASE_DB_URL is not set in environment.', dbUrlExists: false }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Connect via postgres
      const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
      const sql = postgres(dbUrl);

      try {
        await sql`
          ALTER TABLE public.users 
          ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
        `;

        await sql`
          CREATE OR REPLACE FUNCTION public.complete_password_change()
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          DECLARE
              v_uid UUID := auth.uid();
          BEGIN
              IF v_uid IS NULL THEN
                  RAISE EXCEPTION '401 Unauthorized: Valid authentication session required.';
              END IF;

              UPDATE public.users
              SET must_change_password = false
              WHERE id = v_uid;

              IF NOT FOUND THEN
                  RAISE EXCEPTION 'User record not found for authenticated ID %', v_uid;
              END IF;

              RETURN jsonb_build_object(
                  'success', true,
                  'userId', v_uid,
                  'mustChangePassword', false,
                  'message', 'Temporary password flag successfully cleared.'
              );
          END;
          $$;
        `;

        await sql`GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;`;

        await sql.end();

        return new Response(
          JSON.stringify({ success: true, message: 'Migration applied successfully.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (sqlErr: any) {
        await sql.end();
        return new Response(
          JSON.stringify({ error: sqlErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // ACTION 0B: ADMIN RUN DDL/MIGRATION SQL
    // =========================================================================
    if (action === 'execute_sql') {
      const dbUrl = Deno.env.get('SUPABASE_DB_URL') || '';
      if (!dbUrl) {
        return new Response(
          JSON.stringify({ error: 'SUPABASE_DB_URL is not set in environment.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
      const sql = postgres(dbUrl);

      try {
        const sqlQuery = body.sql;
        if (!sqlQuery || typeof sqlQuery !== 'string') {
          await sql.end();
          return new Response(
            JSON.stringify({ error: 'No SQL query provided in request body.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await sql.unsafe(sqlQuery);
        await sql.end();

        return new Response(
          JSON.stringify({ success: true, message: 'SQL migration executed successfully.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (sqlErr: any) {
        await sql.end();
        return new Response(
          JSON.stringify({ error: sqlErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
      const cleanRollNumber = rollNumber ? String(rollNumber).trim().toUpperCase() : (cleanRole === 'student' ? cleanEmail.split('@')[0].toUpperCase() : null);
      const cleanEmployeeId = employeeId ? String(employeeId).trim().toUpperCase() : (cleanRole === 'faculty' ? cleanEmail.split('@')[0].toUpperCase() : null);

      const defaultPassword = cleanRole === 'student'
        ? (cleanRollNumber || cleanEmail.split('@')[0])
        : (cleanEmployeeId || cleanEmail.split('@')[0]);

      const cleanPassword = (password || defaultPassword || 'GMRIT@' + Math.floor(1000 + Math.random() * 9000)).trim();
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

        // Insert into public.users with must_change_password = true for initial temporary credentials
        await supabaseAdmin.from('users').insert([{
          id: targetUserId,
          email: cleanEmail,
          full_name: cleanName,
          role: cleanRole,
          status: cleanStatus,
          must_change_password: true,
          created_at: new Date().toISOString()
        }]);
      } else {
        // Update existing user profile and update Supabase Auth password if temporary password reset requested
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: cleanPassword,
          email_confirm: true
        });

        await supabaseAdmin.from('users').update({
          full_name: cleanName,
          role: cleanRole,
          status: cleanStatus,
          must_change_password: true
        }).eq('id', targetUserId);
      }

      // Insert or Update students / faculty
      if (cleanRole === 'student') {
        const numYear = year ? (isNaN(Number(year)) ? 1 : Number(year)) : 1;
        await supabaseAdmin.from('students').upsert([{
          user_id: targetUserId,
          roll_number: cleanRollNumber,
          department_id: departmentId || null,
          year: numYear,
          semester: numYear * 2 - 1,
          section: (section || 'A').trim().toUpperCase(),
          program: (program || 'B.Tech').trim()
        }], { onConflict: 'user_id' });
      } else if (cleanRole === 'faculty') {
        await supabaseAdmin.from('faculty').upsert([{
          user_id: targetUserId,
          employee_id: cleanEmployeeId,
          department_id: departmentId || null,
          designation: (designation || 'Assistant Professor').trim()
        }], { onConflict: 'user_id' });
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
          mustChangePassword: true,
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

        const rollNum = row.rollNumber ? String(row.rollNumber).trim().toUpperCase() : (bulkRole === 'student' ? cleanEmail.split('@')[0].toUpperCase() : null);
        const empId = row.employeeId ? String(row.employeeId).trim().toUpperCase() : (bulkRole === 'faculty' ? cleanEmail.split('@')[0].toUpperCase() : null);

        const initialPassword = bulkRole === 'student'
          ? (rollNum || cleanEmail.split('@')[0])
          : (empId || cleanEmail.split('@')[0]);

        const tempPass = (initialPassword || 'GMRIT@' + Math.floor(1000 + Math.random() * 9000)).trim();

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

            // Insert into public.users with must_change_password = true
            await supabaseAdmin.from('users').insert([{
              id: uid,
              email: cleanEmail,
              full_name: cleanName,
              role: bulkRole,
              status: 'active',
              must_change_password: true,
              created_at: new Date().toISOString()
            }]);
          } else {
            // Update existing user's password in Auth to roll number and ensure active status
            await supabaseAdmin.auth.admin.updateUserById(uid, {
              password: tempPass,
              email_confirm: true
            });

            await supabaseAdmin.from('users').update({
              full_name: cleanName || undefined,
              status: 'active',
              must_change_password: true
            }).eq('id', uid);
          }

          if (bulkRole === 'student') {
            const numYear = row.year ? Number(row.year) : 1;
            await supabaseAdmin.from('students').upsert([{
              user_id: uid,
              roll_number: rollNum,
              department_id: deptId,
              year: numYear,
              semester: numYear * 2 - 1,
              section: (row.section || 'A').trim().toUpperCase(),
              program: (row.program || 'B.Tech').trim()
            }], { onConflict: 'user_id' });
          } else {
            await supabaseAdmin.from('faculty').upsert([{
              user_id: uid,
              employee_id: empId,
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

    // =========================================================================
    // ACTION 3: REPAIR CSV-IMPORTED USER PASSWORD / ROSTER
    // =========================================================================
    if (action === 'repair_user_password' || action === 'repair_bulk_passwords') {
      const { email: targetEmail, userId: targetId, allImported = false } = body;

      const repaired = [];
      const errors = [];

      let candidateUsers = [];

      if (targetEmail || targetId) {
        let query = supabaseAdmin.from('users').select('id, email, full_name, role, status');
        if (targetId) query = query.eq('id', targetId);
        else if (targetEmail) query = query.eq('email', targetEmail.trim().toLowerCase());

        const { data, error: qErr } = await query;
        if (qErr) throw qErr;
        candidateUsers = data || [];
      } else if (allImported) {
        // Find all student / faculty users
        const { data, error: qErr } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role, status')
          .in('role', ['student', 'faculty']);
        if (qErr) throw qErr;
        candidateUsers = data || [];
      }

      for (const u of candidateUsers) {
        try {
          const userEmail = (u.email || '').toLowerCase().trim();
          const userRole = (u.role || 'student').toLowerCase().trim();
          let resolvedPassword = '';
          let resolvedRollOrEmp = '';

          if (userRole === 'student') {
            // Find student record or derive from email prefix
            const { data: stRow } = await supabaseAdmin
              .from('students')
              .select('roll_number, department_id, year, semester, section, program')
              .eq('user_id', u.id)
              .maybeSingle();

            resolvedRollOrEmp = stRow?.roll_number || userEmail.split('@')[0].toUpperCase();
            resolvedPassword = resolvedRollOrEmp;

            // Upsert / repair students record to link to this user id
            await supabaseAdmin.from('students').upsert([{
              user_id: u.id,
              roll_number: resolvedRollOrEmp,
              department_id: stRow?.department_id || null,
              year: stRow?.year || 4,
              semester: stRow?.semester || 7,
              section: stRow?.section || 'A',
              program: stRow?.program || 'B.Tech'
            }], { onConflict: 'user_id' });

          } else if (userRole === 'faculty') {
            const { data: facRow } = await supabaseAdmin
              .from('faculty')
              .select('employee_id, department_id, designation')
              .eq('user_id', u.id)
              .maybeSingle();

            resolvedRollOrEmp = facRow?.employee_id || userEmail.split('@')[0].toUpperCase();
            resolvedPassword = resolvedRollOrEmp;

            await supabaseAdmin.from('faculty').upsert([{
              user_id: u.id,
              employee_id: resolvedRollOrEmp,
              department_id: facRow?.department_id || null,
              designation: facRow?.designation || 'Assistant Professor'
            }], { onConflict: 'user_id' });
          }

          if (resolvedPassword) {
            // Update Supabase Auth Password
            const { error: authUpErr } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
              password: resolvedPassword,
              email_confirm: true
            });

            if (authUpErr) throw authUpErr;

            // Ensure status = active and must_change_password = true
            await supabaseAdmin.from('users').update({
              status: 'active',
              must_change_password: true
            }).eq('id', u.id);

            repaired.push({ id: u.id, email: userEmail, role: userRole, rollNumber: resolvedRollOrEmp });
          }
        } catch (err: any) {
          errors.push({ id: u.id, email: u.email, error: err.message });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          repairedCount: repaired.length,
          failedCount: errors.length,
          repaired,
          errors
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // ACTION 4: DELETE USER (AUTH + PROFILE + ACADEMIC RECORDS CASCADE)
    // =========================================================================
    if (action === 'delete_user') {
      const { userId, email: targetEmailParam } = body;
      const cleanTargetId = userId ? String(userId).trim() : '';
      const cleanTargetEmail = targetEmailParam ? String(targetEmailParam).trim().toLowerCase() : '';

      if (!cleanTargetId && !cleanTargetEmail) {
        return new Response(
          JSON.stringify({ error: 'User ID or Email is required for deletion.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Locate the target user in public.users
      let targetUser = null;
      if (cleanTargetId) {
        const { data, error: findErr } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('id', cleanTargetId)
          .maybeSingle();

        if (!findErr && data) {
          targetUser = data;
        }
      }

      if (!targetUser && cleanTargetEmail) {
        const { data, error: findErr } = await supabaseAdmin
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('email', cleanTargetEmail)
          .maybeSingle();

        if (!findErr && data) {
          targetUser = data;
        }
      }

      const targetId = targetUser?.id || cleanTargetId;
      const targetEmail = (targetUser?.email || cleanTargetEmail || '').toLowerCase().trim();
      const targetRole = (targetUser?.role || '').toLowerCase().trim();

      // 2. Safety Rule: Administrator cannot delete their own active account
      if (targetId === callerUid || (targetEmail && targetEmail === callerData.user.email?.toLowerCase())) {
        return new Response(
          JSON.stringify({ error: '403 Forbidden: Administrators cannot delete their own active account.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Clean up dependent academic records safely
      try {
        if (targetRole === 'student' || (!targetRole && targetId)) {
          let stQuery = supabaseAdmin.from('students').select('id, user_id');
          if (targetId) {
            stQuery = stQuery.or(`id.eq.${targetId},user_id.eq.${targetId}`);
          }
          const { data: stRecs } = await stQuery;
          if (stRecs && stRecs.length > 0) {
            for (const stRec of stRecs) {
              const { data: subs } = await supabaseAdmin
                .from('assessment_submissions')
                .select('id')
                .eq('student_id', stRec.id);

              if (subs && subs.length > 0) {
                const subIds = subs.map((s: any) => s.id);
                await supabaseAdmin.from('assessment_answers').delete().in('submission_id', subIds);
                await supabaseAdmin.from('assessment_submissions').delete().eq('student_id', stRec.id);
              }

              await supabaseAdmin.from('students').delete().eq('id', stRec.id);
            }
          }
        }

        if (targetRole === 'faculty' || (!targetRole && targetId)) {
          let facQuery = supabaseAdmin.from('faculty').select('id, user_id');
          if (targetId) {
            facQuery = facQuery.or(`id.eq.${targetId},user_id.eq.${targetId}`);
          }
          const { data: facRecs } = await facQuery;
          if (facRecs && facRecs.length > 0) {
            for (const facRec of facRecs) {
              await supabaseAdmin.from('faculty_assignments').delete().eq('faculty_id', facRec.id);
              await supabaseAdmin.from('assessments').delete().eq('faculty_id', facRec.id);
              await supabaseAdmin.from('faculty').delete().eq('id', facRec.id);
            }
          }
        }

        // 4. Delete profile from public.users
        if (targetId) {
          await supabaseAdmin.from('users').delete().eq('id', targetId);
        }
        if (targetEmail) {
          await supabaseAdmin.from('users').delete().eq('email', targetEmail);
        }

        // 5. Delete authentication account via Supabase Auth Admin API
        let authDeleted = false;
        let authErrorMsg = null;
        let authUserIdToDelete = targetId;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        if (!isUuid && targetEmail) {
          try {
            const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
            const match = userList?.users?.find(u => u.email?.toLowerCase() === targetEmail);
            if (match?.id) {
              authUserIdToDelete = match.id;
            }
          } catch (e) {
            console.warn('[admin-provision-user] Error listing auth users:', e);
          }
        }

        if (authUserIdToDelete && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUserIdToDelete)) {
          try {
            const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(authUserIdToDelete);
            if (authDelErr) {
              authErrorMsg = authDelErr.message;
              console.warn(`[admin-provision-user] auth.admin.deleteUser warning: ${authDelErr.message}`);
            } else {
              authDeleted = true;
            }
          } catch (err: any) {
            authErrorMsg = err.message;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            userId: targetId,
            email: targetEmail,
            role: targetRole,
            authDeleted,
            authErrorMsg,
            message: `User ${targetEmail || targetId} permanently deleted from database and authentication.`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (delErr: any) {
        return new Response(
          JSON.stringify({ error: `Deletion failed: ${delErr.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // =========================================================================
    // ACTION 5: SET USER STATUS (ACTIVE | INACTIVE | PENDING | REJECTED)
    // =========================================================================
    if (action === 'set_user_status' || action === 'set_status') {
      const { userId, status: statusParam } = body;
      const cleanStatus = (statusParam || '').toLowerCase().trim();

      if (!userId || !['active', 'inactive', 'pending', 'rejected', 'suspended'].includes(cleanStatus)) {
        return new Response(
          JSON.stringify({ error: 'Valid userId and status (active, inactive, pending, rejected, suspended) are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update public.users
      const { data: updatedUser, error: updateErr } = await supabaseAdmin
        .from('users')
        .update({ status: cleanStatus })
        .eq('id', userId)
        .select('id, email, full_name, role, status')
        .single();

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: `Failed to update status: ${updateErr.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update auth user metadata
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { status: cleanStatus }
        });
      } catch (e) {
        console.warn('[admin-provision-user] Could not update auth user metadata:', e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: updatedUser,
          status: cleanStatus,
          message: `User status successfully updated to ${cleanStatus}.`
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
