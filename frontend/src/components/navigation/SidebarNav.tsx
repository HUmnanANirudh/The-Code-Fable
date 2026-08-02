import { Link, useRouterState, useParams } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  Search, 
  Network, 
  Skull, 
  Map, 
  BookOpen, 
  Plus,
  GitBranch,
  HeartPulse,
  Settings2
} from "lucide-react";
import { Button } from "../../components/ui/button";

export function SidebarNav() {
  const routerState = useRouterState();
  const params = useParams({ strict: false });
  const repoId = (params as any)?.repoId;

  if (!repoId) {
    return null; // or a different sidebar for non-repo context
  }

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, path: `/repositories/${repoId}` },
    { label: "Search", icon: Search, path: `/repositories/${repoId}/search` },
    { label: "Architecture", icon: Network, path: `/repositories/${repoId}/architecture` },
    { label: "Dependencies", icon: GitBranch, path: `/repositories/${repoId}/dependencies` },
    { label: "Health Dashboard", icon: HeartPulse, path: `/repositories/${repoId}/health` },
    { label: "Dead Code", icon: Skull, path: `/repositories/${repoId}/dead-code` },
    { label: "Guided Tour", icon: Map, path: `/repositories/${repoId}/guided-tour` },
    { label: "Onboarding Docs", icon: BookOpen, path: `/repositories/${repoId}/onboarding` },
    { label: "Settings", icon: Settings2, path: `/repositories/${repoId}/settings` },
  ];

  return (
    <aside className="w-64 border-r border-border bg-[#151618] text-[#f4f4f5] flex flex-col transition-all">
      <div className="h-14 flex items-center px-4 mb-2">
        <div className="flex items-center gap-2 font-semibold tracking-tight text-sm">
          <div className="w-5 h-5 bg-primary rounded-[4px] flex items-center justify-center text-[10px] text-white">C</div>
          CodePilot
        </div>
      </div>
      
      <div className="px-3 mb-4">
        <Link to="/">
          <Button variant="outline" className="w-full justify-start gap-2 h-8 text-xs font-medium bg-[#1f2023] border-[#2c2d2f] hover:bg-[#27282b] hover:text-white text-[#8a8f98]">
            <Plus className="w-3.5 h-3.5" />
            New Repository
          </Button>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <div className="px-3 py-1 mb-1 text-[11px] font-medium text-[#8a8f98] uppercase tracking-wider">Workspace</div>
        {navItems.map((item) => {
          const isActive = routerState.location.pathname === item.path || routerState.location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                isActive 
                  ? "bg-[#27282b] text-white" 
                  : "text-[#8a8f98] hover:text-[#f4f4f5] hover:bg-[#1f2023]"
              }`}>
                <Icon className="w-4 h-4 opacity-70" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
