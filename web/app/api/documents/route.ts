import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const projectId = formData.get('project_id') as string;

  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and project_id are required' }, { status: 400 });
  }

  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const validTypes = ['pdf', 'docx', 'txt', 'md'];

  if (!fileExt || !validTypes.includes(fileExt)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Upload to storage
  const filePath = `${user.id}/${projectId}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      name: fileName,
      type: fileExt as 'pdf' | 'docx' | 'txt' | 'md',
      file_path: filePath,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
