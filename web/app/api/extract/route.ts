import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { extractWorkItems } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { document_id } = body;

  if (!document_id) {
    return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
  }

  // Get document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', document_id)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Update status to processing
  await supabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', document_id);

  try {
    // Get file content
    let content = document.content;

    if (!content && document.file_path) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) {
        throw new Error('Failed to download file');
      }

      content = await fileData.text();
    }

    if (!content) {
      throw new Error('No content to extract');
    }

    // Extract work items using Claude
    const extracted = await extractWorkItems(content);

    // Save extractions to database
    const extractions: {
      document_id: string;
      type: 'epic' | 'feature' | 'story';
      title: string;
      description: string | null;
      acceptance_criteria?: string;
      parent_extraction_id: string | null;
    }[] = [];

    for (const epic of extracted.epics) {
      const { data: epicExtraction } = await supabase
        .from('extractions')
        .insert({
          document_id,
          type: 'epic',
          title: epic.title,
          description: epic.description,
          parent_extraction_id: null,
        })
        .select()
        .single();

      if (epicExtraction) {
        extractions.push(epicExtraction);

        for (const feature of epic.features) {
          const { data: featureExtraction } = await supabase
            .from('extractions')
            .insert({
              document_id,
              type: 'feature',
              title: feature.title,
              description: feature.description,
              parent_extraction_id: epicExtraction.id,
            })
            .select()
            .single();

          if (featureExtraction) {
            extractions.push(featureExtraction);

            for (const story of feature.stories) {
              const { data: storyExtraction } = await supabase
                .from('extractions')
                .insert({
                  document_id,
                  type: 'story',
                  title: story.title,
                  description: story.description,
                  acceptance_criteria: story.acceptance_criteria,
                  parent_extraction_id: featureExtraction.id,
                })
                .select()
                .single();

              if (storyExtraction) {
                extractions.push(storyExtraction);
              }
            }
          }
        }
      }
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'extracted', content })
      .eq('id', document_id);

    return NextResponse.json({ extractions });
  } catch (error) {
    await supabase
      .from('documents')
      .update({ status: 'failed' })
      .eq('id', document_id);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
