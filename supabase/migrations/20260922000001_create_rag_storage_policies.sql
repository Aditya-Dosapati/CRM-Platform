-- ==============================================================================
-- GMR CRM: Storage RLS Policies for Private Bucket 'rag-documents'
-- Schema mapping:
-- auth.uid() -> users.id
-- students.user_id = auth.uid(), student_subjects.student_id = students.id
-- faculty.user_id = auth.uid(), faculty_subjects.faculty_id = faculty.id
-- document_permissions.user_id = auth.uid()
-- ==============================================================================

-- 1. Helper function to check if current user is an Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (LOWER(COALESCE(auth.jwt() ->> 'role', '')) = 'admin') OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND LOWER(users.role) = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Helper function to check if current user is Faculty
CREATE OR REPLACE FUNCTION is_faculty()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (LOWER(COALESCE(auth.jwt() ->> 'role', '')) = 'faculty') OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND LOWER(users.role) = 'faculty'
        ) OR
        EXISTS (
            SELECT 1 FROM public.faculty 
            WHERE faculty.user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Helper function to evaluate read/download access to a storage object
CREATE OR REPLACE FUNCTION can_read_rag_document(object_name TEXT, object_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Admins have unrestricted read access
    IF is_admin() THEN
        RETURN TRUE;
    END IF;

    -- 2. Direct uploader / owner has access
    IF object_owner = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- 3. Check access against rag_documents, enrolled subjects, and document_permissions
    RETURN EXISTS (
        SELECT 1 
        FROM public.rag_documents rd
        WHERE rd.storage_path = object_name
        AND (
            -- Uploader access
            rd.uploaded_by = auth.uid()
            OR (
                -- Indexed documents are accessible based on enrollment or explicit permission
                rd.status = 'indexed'
                AND (
                    -- Explicit user permission in document_permissions (user_id = auth.uid())
                    EXISTS (
                        SELECT 1 FROM public.document_permissions dp
                        WHERE dp.document_id = rd.id
                        AND dp.user_id = auth.uid()
                        AND dp.can_view = TRUE
                    )
                    -- Student enrolled in the subject (ss.student_id -> students.id, students.user_id = auth.uid())
                    OR (
                        rd.subject_id IS NOT NULL 
                        AND EXISTS (
                            SELECT 1 
                            FROM public.student_subjects ss
                            JOIN public.students s ON s.id = ss.student_id
                            WHERE ss.subject_id = rd.subject_id
                              AND s.user_id = auth.uid()
                        )
                    )
                    -- Faculty teaching the subject (fs.faculty_id -> faculty.id, faculty.user_id = auth.uid())
                    OR (
                        rd.subject_id IS NOT NULL 
                        AND EXISTS (
                            SELECT 1 
                            FROM public.faculty_subjects fs
                            JOIN public.faculty f ON f.id = fs.faculty_id
                            WHERE fs.subject_id = rd.subject_id
                              AND f.user_id = auth.uid()
                        )
                    )
                )
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ==============================================================================
-- 4. Storage Policies on storage.objects for bucket 'rag-documents'
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Policy: INSERT (Upload)
-- Only Admins and Faculty can upload to 'rag-documents'. Students are blocked.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rag_storage_admin_faculty_insert" ON storage.objects;
CREATE POLICY "rag_storage_admin_faculty_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'rag-documents'
    AND (is_admin() OR is_faculty())
    AND (owner = auth.uid() OR owner IS NULL)
);

-- ------------------------------------------------------------------------------
-- Policy: SELECT (Read / Download)
-- Authenticated users (Admin, Faculty, Student) can download ONLY authorized files.
-- Public/anonymous access is completely denied.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rag_storage_authorized_select" ON storage.objects;
CREATE POLICY "rag_storage_authorized_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'rag-documents'
    AND can_read_rag_document(name, owner)
);

-- ------------------------------------------------------------------------------
-- Policy: UPDATE
-- Only Admins or the Faculty member who uploaded the document can update it.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rag_storage_admin_faculty_update" ON storage.objects;
CREATE POLICY "rag_storage_admin_faculty_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'rag-documents'
    AND (
        is_admin()
        OR (
            is_faculty() 
            AND (
                owner = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.rag_documents rd
                    WHERE rd.storage_path = storage.objects.name
                    AND rd.uploaded_by = auth.uid()
                )
            )
        )
    )
)
WITH CHECK (
    bucket_id = 'rag-documents'
    AND (
        is_admin()
        OR (
            is_faculty() 
            AND (
                owner = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.rag_documents rd
                    WHERE rd.storage_path = storage.objects.name
                    AND rd.uploaded_by = auth.uid()
                )
            )
        )
    )
);

-- ------------------------------------------------------------------------------
-- Policy: DELETE
-- Only Admins or the Faculty member who uploaded the document can delete it.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rag_storage_admin_faculty_delete" ON storage.objects;
CREATE POLICY "rag_storage_admin_faculty_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'rag-documents'
    AND (
        is_admin()
        OR (
            is_faculty() 
            AND (
                owner = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.rag_documents rd
                    WHERE rd.storage_path = storage.objects.name
                    AND rd.uploaded_by = auth.uid()
                )
            )
        )
    )
);
