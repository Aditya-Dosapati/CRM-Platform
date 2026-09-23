// GMR CRM - Academic Data Service (Direct Supabase Integration)
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { isValidUuid } from './ragDocumentService.js';

class AcademicDataService {
  /**
   * Fetch all academic departments directly from Supabase `departments` table.
   * Returns empty array if none exist; does NOT inject mock fallback IDs.
   */
  async getDepartments() {
    if (!isSupabaseConfigured()) {
      return {
        data: [],
        source: 'local_cache',
        error: 'Supabase client is not configured'
      };
    }

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code, created_at')
        .order('name', { ascending: true });

      if (error) {
        console.error('[AcademicDataService] Supabase departments query error:', error);
        return {
          data: [],
          source: 'supabase',
          error: error.message || 'Failed to query departments table'
        };
      }

      const formatted = (data || []).map(item => ({
        id: item.id,
        code: item.code || '',
        name: item.name || ''
      }));

      return {
        data: formatted,
        source: 'supabase',
        error: null
      };
    } catch (err) {
      console.error('[AcademicDataService] Exception fetching departments:', err);
      return {
        data: [],
        source: 'supabase',
        error: err.message || 'Unexpected error fetching departments'
      };
    }
  }

  /**
   * Fetch academic subjects directly from Supabase `subjects` + `subject_departments` tables.
   * - If departmentIdOrCode is a valid UUID: queries subject_departments mapped to that department UUID.
   * - If departmentIdOrCode is a department code ('CSE', 'AIDS', 'AIML'): queries mapped subjects.
   * - If departmentIdOrCode is null: fetches all master subjects.
   * Returns canonical UUIDs from public.subjects.id.
   */
  async getSubjects(departmentIdOrCode = null) {
    if (!isSupabaseConfigured()) {
      return {
        data: [],
        source: 'local_cache',
        error: 'Supabase client is not configured'
      };
    }

    try {
      // 1. Filter by Department UUID via normalized subject_departments
      if (departmentIdOrCode && isValidUuid(departmentIdOrCode)) {
        const { data: mappingData, error: mapErr } = await supabase
          .from('subject_departments')
          .select(`
            subject_id,
            department_id,
            subjects:subject_id (
              id,
              name,
              code,
              semester,
              credits,
              subject_type,
              elective_group,
              regulation
            )
          `)
          .eq('department_id', departmentIdOrCode);

        if (mapErr) {
          console.error('[AcademicDataService] Supabase subject_departments query error:', mapErr);
          return {
            data: [],
            source: 'supabase',
            error: mapErr.message || 'Failed to query subjects for selected department'
          };
        }

        const subjectsList = (mappingData || [])
          .map(m => m.subjects)
          .filter(Boolean)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const formatted = subjectsList.map(s => ({
          id: s.id,
          code: s.code || '',
          name: s.name || '',
          semester: s.semester,
          credits: s.credits || 3,
          subjectType: s.subject_type || 'CORE',
          electiveGroup: s.elective_group || null,
          regulation: s.regulation || 'AR23',
          departmentId: departmentIdOrCode
        }));

        return {
          data: formatted,
          source: 'supabase',
          error: null
        };
      }

      // 2. Filter by Department Short Code (e.g., 'CSE', 'AIDS', 'AIML')
      if (departmentIdOrCode && typeof departmentIdOrCode === 'string' && !isValidUuid(departmentIdOrCode)) {
        const { data: mappingData, error: mapErr } = await supabase
          .from('subject_departments')
          .select(`
            subject_id,
            department_id,
            departments:department_id!inner (code),
            subjects:subject_id (
              id,
              name,
              code,
              semester,
              credits,
              subject_type,
              elective_group,
              regulation
            )
          `)
          .eq('departments.code', departmentIdOrCode);

        if (mapErr) {
          console.error('[AcademicDataService] Supabase subject_departments by code query error:', mapErr);
          return {
            data: [],
            source: 'supabase',
            error: mapErr.message || `Failed to query subjects for branch code ${departmentIdOrCode}`
          };
        }

        const subjectsList = (mappingData || [])
          .map(m => m.subjects)
          .filter(Boolean)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const formatted = subjectsList.map(s => ({
          id: s.id,
          code: s.code || '',
          name: s.name || '',
          semester: s.semester,
          credits: s.credits || 3,
          subjectType: s.subject_type || 'CORE',
          electiveGroup: s.elective_group || null,
          regulation: s.regulation || 'AR23',
          departmentId: null
        }));

        return {
          data: formatted,
          source: 'supabase',
          error: null
        };
      }

      // 3. Fetch all master subjects
      const { data: allSubjects, error: allErr } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          code,
          semester,
          credits,
          subject_type,
          elective_group,
          regulation
        `)
        .order('name', { ascending: true });

      if (allErr) {
        console.error('[AcademicDataService] Supabase all subjects query error:', allErr);
        return {
          data: [],
          source: 'supabase',
          error: allErr.message || 'Failed to query subjects table'
        };
      }

      const formatted = (allSubjects || []).map(s => ({
        id: s.id,
        code: s.code || '',
        name: s.name || '',
        semester: s.semester,
        credits: s.credits || 3,
        subjectType: s.subject_type || 'CORE',
        electiveGroup: s.elective_group || null,
        regulation: s.regulation || 'AR23'
      }));

      return {
        data: formatted,
        source: 'supabase',
        error: null
      };
    } catch (err) {
      console.error('[AcademicDataService] Exception fetching subjects:', err);
      return {
        data: [],
        source: 'supabase',
        error: err.message || 'Unexpected error fetching subjects'
      };
    }
  }

  /**
   * Get single subject by canonical UUID from public.subjects.id
   */
  async getSubjectById(subjectId) {
    if (!subjectId || !isValidUuid(subjectId)) return null;
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          code,
          semester,
          credits,
          subject_type,
          elective_group,
          regulation
        `)
        .eq('id', subjectId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        code: data.code || '',
        name: data.name || '',
        semester: data.semester,
        credits: data.credits || 3,
        subjectType: data.subject_type || 'CORE',
        electiveGroup: data.elective_group || null,
        regulation: data.regulation || 'AR23'
      };
    } catch (err) {
      console.error('[AcademicDataService] Exception fetching subject by id:', err);
      return null;
    }
  }
}

export const academicDataService = new AcademicDataService();
export default academicDataService;
