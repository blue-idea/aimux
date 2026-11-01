/**
 * 跨平台安全文件名处理，移除在 Windows / macOS / Linux 下非法的字符
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

export interface SingleViewportExportInput {
  modelName: string;
  messages: string[];
  timestamp?: string;
}

export interface ViewportExportItem {
  modelName: string;
  messages: string[];
}

/**
 * 将单个视口的对话记录格式化为清晰的 GitHub Flavored Markdown 文本
 */
export function formatSingleViewportMarkdown(input: SingleViewportExportInput): string {
  const timestamp = input.timestamp || new Date().toISOString();
  const lines: string[] = [];

  lines.push(`# Aimux Conversation Export - ${input.modelName}`);
  lines.push('');
  lines.push(`- **Model**: ${input.modelName}`);
  lines.push(`- **Export Time**: ${timestamp}`);
  lines.push(`- **Total Messages**: ${input.messages.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (input.messages.length === 0) {
    lines.push('*No conversation records recorded.*');
    lines.push('');
    return lines.join('\n');
  }

  input.messages.forEach((msg, idx) => {
    lines.push(`### Message ${idx + 1}`);
    lines.push('');
    lines.push(msg.trim());
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * 将全部活跃视口的对话记录合并格式化为一个完整的综合 Markdown 报告
 */
export function formatAllViewportsMarkdown(
  viewports: ViewportExportItem[],
  timestamp?: string,
): string {
  const exportTime = timestamp || new Date().toISOString();
  const lines: string[] = [];

  lines.push('# Aimux Multi-Viewport Workspace Export');
  lines.push('');
  lines.push(`- **Export Time**: ${exportTime}`);
  lines.push(`- **Active Viewports**: ${viewports.map((v) => v.modelName).join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  viewports.forEach((vp, vpIndex) => {
    lines.push(`## ${vpIndex + 1}. ${vp.modelName}`);
    lines.push('');
    if (vp.messages.length === 0) {
      lines.push('*No conversation records in this viewport.*');
    } else {
      vp.messages.forEach((msg, mIndex) => {
        lines.push(`#### [${vp.modelName}] Message ${mIndex + 1}`);
        lines.push('');
        lines.push(msg.trim());
        lines.push('');
      });
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * 触发浏览器端 Blob 下载 Markdown 文件
 */
export function downloadMarkdownFile(content: string, filename = 'aimux-export.md'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const cleanName = sanitizeFilename(filename);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = cleanName.endsWith('.md') ? cleanName : `${cleanName}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * 将 Markdown 内容复制到系统剪贴板
 */
export async function copyMarkdownToClipboard(content: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}

