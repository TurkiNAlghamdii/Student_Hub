import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    // Check if user is authenticated and is admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // Check if user is admin
    const isAdmin = user.app_metadata?.is_admin === true || 
                   user.app_metadata?.is_admin === 'true' || 
                   String(user.app_metadata?.is_admin).toLowerCase() === 'true';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Update the support request
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('support_requests')
      .update({
        status,
        updated_at: now
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data: data[0] });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 