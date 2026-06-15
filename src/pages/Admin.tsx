import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import {
  Diamond, Users, ShoppingBag, BarChart3, Activity,
  Loader2, ArrowLeft, TrendingUp, DollarSign, Package,
  Bot, Settings, Cloud, PlayCircle, Plus, Edit,
  Eye, Database, Zap, Shield, Terminal, ChevronDown, X
} from 'lucide-react'

interface AgentProject {
  projectId: string;
  name: string;
  description: string;
  mode: string;
  priority: number;
  cycleBudgetMinutes: number;
  verificationCommand: string;
  handsOff: string[];
  engineerCommand: string;
  model: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentTask {
  taskId: string;
  projectId: string;
  title: string;
  status: string;
  priority: number;
  interactiveOnly: boolean;
  expectedTouches: string;
  description: string;
  assignedAgent: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

interface AgentCycle {
  cycleId: string;
  projectId: string;
  taskId: string;
  status: string;
  outcome: string;
  engineerOutput: string;
  verificationOutput: string;
  reviewOutput: string;
  reviewVerdict: string;
  durationSeconds: number;
  scopeDriftFiles: string;
  handsOffViolations: string;
  silentFailures: string;
  createdAt: Date;
  completedAt: Date | null;
}

interface FleetState {
  projectId: string;
  totalCycles: number;
  totalVerified: number;
  totalFailed: number;
  accumulatedMinutes: number;
  lastCycleAt: Date | null;
  lastCycleOutcome: string | null;
}

export default function Admin() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'cloudflare' | 'users'>('overview')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [showCreateTask, setShowCreateTask] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 2, interactiveOnly: false, expectedTouches: '', assignedAgent: '' })
  const [cloudflareDeploying, setCloudflareDeploying] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/')
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate])

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin })
  const { data: agentProjects, isLoading: projectsLoading } = trpc.admin.listAgentProjects.useQuery(undefined, { enabled: isAdmin })
  const { data: cloudflareStatus, isLoading: cfLoading } = trpc.admin.cloudflareStatus.useQuery(undefined, { enabled: isAdmin })
  
  // Mutations
  const updateProject = trpc.admin.updateAgentProject.useMutation({
    onSuccess: () => trpc.admin.listAgentProjects.invalidate()
  })
  const createTask = trpc.admin.createAgentTask.useMutation({
    onSuccess: (_, vars) => {
      trpc.admin.getAgentProject.invalidate({ projectId: vars.projectId })
      trpc.admin.listAgentProjects.invalidate()
      setShowCreateTask(null)
      setNewTask({ title: '', description: '', priority: 2, interactiveOnly: false, expectedTouches: '', assignedAgent: '' })
    }
  })
  const runCycle = trpc.admin.runAgentCycle.useMutation()
  const deployCf = trpc.admin.cloudflareDeploy.useMutation({
    onSuccess: () => setCloudflareDeploying(false)
  })

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  if (!isAdmin) return null

  const statCards = [
    { label: 'Total Users', value: stats?.counts.users || 0, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Listings', value: stats?.counts.listings || 0, icon: <Package className="w-5 h-5" />, color: 'text-[#C9A84C]' },
    { label: 'Appraisals', value: stats?.counts.appraisals || 0, icon: <BarChart3 className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Transactions', value: stats?.counts.transactions || 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: 'AI Agent Runs', value: stats?.counts.agentRuns || 0, icon: <Activity className="w-5 h-5" />, color: 'text-orange-400' },
    { label: 'Revenue', value: `$${(stats?.revenue || 0).toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: 'text-[#FFD97A]' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[#080808]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#C8BC98] hover:text-[#C9A84C] transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Site
            </Link>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#F5EED8] tracking-[4px]">
              Admin Dashboard
            </h1>
          </div>
          <div className="w-10 h-10 border border-[#C9A84C] rotate-45 flex items-center justify-center">
            <Diamond className="w-4 h-4 text-[#C9A84C] -rotate-45" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-[#C9A84C]/15">
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'agents', label: 'Agent Config', icon: <Bot className="w-4 h-4" /> },
            { id: 'cloudflare', label: 'Cloudflare', icon: <Cloud className="w-4 h-4" /> },
            { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[2px] uppercase font-cinzel font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#C9A84C] text-[#C9A84C]'
                  : 'border-transparent text-[#8A6E2F] hover:text-[#C9A84C]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statCards.map((card) => (
                <div key={card.label} className="bg-[#161616] border border-[#C9A84C]/15 p-5 hover:border-[#C9A84C]/40 transition-all">
                  <div className={`${card.color} mb-3`}>{card.icon}</div>
                  <div className="font-cinzel text-lg font-bold text-[#F5EED8] mb-1">{card.value}</div>
                  <div className="text-[8px] tracking-[2px] uppercase text-[#8A6E2F]">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#161616] border border-[#C9A84C]/15 p-6">
                <h2 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className="p-4 bg-[#1E1E1E] border border-[#C9A84C]/20 text-left hover:border-[#C9A84C]/50 transition-all text-center"
                  >
                    <Bot className="w-6 h-6 text-[#C9A84C] mx-auto mb-2" />
                    <div className="font-cinzel text-xs text-[#F5EED8]">Configure Agents</div>
                    <div className="text-[9px] text-[#8A6E2F]">12 agents available</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('cloudflare')}
                    className="p-4 bg-[#1E1E1E] border border-[#C9A84C]/20 text-left hover:border-[#C9A84C]/50 transition-all text-center"
                  >
                    <Cloud className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="font-cinzel text-xs text-[#F5EED8]">Cloudflare</div>
                    <div className="text-[9px] text-[#8A6E2F]">Deploy & Bindings</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-4 bg-[#1E1E1E] border border-[#C9A84C]/20 text-left hover:border-[#C9A84C]/50 transition-all text-center"
                  >
                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="font-cinzel text-xs text-[#F5EED8]">Manage Users</div>
                    <div className="text-[9px] text-[#8A6E2F]">{stats?.counts.users || 0} registered</div>
                  </button>
                  <button
                    onClick={() => trpc.admin.cloudflareDeploy.mutate({ projectName: 'thevault' })}
                    className="p-4 bg-[#1E1E1E] border border-[#C9A84C]/20 text-left hover:border-[#C9A84C]/50 transition-all text-center"
                  >
                    <PlayCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <div className="font-cinzel text-xs text-[#F5EED8]">Trigger Deploy</div>
                    <div className="text-[9px] text-[#8A6E2F]">Git-based build</div>
                  </button>
                </div>
              </div>

              <div className="bg-[#161616] border border-[#C9A84C]/15 p-6">
                <h2 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Platform Health
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#C9A84C]/10">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-[#F5EED8]">D1 Database</span>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] tracking-[1px]">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#C9A84C]/10">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#C9A84C]" />
                      <span className="text-xs text-[#F5EED8]">Edge Functions</span>
                    </div>
                    <span className="px-2 py-1 bg-[#C9A84C]/10 text-[#C9A84C] text-[9px] tracking-[1px]">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#C9A84C]/10">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-[#F5EED8]">Agent Fleet</span>
                    </div>
                    <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-[9px] tracking-[1px]">
                      {agentProjects?.filter(p => p.active).length || 0}/{agentProjects?.length || 0} Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#C9A84C]/10">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-[#F5EED8]">Cloudflare Pages</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[9px] tracking-[1px]">
                      {cloudflareStatus?.configured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-lg font-semibold tracking-[3px] text-[#C9A84C] uppercase flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Agent Configuration
              </h2>
              <div className="text-xs text-[#8A6E2F]">
                {agentProjects?.length || 0} projects configured
              </div>
            </div>

            {(projectsLoading || !agentProjects) ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {agentProjects.map((project: AgentProject) => (
                  <AgentProjectCard
                    key={project.projectId}
                    project={project}
                    editingProjectId={editingProjectId}
                    setEditingProjectId={setEditingProjectId}
                    updateProject={updateProject.mutateAsync}
                    showCreateTask={showCreateTask}
                    setShowCreateTask={setShowCreateTask}
                    newTask={newTask}
                    setNewTask={setNewTask}
                    createTask={createTask.mutate}
                    runCycle={runCycle.mutate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLOUDFLARE TAB */}
        {activeTab === 'cloudflare' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-lg font-semibold tracking-[3px] text-[#C9A84C] uppercase flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Cloudflare Management
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cloudflare Status */}
              <div className="bg-[#161616] border border-[#C9A84C]/15 p-6">
                <h3 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Cloudflare API Status
                </h3>
                
                {cfLoading ? (
                  <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin mx-auto" />
                ) : cloudflareStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#C9A84C]/10 rounded">
                      <div>
                        <div className="font-cinzel text-xs text-[#F5EED8]">API Configured</div>
                        <div className="text-[9px] text-[#8A6E2F]">
                          {cloudflareStatus.configured ? 'CLOUDFLARE_API_TOKEN is set' : 'Token not configured in environment'}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-[9px] tracking-[1px] ${
                        cloudflareStatus.configured 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {cloudflareStatus.configured ? 'ACTIVE' : 'MISSING'}
                      </span>
                    </div>

                    {cloudflareStatus.projects && (
                      <div>
                        <div className="font-cinzel text-xs text-[#C9A84C] mb-2">Pages Projects</div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {cloudflareStatus.projects.map((proj: any) => (
                            <div key={proj.name} className="p-3 bg-[#1E1E1E] border border-[#C9A84C]/10 rounded flex items-center justify-between">
                              <div>
                                <div className="font-cinzel text-xs text-[#F5EED8]">{proj.name}</div>
                                <div className="text-[9px] text-[#8A6E2F]">{proj.subdomain}.pages.dev</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-[#8A6E2F]">Prod: {proj.production_branch}</div>
                                <div className="text-[9px] text-[#8A6E2F]">Preview: {proj.preview_branch_includes?.join(', ') || 'all'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#8A6E2F]">
                    Unable to fetch Cloudflare status
                  </div>
                )}
              </div>

              {/* Deploy & Bindings */}
              <div className="bg-[#161616] border border-[#C9A84C]/15 p-6">
                <h3 className="font-cinzel text-xs font-semibold tracking-[3px] text-[#C9A84C] uppercase mb-4 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Deploy & Bindings
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="font-cinzel text-xs text-[#C9A84C] mb-3">Trigger New Deployment</div>
                    <p className="text-xs text-[#8A6E2F] mb-4">This will trigger a new build from the latest Git commit on master branch.</p>
                    <button
                      onClick={() => { setCloudflareDeploying(true); deployCf({ projectName: 'thevault' }) }}
                      disabled={cloudflareDeploying}
                      className="w-full py-3 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {cloudflareDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Deploy to Cloudflare Pages
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-[#C9A84C]/15 pt-6">
                    <div className="font-cinzel text-xs text-[#C9A84C] mb-3">D1 Database Bindings</div>
                    <p className="text-xs text-[#8A6E2F] mb-4">Configured in wrangler.toml - applied on Git-based deployments.</p>
                    <div className="bg-[#1E1E1E] border border-[#C9A84C]/10 p-4 font-mono text-xs text-[#C8BC98] space-y-1">
                      <div>binding = "DB"</div>
                      <div>database_name = "thevault-db"</div>
                      <div className="text-[#8A6E2F]">database_id = "375949ce-7c7d-4822-8235-461446769258"</div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded text-xs text-amber-400">
                      <strong>Note:</strong> D1 bindings must be added in Cloudflare Dashboard → Pages → Settings → Functions → D1 database bindings
                    </div>
                  </div>

                  <div className="border-t border-[#C9A84C]/15 pt-6">
                    <div className="font-cinzel text-xs text-[#C9A84C] mb-3">Environment Variables</div>
                    <div className="bg-[#1E1E1E] border border-[#C9A84C]/10 p-4 font-mono text-xs text-[#C8BC98] space-y-1 max-h-64 overflow-y-auto">
                      {[
                        'APP_SECRET', 'CLERK_SECRET_KEY', 'CLERK_WEBHOOK_SIGNING_SECRET', 
                        'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'OPENAI_API_KEY',
                        'VAULT_DOMAIN', 'CLOUDFLARE_API_TOKEN'
                      ].map(key => (
                        <div key={key} className="flex justify-between">
                          <span>{key}</span>
                          <span className={process.env[key] ? 'text-emerald-400' : 'text-red-400'}>
                            {process.env[key] ? '● SET' : '○ MISSING'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-lg font-semibold tracking-[3px] text-[#C9A84C] uppercase flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </h2>
              <div className="text-xs text-[#8A6E2F]">
                {stats?.counts.users || 0} total users
              </div>
            </div>

            <div className="bg-[#161616] border border-[#C9A84C]/15 p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#C9A84C]/15 text-left">
                      <th className="pb-3 font-cinzel text-xs tracking-[2px] text-[#C9A84C]">ID</th>
                      <th className="pb-3 font-cinzel text-xs tracking-[2px] text-[#C9A84C]">Name</th>
                      <th className="pb-3 font-cinzel text-xs tracking-[2px] text-[#C9A84C]">Email</th>
                      <th className="pb-3 font-cinzel text-xs tracking-[2px] text-[#C9A84C]">Role</th>
                      <th className="pb-3 font-cinzel text-xs tracking-[2px] text-[#C9A84C]">Created</th>
                      <th className="pb-3 font-cinzel text-xs tracking-[2px] text-[#C9A84C]">Last Sign In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentListings || []).slice(0, 10).map((user: any) => (
                      <tr key={user.id} className="border-b border-[#C9A84C]/10 hover:bg-[#1E1E1E]">
                        <td className="py-3 text-xs text-[#8A6E2F] font-mono">{user.id}</td>
                        <td className="py-3 text-xs text-[#F5EED8]">{user.name || '—'}</td>
                        <td className="py-3 text-xs text-[#C8BC98] font-mono">{user.email || '—'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-[8px] tracking-[1px] ${
                            user.role === 'admin' 
                              ? 'bg-[#C9A84C]/10 text-[#C9A84C]' 
                              : 'bg-[#8A6E2F]/10 text-[#8A6E2F]'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-[#8A6E2F]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 text-xs text-[#8A6E2F]">
                          {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-center text-xs text-[#8A6E2F]">
                  Showing recent users. Full user list requires listUsers endpoint.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentProjectCard({
  project,
  editingProjectId,
  setEditingProjectId,
  updateProject,
  showCreateTask,
  setShowCreateTask,
  newTask,
  setNewTask,
  createTask,
  runCycle,
}: {
  project: AgentProject;
  editingProjectId: string | null;
  setEditingProjectId: (id: string | null) => void;
  updateProject: (input: any) => Promise<any>;
  showCreateTask: string | null;
  setShowCreateTask: (id: string | null) => void;
  newTask: { title: string; description: string; priority: number; interactiveOnly: boolean; expectedTouches: string; assignedAgent: string };
  setNewTask: (task: typeof newTask) => void;
  createTask: (input: any) => void;
  runCycle: (input: any) => void;
}) {
  const [expanded, setExpanded] = useState(false)

  const handsOffArray = (() => {
    try { return JSON.parse(project.handsOff ?? '[]') } catch { return [] }
  })()

  if (editingProjectId === project.projectId) {
    return (
      <div className="bg-[#161616] border border-[#C9A84C]/30 p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cinzel text-xs tracking-[2px] text-[#C9A84C]">Editing {project.name}</h3>
          <button
            onClick={() => setEditingProjectId(null)}
            className="p-1 text-[#8A6E2F] hover:text-[#C9A84C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <AgentProjectForm
          project={project}
          onSave={async (data) => {
            await updateProject({ projectId: project.projectId, ...data })
            setEditingProjectId(null)
          }}
          onCancel={() => setEditingProjectId(null)}
        />
      </div>
    )
  }

  return (
    <div className={`bg-[#161616] border ${expanded ? 'border-[#C9A84C]/30' : 'border-[#C9A84C]/15'} p-4 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${project.active ? 'bg-emerald-500/10 border border-emerald-500/25' : 'bg-red-500/10 border border-red-500/25'}`}>
            <Bot className={`w-5 h-5 ${project.active ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-cinzel text-sm font-semibold text-[#F5EED8] truncate">{project.name}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[7px] tracking-[1px] ${
                project.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {project.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-[10px] text-[#8A6E2F] truncate">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-[#8A6E2F] hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 rounded transition-all"
            title="Expand"
          >
            <ChevronDown className={`w-4 h-4 ${expanded ? 'rotate-180' : ''} transition-transform`} />
          </button>
          <button
            onClick={() => setEditingProjectId(project.projectId)}
            className="p-1.5 text-[#8A6E2F] hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 rounded transition-all"
            title="Edit Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
        <div className="p-2 bg-[#1E1E1E] border border-[#C9A84C]/10 rounded">
          <div className="font-cinzel text-lg text-[#C9A84C]">{project.priority}</div>
          <div className="text-[7px] tracking-[1px] text-[#8A6E2F]">Priority</div>
        </div>
        <div className="p-2 bg-[#1E1E1E] border border-[#C9A84C]/10 rounded">
          <div className="font-cinzel text-lg text-[#C9A84C]">{project.cycleBudgetMinutes}m</div>
          <div className="text-[7px] tracking-[1px] text-[#8A6E2F]">Budget</div>
        </div>
        <div className="p-2 bg-[#1E1E1E] border border-[#C9A84C]/10 rounded">
          <div className="font-cinzel text-lg text-[#C9A84C]">{project.mode}</div>
          <div className="text-[7px] tracking-[1px] text-[#8A6E2F]">Mode</div>
        </div>
        <div className="p-2 bg-[#1E1E1E] border border-[#C9A84C]/10 rounded">
          <div className="font-cinzel text-lg text-[#C9A84C]">{project.model}</div>
          <div className="text-[7px] tracking-[1px] text-[#8A6E2F]">Model</div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#C9A84C]/10 space-y-4 animate-slide-down">
          {/* Verification Command */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-cinzel text-[8px] tracking-[2px] text-[#C9A84C]">Verification Command</span>
              <span className="text-[8px] text-[#8A6E2F]">AI validation rule</span>
            </div>
            <div className="bg-[#1E1E1E] border border-[#C9A84C]/10 p-3 text-xs text-[#C8BC98] font-mono max-h-24 overflow-y-auto">
              {project.verificationCommand || 'Not set'}
            </div>
          </div>

          {/* Hands Off */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-cinzel text-[8px] tracking-[2px] text-[#C9A84C]">Protected Paths (Hands Off)</span>
              <span className="text-[8px] text-[#8A6E2F]">{handsOffArray.length} paths</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {handsOffArray.length === 0 ? (
                <span className="text-[9px] text-[#8A6E2F]">None configured</span>
              ) : (
                handsOffArray.map((path: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] rounded">
                    {path}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Engineer Command Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-cinzel text-[8px] tracking-[2px] text-[#C9A84C]">Engineer Prompt (Preview)</span>
              <span className="text-[8px] text-[#8A6E2F]">{project.engineerCommand?.length || 0} chars</span>
            </div>
            <div className="bg-[#1E1E1E] border border-[#C9A84C]/10 p-3 text-xs text-[#C8BC98] max-h-32 overflow-y-auto whitespace-pre-wrap">
              {project.engineerCommand?.slice(0, 300) || 'Using default from agent-prompts.ts'}
              {(project.engineerCommand?.length || 0) > 300 && '...'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#C9A84C]/10">
            <button
              onClick={() => { setShowCreateTask(project.projectId); setNewTask({ title: '', description: '', priority: 2, interactiveOnly: false, expectedTouches: '', assignedAgent: '' }) }}
              className="flex-1 min-w-[120px] py-2 px-3 bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#C9A84C] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Task
            </button>
            <button
              onClick={() => runCycle({ projectId: project.projectId })}
              className="flex-1 min-w-[120px] py-2 px-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-[#080808] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-1"
            >
              <PlayCircle className="w-3 h-3" />
              Run Cycle
            </button>
            <button
              onClick={() => setEditingProjectId(project.projectId)}
              className="flex-1 min-w-[120px] py-2 px-3 bg-[#1E1E1E] border border-[#8A6E2F]/20 text-[#8A6E2F] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:border-[#8A6E2F]/50 hover:bg-[#8A6E2F]/5 transition-all flex items-center justify-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Edit Config
            </button>
          </div>
        </div>
      )}

      {/* Create Task Form */}
      {showCreateTask === project.projectId && (
        <div className="mt-4 pt-4 border-t border-[#C9A84C]/10 animate-slide-down bg-[#1E1E1E] p-3 rounded">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full bg-[#161616] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
            />
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={2}
              className="w-full bg-[#161616] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                className="bg-[#161616] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
              >
                <option value={1}>Priority 1 - Highest</option>
                <option value={2}>Priority 2 - High</option>
                <option value={3}>Priority 3 - Normal</option>
                <option value={4}>Priority 4 - Low</option>
                <option value={5}>Priority 5 - Lowest</option>
              </select>
              <input
                type="text"
                placeholder="Assigned Agent (optional)"
                value={newTask.assignedAgent}
                onChange={(e) => setNewTask({ ...newTask, assignedAgent: e.target.value })}
                className="bg-[#161616] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
              />
            </div>
            <input
              type="text"
              placeholder="Expected Touches (comma-separated file paths)"
              value={newTask.expectedTouches}
              onChange={(e) => setNewTask({ ...newTask, expectedTouches: e.target.value })}
              className="w-full bg-[#161616] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowCreateTask(null); setNewTask({ title: '', description: '', priority: 2, interactiveOnly: false, expectedTouches: '', assignedAgent: '' }) }}
                className="px-3 py-1.5 bg-[#161616] border border-[#8A6E2F]/20 text-[#8A6E2F] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:border-[#8A6E2F]/50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newTask.title.trim()) return
                  createTask({
                    projectId: project.projectId,
                    title: newTask.title,
                    description: newTask.description,
                    priority: newTask.priority,
                    interactiveOnly: newTask.interactiveOnly,
                    expectedTouches: newTask.expectedTouches.split(',').map(s => s.trim()).filter(Boolean),
                    assignedAgent: newTask.assignedAgent || undefined,
                  })
                }}
                disabled={!newTask.title.trim()}
                className="px-3 py-1.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:shadow-[0_0_20px_rgba(201,168,76,0.4)] disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentProjectForm({ project, onSave, onCancel }: { project: AgentProject; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    active: project.active,
    priority: project.priority,
    cycleBudgetMinutes: project.cycleBudgetMinutes,
    verificationCommand: project.verificationCommand,
    handsOff: project.handsOff,
    engineerCommand: project.engineerCommand,
    model: project.model,
  })

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      <div>
        <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
        />
      </div>
      <div>
        <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Priority (1-5)</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
          >
            <option value={1}>1 - Highest</option>
            <option value={2}>2 - High</option>
            <option value={3}>3 - Normal</option>
            <option value={4}>4 - Low</option>
            <option value={5}>5 - Lowest</option>
          </select>
        </div>
        <div>
          <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Cycle Budget (min)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={form.cycleBudgetMinutes}
            onChange={(e) => setForm({ ...form, cycleBudgetMinutes: Number(e.target.value) })}
            className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Model</label>
          <select
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
          >
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>
        <div>
          <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Active</label>
          <select
            value={form.active.toString()}
            onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
            className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Verification Command</label>
        <textarea
          value={form.verificationCommand}
          onChange={(e) => setForm({ ...form, verificationCommand: e.target.value })}
          rows={3}
          className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
        />
      </div>
      <div>
        <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Hands Off (JSON array)</label>
        <textarea
          value={form.handsOff}
          onChange={(e) => setForm({ ...form, handsOff: e.target.value })}
          rows={2}
          className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C] font-mono text-xs"
          placeholder='["users", "payments", "auth"]'
        />
      </div>
      <div>
        <label className="block text-[8px] tracking-[2px] uppercase text-[#C9A84C] mb-1">Engineer Command (Prompt)</label>
        <textarea
          value={form.engineerCommand}
          onChange={(e) => setForm({ ...form, engineerCommand: e.target.value })}
          rows={4}
          className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-2 px-3 outline-none focus:border-[#C9A84C]"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 bg-[#1E1E1E] border border-[#8A6E2F]/20 text-[#8A6E2F] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:border-[#8A6E2F]/50">
          Cancel
        </button>
        <button onClick={() => onSave(form)} className="px-4 py-2 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] text-[9px] tracking-[1px] uppercase font-cinzel rounded hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]">
          Save Changes
        </button>
      </div>
    </div>
  )
}