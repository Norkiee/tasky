interface FrameData {
  id: string;
  name: string;
  sectionName?: string;
  imageBase64: string;
  textContent: string[];
  componentNames: string[];
  nestedFrameNames: string[];
  width: number;
  height: number;
}

interface SectionData {
  id: string;
  name: string;
  frameCount: number;
}

interface SelectionResult {
  frames: FrameData[];
  sections: SectionData[];
}

function extractTextContent(node: SceneNode): string[] {
  const textContent: string[] = [];

  function traverse(n: SceneNode) {
    if (n.type === 'TEXT') {
      const text = n.characters.trim();
      if (text && text.length > 1 && !textContent.includes(text)) {
        textContent.push(text);
      }
    }
    if ('children' in n) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return textContent.slice(0, 30);
}

function extractComponentNames(node: SceneNode): string[] {
  const componentNames: string[] = [];

  function traverse(n: SceneNode) {
    if (n.type === 'INSTANCE') {
      const name = n.name;
      if (name && !name.match(/^(Frame|Group|Rectangle|Ellipse)\s*\d*$/i)) {
        if (!componentNames.includes(name)) {
          componentNames.push(name);
        }
      }
    }
    if ('children' in n) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);
  return componentNames.slice(0, 20);
}

function extractNestedFrameNames(node: SceneNode): string[] {
  const frameNames: string[] = [];

  function traverse(n: SceneNode, depth: number) {
    if (depth > 2) return;
    if (n.type === 'FRAME' && n !== node) {
      const name = n.name;
      if (name && !name.match(/^Frame\s*\d*$/i)) {
        if (!frameNames.includes(name)) {
          frameNames.push(name);
        }
      }
    }
    if ('children' in n) {
      n.children.forEach((child) => traverse(child, depth + 1));
    }
  }

  traverse(node, 0);
  return frameNames.slice(0, 10);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return figma.base64Encode(bytes);
}

async function exportFrameAsBase64(frame: FrameNode): Promise<string> {
  try {
    // Export at reduced size for fast API transfer
    const maxSize = 512;
    const scale = Math.min(1, maxSize / Math.max(frame.width, frame.height));

    const bytes = await frame.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: scale },
    });

    return uint8ArrayToBase64(bytes);
  } catch (error) {
    console.error('Failed to export frame:', error);
    return '';
  }
}

async function buildFrameData(frame: FrameNode, sectionName?: string): Promise<FrameData> {
  const imageBase64 = await exportFrameAsBase64(frame);

  return {
    id: frame.id,
    name: frame.name,
    sectionName,
    imageBase64,
    textContent: extractTextContent(frame),
    componentNames: extractComponentNames(frame),
    nestedFrameNames: extractNestedFrameNames(frame),
    width: Math.round(frame.width),
    height: Math.round(frame.height),
  };
}

async function getSelectedFrames(): Promise<SelectionResult> {
  const frames: FrameData[] = [];
  const sections: SectionData[] = [];

  const framePromises: Promise<FrameData>[] = [];
  const frameNodes: { frame: FrameNode; sectionName?: string }[] = [];

  for (const node of figma.currentPage.selection) {
    if (node.type === 'FRAME') {
      frameNodes.push({ frame: node });
    } else if (node.type === 'SECTION') {
      const sectionFrames = node.children
        .filter((child): child is FrameNode => child.type === 'FRAME');

      sections.push({
        id: node.id,
        name: node.name,
        frameCount: sectionFrames.length,
      });

      for (const frame of sectionFrames) {
        frameNodes.push({ frame, sectionName: node.name });
      }
    }
  }

  // Export all frames in parallel
  for (const { frame, sectionName } of frameNodes) {
    framePromises.push(buildFrameData(frame, sectionName));
  }

  const exportedFrames = await Promise.all(framePromises);
  frames.push(...exportedFrames);

  return { frames, sections };
}

function getSelectionCounts(): { frameCount: number; sectionCount: number; sections: SectionData[] } {
  let frameCount = 0;
  const sections: SectionData[] = [];

  for (const node of figma.currentPage.selection) {
    if (node.type === 'FRAME') {
      frameCount++;
    } else if (node.type === 'SECTION') {
      const sectionFrames = node.children.filter(
        (child): child is FrameNode => child.type === 'FRAME'
      );
      frameCount += sectionFrames.length;
      sections.push({
        id: node.id,
        name: node.name,
        frameCount: sectionFrames.length,
      });
    }
  }

  return { frameCount, sectionCount: sections.length, sections };
}

figma.showUI(__html__, { width: 700, height: 520 });

figma.ui.onmessage = async (msg: { type: string; data?: unknown; height?: number }) => {
  if (msg.type === 'get-selection') {
    const { frames, sections } = await getSelectedFrames();
    figma.ui.postMessage({ type: 'selection', frames, sections });
  }

  if (msg.type === 'get-storage') {
    const data = await figma.clientStorage.getAsync('tasky');
    figma.ui.postMessage({ type: 'storage', data: data || {} });
  }

  if (msg.type === 'set-storage') {
    await figma.clientStorage.setAsync('tasky', msg.data);
  }

  if (msg.type === 'resize') {
    const height = Math.min(Math.max(msg.height || 200, 200), 800);
    figma.ui.resize(700, height);
  }
};

figma.on('selectionchange', () => {
  const { frameCount, sectionCount, sections } = getSelectionCounts();
  figma.ui.postMessage({
    type: 'selection-changed',
    frameCount,
    sectionCount,
    sections,
  });
});
