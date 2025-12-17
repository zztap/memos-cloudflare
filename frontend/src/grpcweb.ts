// REST API Client for Cloudflare Workers Backend
import { apiClient } from "./api/client";

// Create compatible service clients that use REST API
const createServiceClient = (service: any) => ({
  [service]: apiClient,
});

// Workspace Service
export const workspaceServiceClient = {
  getWorkspaceProfile: async () => {
    try {
      const profile = await apiClient.getWorkspaceProfile();
      console.log('✅ Workspace profile loaded:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Failed to load workspace profile:', error);
      // Return a fallback profile if API fails
      return {
        version: '0.24.0-cloudflare',
        mode: 'prod',
        instanceUrl: window.location.origin,
        owner: 'users/1',
      };
    }
  },
};

export const workspaceSettingServiceClient = {
  getWorkspaceSetting: (request: { name: string }) => {
    return apiClient.getWorkspaceSetting(request.name);
  },
  setWorkspaceSetting: (request: { setting: any }) => {
    return apiClient.setWorkspaceSetting(request.setting);
  },
};

// Auth Service  
export const authServiceClient = {
  signIn: (request: { passwordCredentials?: { username: string; password: string }; neverExpire?: boolean }) => {
    if (request.passwordCredentials) {
      return apiClient.signIn(request.passwordCredentials.username, request.passwordCredentials.password);
    }
    throw new Error('Password credentials required');
  },
  signUp: (request: { username: string; password: string; email?: string }) =>
    apiClient.signUp(request.username, request.password, request.email),
  getAuthStatus: () => apiClient.getCurrentUser(),
};

// User Service
export const userServiceClient = {
  getCurrentUser: () => apiClient.getCurrentUser(),
  getUser: (request: { name: string }) => {
    const id = parseInt(request.name.replace('users/', ''));
    return apiClient.getUser(id);
  },
  getUserByUsername: (request: { username: string }) => apiClient.getUserByUsername(request.username),
  listUsers: () => apiClient.listUsers(),
  updateUser: (request: { user: any; updateMask: any }) => {
    const id = parseInt(request.user.name.replace('users/', ''));
    // 构造后端期望的数据格式
    const userData = {
      username: request.user.username,
      nickname: request.user.nickname,
      email: request.user.email,
      avatarUrl: request.user.avatarUrl,
      description: request.user.description,
    };
    return apiClient.updateUser(id, userData);
  },
  deleteUser: (request: { name: string }) => {
    const id = parseInt(request.name.replace('users/', ''));
    return apiClient.deleteUser(id);
  },
  getUserSetting: (request?: { name?: string }) => {
    // 从当前登录用户获取ID
    const currentUserId = 1; // TODO: 从当前用户context获取真实ID
    return apiClient.getUserSetting(currentUserId);
  },
  updateUserSetting: (request: { setting: any; updateMask: string[] }) => {
    // 从当前登录用户获取ID
    const currentUserId = 1; // TODO: 从当前用户context获取真实ID
    return apiClient.updateUserSetting(currentUserId, request.setting);
  },
    getUserStats: async (request: { name: string }) => {
    // 补丁: 获取真实标签数据
    let tagCount: Record<string, number> = {};
    try {
      const tags = await apiClient.getTags();
      if (Array.isArray(tags)) {
        tags.forEach((tag: any) => {
          tagCount[tag.name] = tag.memo_count || 1;
        });
      }
    } catch (e) {
      console.error('Failed to fetch tags for stats:', e);
    }

    return {
      name: request.name,
      memoDisplayTimestamps: [],
      memoTypeStats: {
        linkCount: 0,
        codeCount: 0,
        todoCount: 0,
        undoCount: 0,
      },
      tagCount: tagCount,
      pinnedMemos: [],
      totalMemoCount: 0,
    };
  },
  listAllUserStats: () =>
    Promise.resolve({
      userStats: [{
        name: 'users/1',
        memoDisplayTimestamps: [],
        memoTypeStats: {
          linkCount: 0,
          codeCount: 0,
          todoCount: 0,
          undoCount: 0,
        },
        tagCount: {},
        pinnedMemos: [],
        totalMemoCount: 0,
      }]
    }),
};

