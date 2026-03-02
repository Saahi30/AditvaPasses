'use server'

import { createServiceClient } from '@/utils/supabase/service'
import { revalidatePath } from 'next/cache'
import { sendTicketEmail } from '@/utils/resend'
import { createClient } from '@/utils/supabase/client'

export async function createCollegeAdmin(formData: {
    email: string
    password: string
    fullName: string
    collegeId: string
}) {
    const supabase = createServiceClient()

    // 1. Create the user in Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.fullName
        }
    })

    if (authError) {
        return { success: false, error: authError.message }
    }

    // 2. Update the profile with correct role and college_id
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            role: 'college_admin',
            college_id: formData.collegeId,
            full_name: formData.fullName,
            requires_password_change: true
        })
        .eq('id', userData.user.id)

    if (profileError) {
        // Cleanup auth user if profile update fails
        await supabase.auth.admin.deleteUser(userData.user.id)
        return { success: false, error: profileError.message }
    }

    revalidatePath('/974hdjkfsdfh')
    return { success: true }
}

export async function getCollegeAdmins(collegeId: string) {
    const supabase = createServiceClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, updated_at')
        .eq('college_id', collegeId)
        .eq('role', 'college_admin')

    if (error) return []
    return data
}

export async function createCollege(data: {
    name: string,
    email_domain: string,
    courses: string[],
    years: string[]
}) {
    const supabase = createServiceClient()
    const { error } = await supabase.from('colleges').insert(data)
    if (error) return { success: false, error: error.message }
    revalidatePath('/974hdjkfsdfh')
    revalidatePath('/auth')
    return { success: true }
}

export async function getColleges() {
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('colleges').select('*').order('name')
    if (error) return []
    return data
}

