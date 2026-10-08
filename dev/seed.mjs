import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const root = new URL('../', import.meta.url);
const credentials = JSON.parse(await readFile(new URL('.demo-credentials.json', root), 'utf8'));
const base = 'http://127.0.0.1:8888';
const marker = new URL('storage/demo-seeded.json', root);
try {
  await readFile(marker);
  console.log('Demo data already exists; no changes made.');
  process.exit(0);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

async function api(path, method = 'GET', body, token) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (response.status === 429 && attempt < 4) {
      console.log(`Waiting for the forum's posting rate limit: ${method} ${path}`);
      await delay(11000);
      continue;
    }
    if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text.slice(0, 1500)}`);
    return text ? JSON.parse(text) : null;
  }
}

const admin = await api('/api/token', 'POST', { identification: credentials.username, password: credentials.password });
const token = admin.token;
const existing = await api('/api/discussions', 'GET', undefined, token);
if (existing.data.length) throw new Error('Seed only runs on an empty demo forum.');
const tagDefinitions = [
  { name: '综合讨论', slug: 'general', color: '#5268ca', description: '交流想法，分享日常', isPrimary: true, icon: 'fas fa-comments' },
  { name: '产品与设计', slug: 'design', color: '#2b9583', description: '讨论产品体验与设计', isPrimary: true, icon: 'fas fa-palette' },
  { name: '隐私与匿名化', slug: 'privacy', color: '#9967b9', description: '了解账号匿名化和个人数据管理', isPrimary: true, icon: 'fas fa-user-shield' },
];
const currentTags = (await api('/api/tags', 'GET', undefined, token)).data;
const tags = [];
for (const [index, attributes] of tagDefinitions.entries()) {
  const current = currentTags[index];
  const result = await api(current ? `/api/tags/${current.id}` : '/api/tags', current ? 'PATCH' : 'POST',
    { data: { type: 'tags', ...(current ? { id: current.id } : {}), attributes } }, token);
  tags.push(result.data.id);
}
await api('/api/tags/order', 'POST', { order: tags.map(id => ({ id, children: [] })) }, token);

const members = [];
for (const username of ['lin', 'xiaoyu', 'privacydemo']) {
  const password = 'Demo!' + randomBytes(6).toString('hex');
  const result = await api('/api/users', 'POST', {
    data: { type: 'users', attributes: { username, email: `${username}@demo.invalid`, password, isEmailConfirmed: true } },
  }, token);
  const id = result.data.id;
  await api(`/api/users/${id}`, 'PATCH', { data: { type: 'users', id, attributes: { isEmailConfirmed: true } } }, token);
  const session = await api('/api/token', 'POST', { identification: username, password });
  members.push({ username, password, id, token: session.token });
}

const topics = [
  { title: '欢迎来到 ProjectSay：从一个问题开始', tag: 0, author: token, content: '欢迎来到这个小小的交流空间。\n\n你可以在这里提出问题、分享想法，或者回复别人的讨论。\n\n试试右上角登录，然后发起你的第一条讨论吧。', replies: ['界面很清爽，手机上看也很舒服。', '希望这里能成为一个可以慢慢交流的地方。'], sticky: true },
  { title: '你理想中的小社区是什么样的？', tag: 0, author: members[0].token, content: '比起信息流，我更喜欢能持续讨论同一个话题的地方。\n\n如果让你设计一个小社区，你最希望它保留什么功能？', replies: ['好用的搜索，以及简单清晰的分类。', '希望每条认真写的回复都能被看见。'] },
  { title: '一个轻量论坛，需要哪些核心功能？', tag: 1, author: members[1].token, content: '我的清单是：\n\n- 发帖和回复\n- 标签分类\n- 通知与搜索\n- 简单的管理工具\n\n你会增加哪一项？', replies: ['个人数据导出和账号匿名化也很实用。'] },
  { title: '账号匿名化之后，讨论还会留下吗？', tag: 2, author: token, content: '会。账号匿名化可以保留帖子与讨论，同时清除账号身份信息。\n\n管理员可以在用户菜单里选择 Erase / Anonymize user。用户设置里也有 Personal data 入口。\n\n匿名发帖是另一个功能；这个 demo 展示的是账号匿名化。', replies: ['这样既能保留讨论，也能处理退出社区的需求。'] },
  { title: '这是一条已匿名化账号留下的讨论', tag: 2, author: members[2].token, content: '这条内容来自一个专门用于演示的测试账号。\n\n账号匿名化后，帖子仍然存在，作者会显示为 Anonymous。', replies: [] },
  { title: '最近有什么值得分享的小发现？', tag: 0, author: members[0].token, content: '一个工具、一本书、一个新习惯都可以。\n\n最近开始把零散的想法整理成问题，比单纯收藏更有帮助。', replies: ['我开始每周回顾一次自己的笔记。'] },
];
const discussionIds = [];
for (const topic of topics) {
  const result = await api('/api/discussions', 'POST', { data: {
    type: 'discussions', attributes: { title: topic.title, content: topic.content },
    relationships: { tags: { data: [{ type: 'tags', id: tags[topic.tag] }] } },
  } }, topic.author);
  const id = result.data.id;
  discussionIds.push(id);
  for (const [index, content] of topic.replies.entries()) {
    await api('/api/posts', 'POST', { data: {
      type: 'posts', attributes: { content },
      relationships: { discussion: { data: { type: 'discussions', id } } },
    } }, members[index % 2].token);
  }
  if (topic.sticky) await api(`/api/discussions/${id}`, 'PATCH', { data: { type: 'discussions', id, attributes: { isSticky: true } } }, token);
}
await api(`/api/users/${members[2].id}`, 'DELETE', { gdprMode: 'anonymization' }, token);
await writeFile(marker, JSON.stringify({ discussionIds, anonymizedUserId: members[2].id }, null, 2));
await writeFile(new URL('.demo-credentials.json', root), JSON.stringify({
  ...credentials, members: members.slice(0, 2).map(({ username, password }) => ({ username, password })),
}, null, 2));
console.log(`Created ${topics.length} discussions and anonymized one demo account.`);