// Memo Service  
export const memoServiceClient = {
  listMemos: (request: any) => apiClient.getMemos(request),
  getMemo: (request: { name: string }) => {
    const id = parseInt(request.name.replace('memos/', ''));
    return apiClient.getMemo(id);
  },
  createMemo: (request: { memo: any }) => apiClient.createMemo(request.memo),
  updateMemo: (request: { memo: any; updateMask: any }) => {
    console.log('🔄 updateMemo request:', request);

    if (!request.memo || !request.memo.name) {
      throw new Error('Memo name is required for update');
    }

    const memoName = request.memo.name;
    console.log('📝 Memo name:', memoName);

    // 提取ID，添加更严格的验证
    const idString = memoName.replace('memos/', '');
    const id = parseInt(idString, 10);

    console.log('🔢 Extracted ID string:', idString);
    console.log('🔢 Parsed ID:', id);

    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid memo ID: ${idString} from name: ${memoName}`);
    }

    return apiClient.updateMemo(id, request.memo);
  },
  deleteMemo: (request: { name: string }) => {
    const id = parseInt(request.name.replace('memos/', ''));
    return apiClient.deleteMemo(id);
  },
  renameMemoTag: (request: { parent: string; oldTag: string; newTag: string }) => Promise.resolve({}),
  deleteMemoTag: (request: { parent: string; tag: string; deleteRelatedMemos?: boolean }) => Promise.resolve({}),
};

// Resource Service
export const resourceServiceClient = {
  getResource: (request: { name: string }) => Promise.resolve({
    name: request.name,
    uid: '',
    createTime: '',
    filename: '',
    content: new Uint8Array(),
    externalLink: '',
    type: '',
    size: 0,
    memo: '',
  }),
  createResource: (request: { resource?: any, filename?: string, type?: string }) => {
    if (request.resource?.content || request.resource?.blob) {
      const data = request.resource.content || request.resource.blob;
      const file = new File([data], request.resource.filename, { type: request.resource.type });
      return apiClient.uploadResource(file);
    }
    return Promise.resolve({
      name: 'resources/1',
      uid: '',
      createTime: new Date().toISOString(),
      filename: request.filename || '',
      content: new Uint8Array(),
      externalLink: '',
      type: request.type || '',
      size: 0,
      memo: '',
    });
  },
  updateResource: (request: any) => Promise.resolve(request.resource),
  deleteResource: (request: { name: string }) => Promise.resolve({}),
  listResources: (request: { parent: string }) => Promise.resolve({ resources: [] }),
};

// Shortcut Service
export const shortcutServiceClient = {
  listShortcuts: (request: { parent: string }) => Promise.resolve({ shortcuts: [] }),
  createShortcut: (request: { parent: string; shortcut: any }) => Promise.resolve({
    ...request.shortcut,
    id: request.shortcut.id || `shortcut-${Date.now()}`,
  }),
  updateShortcut: (request: { parent: string; shortcut: any; updateMask?: string[] }) => Promise.resolve(request.shortcut),
  deleteShortcut: (request: { parent: string; id: string }) => Promise.resolve({}),
};

// Inbox Service  
export const inboxServiceClient = {
  listInboxes: (request: any) => Promise.resolve({ inboxes: [] }),
  updateInbox: (request: { inbox: any; updateMask: string[] }) => Promise.resolve(request.inbox),
  deleteInbox: (request: { name: string }) => Promise.resolve({}),
};

export const activityServiceClient = {
  getActivity: () => Promise.resolve({}),
};

export const webhookServiceClient = {
  listWebhooks: async (request: { creator: string }) => {
    try {
      // 调用后端的webhook API
      const response = await (apiClient as any).request(`/api/webhook?creator=${encodeURIComponent(request.creator)}`, {
        method: 'GET'
      });
      return response; // 后端应该返回 { webhooks: [...] }
    } catch (error) {
      console.warn('Failed to fetch webhooks:', error);
      // 返回空的webhooks数组作为fallback
      return { webhooks: [] };
    }
  },
  createWebhook: async (request: { name: string; url: string }) => {
    try {
      const response = await (apiClient as any).request('/api/webhook', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      return response;
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw error;
    }
  },
  deleteWebhook: async (request: { id: number }) => {
    try {
      const response = await (apiClient as any).request(`/api/webhook/${request.id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  },
};

export const markdownServiceClient = {
  parseMarkdown: (request: { markdown: string }) => {
    // 这是一个简化版的markdown解析器
    // 在实际生产环境中，应该使用后端的markdown解析服务
    const nodes = parseMarkdownToNodes(request.markdown);
    return Promise.resolve({ nodes });
  },
  restoreMarkdownNodes: (request: { nodes: any[] }) => {
    // 这是一个简化版的节点还原为markdown的功能
    const markdown = restoreNodesToMarkdown(request.nodes);
    return Promise.resolve({ markdown });
  },
  getLinkMetadata: (request: { link: string }) =>
    Promise.resolve({
      title: request.link,
      description: '',
      image: '',
    }),
};

// 增强版markdown解析器 - 支持标签、链接、图片和基本格式
function parseMarkdownToNodes(markdown: string): any[] {
  const lines = markdown.split('\n');
  const nodes: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. 代码块处理
    if (line.trim().startsWith('```')) {
      const language = line.trim().substring(3);
      const codeLines = [];
      i++; // 跳过开始的```行

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      nodes.push({
        type: 'CODE_BLOCK',
        codeBlockNode: {
          language: language,
          content: codeLines.join('\n')
        }
      });
      continue;
    }

    // 2. 引用块
    if (line.startsWith('> ')) {
      const content = line.substring(2);
      nodes.push({
        type: 'BLOCKQUOTE',
        blockquoteNode: {
          children: parseInlineElements(content)
        }
      });
      continue;
    }

    // 3. 任务列表项
    const taskMatch = line.match(/^(\s*)- \[([ xX])\] (.*)/);
    if (taskMatch) {
      const indent = Math.floor(taskMatch[1].length / 2);
      const isComplete = taskMatch[2].toLowerCase() === 'x';
      const content = taskMatch[3];

      nodes.push({
        type: 'TASK_LIST_ITEM',
        taskListItemNode: {
          symbol: '-',
          indent: indent,
          complete: isComplete,
          children: parseInlineElements(content)
        }
      });
      continue;
    }

    // 4. 普通无序列表项
    const listMatch = line.match(/^(\s*)- (.*)/);
    if (listMatch) {
      const indent = Math.floor(listMatch[1].length / 2);
      nodes.push({
        type: 'UNORDERED_LIST_ITEM',
        unorderedListItemNode: {
          symbol: '-',
          indent: indent,
          children: parseInlineElements(listMatch[2])
        }
      });
      continue;
    }

    // 5. 有序列表项
    const orderedMatch = line.match(/^(\s*)(\d+)\. (.*)/);
    if (orderedMatch) {
      const indent = Math.floor(orderedMatch[1].length / 2);
      nodes.push({
        type: 'ORDERED_LIST_ITEM',
        orderedListItemNode: {
          number: orderedMatch[2],
          indent: indent,
          children: parseInlineElements(orderedMatch[3])
        }
      });
      continue;
    }

    // 6. 标题
    const headingMatch = line.match(/^(#{1,6}) (.*)/);
    if (headingMatch) {
      nodes.push({
        type: 'HEADING',
        headingNode: {
          level: headingMatch[1].length,
          children: parseInlineElements(headingMatch[2])
        }
      });
      continue;
    }

    // 7. 水平分割线
    if (line.trim() === '---' || line.trim() === '***') {
      nodes.push({
        type: 'HORIZONTAL_RULE',
        horizontalRuleNode: {}
      });
      continue;
    }

    // 8. 普通文本段落 或 空行
    if (line.trim()) {
      nodes.push({
        type: 'PARAGRAPH',
        paragraphNode: {
          children: parseInlineElements(line)
        }
      });
    } else {
      nodes.push({
        type: 'LINE_BREAK'
      });
    }
  }

  return nodes;
}

// 解析行内元素：标签、链接、图片、加粗、代码等
function parseInlineElements(text: string): any[] {
  const nodes: any[] = [];
  let currentText = text;

  // 正则表达式定义
  const patterns = [
    // 图片: ![alt](url)
    { type: 'IMAGE', regex: /^!\[(.*?)\]\((.*?)\)/ },
    // 链接: [text](url)
    { type: 'LINK', regex: /^\[(.*?)\]\((.*?)\)/ },
    // 自动链接: http://...
    { type: 'AUTO_LINK', regex: /^(https?:\/\/[^\s]+)/ },
    // 标签: #tag (支持由非空白与非符号组成的标签)
    { type: 'TAG', regex: /^#([^\s#.,!?:;'"(){}\[\]]+)/ },
    // 行内代码: `code`
    { type: 'CODE', regex: /^`([^`]+)`/ },
    // 加粗: **text**
    { type: 'BOLD', regex: /^\*\*(.*?)\*\*/ },
    // 斜体: *text*
    { type: 'ITALIC', regex: /^\*(.*?)\*/ }
  ];

  while (currentText.length > 0) {
    let matched = false;

    // 尝试匹配所有模式
    for (const pattern of patterns) {
      const match = currentText.match(pattern.regex);
      if (match) {
        matched = true;

        switch (pattern.type) {
          case 'IMAGE':
            nodes.push({
              type: 'IMAGE',
              imageNode: { alt: match[1], url: match[2] }
            });
            break;
          case 'LINK':
            nodes.push({
              type: 'LINK',
              linkNode: { content: match[1], url: match[2] }
            });
            break;
          case 'AUTO_LINK':
            nodes.push({
              type: 'LINK', // 前端通常复用 LinkNode 渲染
              linkNode: { content: match[1], url: match[1] }
            });
            break;
          case 'TAG':
            nodes.push({
              type: 'TAG',
              tagNode: { content: match[1] }
            });
            break;
          case 'CODE':
            nodes.push({
              type: 'CODE',
              codeNode: { content: match[1] }
            });
            break;
          case 'BOLD':
            nodes.push({
              type: 'BOLD',
              boldNode: { content: match[1] }
            });
            break;
          case 'ITALIC':
            nodes.push({
              type: 'ITALIC',
              italicNode: { content: match[1] }
            });
            break;
        }

        currentText = currentText.substring(match[0].length);
        break; // 找到匹配后，跳出当前循环，开始下一轮匹配
      }
    }

    if (!matched) {
      // 如果没有匹配到特殊格式，则取第一个字符作为普通文本
      // 优化：为了性能，可以一次性取到下一个特殊字符之前
      // 这里为了简单，如果当前不是特殊字符起始，就取到下一个可能的其实位置
      const nextSpecialCharIndex = currentText.search(/[!\[#`*h]/); // h for https

      let plainText = "";
      if (nextSpecialCharIndex === -1) {
        plainText = currentText;
        currentText = "";
      } else if (nextSpecialCharIndex === 0) {
        // 虽然是特殊字符开头，但没匹配上正则（比如单独的 # 后面带空格），此时把这个字符当普通文本
        plainText = currentText[0];
        currentText = currentText.substring(1);
      } else {
        plainText = currentText.substring(0, nextSpecialCharIndex);
        currentText = currentText.substring(nextSpecialCharIndex);
      }

      // 合并相邻的 TEXT 节点
      const lastNode = nodes[nodes.length - 1];
      if (lastNode && lastNode.type === 'TEXT') {
        lastNode.textNode.content += plainText;
      } else {
        nodes.push({
          type: 'TEXT',
          textNode: { content: plainText }
        });
      }
    }
  }

  return nodes;
}