export async function createClub(formData: {
    name: string
    headName: string
    contactDetails: string
    logoUrl?: string
    collegeId: string
}) {
    const supabase = createServiceClient()

    const { error } = await supabase.from('clubs').insert({
        name: formData.name,
        head_name: formData.headName,
        contact_details: formData.contactDetails,
        logo_url: formData.logoUrl,
        college_id: formData.collegeId
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/college-admin')
    return { success: true }
}

export async function deleteClub(clubId: string) {
    const supabase = createServiceClient()
    const { error } = await supabase.from('clubs').delete().eq('id', clubId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/college-admin')
    return { success: true }
}

export async function getClubs(collegeId: string) {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('college_id', collegeId)
        .order('name')

    if (error) return []
    return data
}

export async function scanPass(qrCodeId: string, adminId: string) {
    const supabase = createServiceClient()

    // 1. Get the pass and related event details
    const { data: pass, error: passError } = await supabase
        .from('passes')
        .select('*, events(*)')
        .eq('qr_code', qrCodeId)
        .single()

    if (passError || !pass) {
        return { success: false, error: 'Pass not found or invalid' }
    }

    // 2. Security Check: Is the scanning admin from the same college as the event?
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('college_id')
        .eq('id', adminId)
        .single()

    if (adminProfile?.college_id !== pass.events.college_id) {
        return { success: false, error: 'Access Denied: Pass belongs to another college' }
    }

    // 3. Status Check: Is it already used?
    if (pass.status === 'used') {
        const time = pass.scanned_at ? new Date(pass.scanned_at).toLocaleTimeString() : 'unknown time'
        return {
            success: false,
            error: `Pass already scanned at ${time}`,
            status: 'used'
        }
    }

    // 4. Mark as scanned
    const { error: updateError } = await supabase
        .from('passes')
        .update({
            status: 'used',
            scanned_at: new Date().toISOString(),
            scanned_by: adminId
        })
        .eq('id', pass.id)

    if (updateError) {
        return { success: false, error: 'Failed to update pass status' }
    }

    return {
        success: true,
        data: {
            eventName: pass.events.title
        }
    }
}

export async function issuePasses(formData: {
    eventId: string,
    collegeId: string,
    targetCourses: string[],
    targetYears: string[],
    targetBatches: string[]
}) {
    const supabase = createServiceClient()

    // 1. Get Event Details
    const { data: event } = await supabase.from('events').select('title').eq('id', formData.eventId).single()
    if (!event) return { success: false, error: 'Event not found' }

    // 2. Query students matching criteria
    let query = supabase
        .from('profiles')
        .select('id, email')
        .eq('college_id', formData.collegeId)
        .eq('role', 'student')

    if (formData.targetCourses.length > 0 && !formData.targetCourses.includes('ALL')) {
        query = query.in('course', formData.targetCourses)
    }
    if (formData.targetYears.length > 0 && !formData.targetYears.includes('ALL')) {
        query = query.in('year', formData.targetYears)
    }
    if (formData.targetBatches.length > 0 && !formData.targetBatches.includes('ALL')) {
        query = query.in('batch', formData.targetBatches)
    }

    const { data: students, error: studentError } = await query
    if (studentError) return { success: false, error: studentError.message }
    if (!students || students.length === 0) return { success: false, error: 'No students found matching these filters' }

    // 3. Batch Create Passes (ignoring students who already have a pass for this event)
    const { data: existingPasses } = await supabase
        .from('passes')
        .select('user_id')
        .eq('event_id', formData.eventId)

    const existingUserIds = new Set(existingPasses?.map(p => p.user_id) || [])
    const newStudents = students.filter(s => !existingUserIds.has(s.id))

    if (newStudents.length === 0) return { success: false, error: 'All matching students already have passes' }

    const passEntries = newStudents.map(student => ({
        event_id: formData.eventId,
        user_id: student.id,
        status: 'valid'
    }))

    const { data: createdPasses, error: passError } = await supabase.from('passes').insert(passEntries).select()
    if (passError) return { success: false, error: passError.message }

    // 4. Send Emails via Resend (async, won't block response)
    createdPasses.forEach((pass, index) => {
        const student = newStudents[index]
        if (student.email) {
            sendTicketEmail(student.email, event.title, pass.qr_code)
        }
    })

    revalidatePath('/dashboard/college-admin')
    return { success: true, count: newStudents.length }
}
export async function updateCollege(collegeId: string, data: {
    email_domain?: string,
    courses?: string[],
    years?: string[],
    batches?: string[]
}) {
    const supabase = createServiceClient()

    const { error } = await supabase
        .from('colleges')
        .update({
            email_domain: data.email_domain,
            courses: data.courses,
            years: data.years,
            batches: data.batches
        })
        .eq('id', collegeId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/college-admin')
    return { success: true }
}

export async function deleteEvent(eventId: string) {
    const supabase = createServiceClient()
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/college-admin')
    revalidatePath('/events')
    revalidatePath('/')
    return { success: true }
}

export async function updateEvent(eventId: string, data: {
    title?: string,
    description?: string,
    event_date?: string,
    location?: string,
    club_id?: string | null,
    brochure_url?: string | null,
    images?: string[],
    is_published?: boolean,
    max_capacity?: number
}) {
    const supabase = createServiceClient()

    const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', eventId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/college-admin')
    revalidatePath('/events')
    revalidatePath('/')
    return { success: true }
}
export async function getCollegeAnalytics(collegeId: string) {
    const supabase = createServiceClient()

    // 1. Total Students
    const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .eq('role', 'student')

    // 2. Active Events
    const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', collegeId)
        .eq('is_published', true)

    // 3. Passes Issued vs Scanned
    // We'll join passes with events to filtered by college_id
    const { data: passes } = await supabase
        .from('passes')
        .select('status, events!inner(college_id)')
        .eq('events.college_id', collegeId)

    const totalIssued = passes?.length || 0
    const totalScanned = passes?.filter(p => p.status === 'used').length || 0

    return {
        students: studentCount || 0,
        events: eventCount || 0,
        passesIssued: totalIssued,
        passesScanned: totalScanned
    }
}

export async function getStudents(collegeId: string) {
    const supabase = createServiceClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('college_id', collegeId)
        .eq('role', 'student')
        .order('full_name')

    if (error) return []
    return data
}
