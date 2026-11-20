// Stable editorial subcategory routes; they do not imply a data assignment.
export const channelTopics: Record<string, readonly { slug: string; zh: string; en: string }[]> = {
  'ai': [
    {slug:'model-releases',zh:'模型发布',en:'Model releases'}, {slug:'new-capabilities',zh:'新能力',en:'New capabilities'},
    {slug:'agents-automation',zh:'Agent 与自动化',en:'Agents and automation'}, {slug:'multimodal',zh:'多模态 AI',en:'Multimodal AI'},
    {slug:'ai-products-tools',zh:'AI 产品与工具',en:'AI products and tools'}, {slug:'ai-research',zh:'AI 研究突破',en:'AI research breakthroughs'},
    {slug:'work-society',zh:'AI和社会影响',en:'AI&Society'},
    {slug:'ai-created',zh:'AI 创作',en:'AI Created'},
  ],
  'robotics': [
    {slug:'humanoid-robots',zh:'人形机器人',en:'Humanoid robots'}, {slug:'industrial-robots',zh:'工业机器人',en:'Industrial robots'},
    {slug:'autonomous-driving',zh:'自动驾驶',en:'Autonomous driving'}, {slug:'drones',zh:'无人机',en:'Drones'},
    {slug:'embodied-ai',zh:'具身智能',en:'Embodied AI'}, {slug:'advanced-manufacturing',zh:'新型制造',en:'Advanced manufacturing'},
    {slug:'future-living',zh:'未来生活技术',en:'Future living technology'},
  ],
  'industry': [
    {slug:'company-news',zh:'公司动态',en:'Company news'}, {slug:'funding-acquisitions',zh:'融资与收购',en:'Funding and acquisitions'},
    {slug:'strategic-partnerships',zh:'战略合作',en:'Strategic partnerships'}, {slug:'industry-changes',zh:'产业变化',en:'Industry changes'},
    {slug:'corporate-announcements',zh:'企业发布',en:'Corporate announcements'}, {slug:'business-models',zh:'商业模式创新',en:'Business model innovation'},
  ],
  'technology': [
    {slug:'chips',zh:'芯片',en:'Chips'}, {slug:'semiconductors',zh:'半导体',en:'Semiconductors'},
    {slug:'new-materials',zh:'新材料',en:'New materials'}, {slug:'energy',zh:'能源',en:'Energy'},
    {slug:'biotechnology',zh:'生物科技',en:'Biotechnology'}, {slug:'spaceflight',zh:'航天',en:'Spaceflight'},
    {slug:'scientific-research',zh:'科学研究',en:'Scientific research'}, {slug:'engineering',zh:'工程突破',en:'Engineering breakthroughs'},
    {slug:'brain-computer-interfaces',zh:'脑科学与脑机接口',en:'Brain science and brain-computer interfaces'},
  ],
  'internet': [
    {slug:'internet-culture',zh:'互联网文化',en:'Internet culture'}, {slug:'security-incidents',zh:'安全事件',en:'Security incidents'},
    {slug:'major-vulnerabilities',zh:'重大漏洞',en:'Major vulnerabilities'}, {slug:'platform-changes',zh:'平台变化',en:'Platform changes'},
    {slug:'online-phenomena',zh:'网络现象',en:'Online phenomena'}, {slug:'unexpected-tech-events',zh:'意外技术事件',en:'Unexpected technology events'},
    {slug:'internet-weirdness',zh:'互联网烂事',en:'Internet Weirdness'},
    {slug:'life-is-game',zh:'人生如游戏',en:'Life is game'},
  ],
  'products': [
    {slug:'new-products',zh:'新产品',en:'New products'}, {slug:'new-tools',zh:'新工具',en:'New tools'},
    {slug:'new-websites',zh:'新网站',en:'New websites'}, {slug:'indie-projects',zh:'独立开发项目',en:'Independent projects'},
    {slug:'open-source',zh:'开源项目',en:'Open-source projects'}, {slug:'breakthrough-apps',zh:'突破性体验应用',en:'Breakthrough applications'},
    {slug:'grassroots-inventions',zh:'民间发明与草根创造',en:'Grassroots inventions and creations'},
  ],
};