// 简化版节点还原为markdown
function restoreNodesToMarkdown(nodes: any[]): string {
  const lines: string[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case 'TASK_LIST_ITEM':
        if (node.taskListItemNode) {
          const indent = '  '.repeat(node.taskListItemNode.indent || 0);
          const checkbox = node.taskListItemNode.complete ? '[x]' : '[ ]';
          const content = extractTextFromChildren(node.taskListItemNode.children || []);
          lines.push(`${indent}- ${checkbox} ${content}`);
        }
        break;

      case 'UNORDERED_LIST_ITEM':
        if (node.unorderedListItemNode) {
          const indent = '  '.repeat(node.unorderedListItemNode.indent || 0);
          const content = extractTextFromChildren(node.unorderedListItemNode.children || []);
          lines.push(`${indent}- ${content}`);
        }
        break;

      case 'ORDERED_LIST_ITEM':
        if (node.orderedListItemNode) {
          const indent = '  '.repeat(node.orderedListItemNode.indent || 0);
          const content = extractTextFromChildren(node.orderedListItemNode.children || []);
          lines.push(`${indent}${node.orderedListItemNode.number}. ${content}`);
        }
        break;

      case 'CODE_BLOCK':
        if (node.codeBlockNode) {
          lines.push(`\`\`\`${node.codeBlockNode.language || ''}`);
          lines.push(node.codeBlockNode.content || '');
          lines.push('```');
        }
        break;

      case 'HEADING':
        if (node.headingNode) {
          const level = '#'.repeat(node.headingNode.level || 1);
          const content = extractTextFromChildren(node.headingNode.children || []);
          lines.push(`${level} ${content}`);
        }
        break;

      case 'PARAGRAPH':
        if (node.paragraphNode) {
          const content = extractTextFromChildren(node.paragraphNode.children || []);
          lines.push(content);
        }
        break;

      case 'TEXT':
        if (node.textNode) {
          lines.push(node.textNode.content || '');
        }
        break;

      case 'LINE_BREAK':
        lines.push('');
        break;

      default:
        // 对于其他类型，尝试提取文本内容
        if (node.textNode) {
          lines.push(node.textNode.content || '');
        }
        break;
    }
  }

  return lines.join('\n');
}

// 辅助函数：从children节点中提取文本内容
function extractTextFromChildren(children: any[]): string {
  if (!children) return '';
  return children.map(child => {
    if (child.textNode) return child.textNode.content;
    if (child.codeNode) return child.codeNode.content;
    if (child.linkNode) return child.linkNode.content;
    if (child.tagNode) return `#${child.tagNode.content}`;
    if (child.boldNode) return child.boldNode.content;
    if (child.italicNode) return child.italicNode.content;
    // 递归
    if (child.children) return extractTextFromChildren(child.children);
    return '';
  }).join('');
}

export const identityProviderServiceClient = {
  listIdentityProviders: () => Promise.resolve({ identityProviders: [] }),
  getIdentityProvider: (request: { name: string }) => Promise.resolve({
    name: request.name,
    type: 'OAUTH2',
    title: '',
    identifierFilter: '',
    config: undefined,
  }),
  createIdentityProvider: (request: { identityProvider: any }) => Promise.resolve(request.identityProvider),
  updateIdentityProvider: (request: { identityProvider: any }) => Promise.resolve(request.identityProvider),
  deleteIdentityProvider: (request: { name: string }) => Promise.resolve({}),
};
