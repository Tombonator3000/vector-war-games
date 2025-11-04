import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Building, 
  Vote,
  Factory,
  Shield
} from 'lucide-react';
import type { GovernanceMetrics } from '@/hooks/useGovernance';
import { calculateMoraleProductionMultiplier, calculateMoraleRecruitmentModifier } from '@/hooks/useGovernance';

interface GovernanceDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: GovernanceMetrics;
  nationName: string;
  instability: number;
  production: number;
  intel: number;
}

export function GovernanceDetailPanel({
  open,
  onOpenChange,
  metrics,
  nationName,
  instability,
  production,
  intel
}: GovernanceDetailPanelProps) {
  const productionMultiplier = calculateMoraleProductionMultiplier(metrics.morale);
  const recruitmentModifier = calculateMoraleRecruitmentModifier(metrics.morale);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-cyan-500/40 text-cyan-100 max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-cyan-300">
            {nationName} - Political Analysis
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <StabilityOverview 
              metrics={metrics} 
              instability={instability}
            />
            
            <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Current Effects
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <EffectCard
                  label="Production Efficiency"
                  value={`${(productionMultiplier * 100).toFixed(0)}%`}
                  description={`Base production × ${productionMultiplier.toFixed(2)}`}
                  trend={productionMultiplier >= 1 ? 'positive' : 'negative'}
                />
                <EffectCard
                  label="Recruitment Rate"
                  value={`${(recruitmentModifier * 100).toFixed(0)}%`}
                  description={`Military recruitment × ${recruitmentModifier.toFixed(2)}`}
                  trend={recruitmentModifier >= 1 ? 'positive' : 'negative'}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <MetricDetailCard
              icon={<Users className="h-5 w-5" />}
              title="National Morale"
              value={metrics.morale}
              description="Population's willingness to support war effort and work productively"
              breakdown={[
                { label: 'Affects production output', impact: `${(productionMultiplier * 100 - 100).toFixed(0)}%` },
                { label: 'Affects military recruitment', impact: `${(recruitmentModifier * 100 - 100).toFixed(0)}%` },
                { label: 'Risk of domestic unrest', impact: metrics.morale < 40 ? 'HIGH' : metrics.morale < 60 ? 'MEDIUM' : 'LOW' }
              ]}
            />

            <MetricDetailCard
              icon={<Users className="h-5 w-5" />}
              title="Public Opinion"
              value={metrics.publicOpinion}
              description="General population's approval of government policies and leadership"
              breakdown={[
                { label: 'Affects cabinet stability', impact: metrics.publicOpinion < 40 ? 'NEGATIVE' : 'STABLE' },
                { label: 'International legitimacy', impact: metrics.publicOpinion > 60 ? 'HIGH' : 'LOW' },
                { label: 'Protest risk', impact: metrics.publicOpinion < 35 ? 'CRITICAL' : 'NORMAL' }
              ]}
            />

            <MetricDetailCard
              icon={<Building className="h-5 w-5" />}
              title="Cabinet Approval"
              value={metrics.cabinetApproval}
              description="Political elite and ministers' support for current leadership"
              breakdown={[
                { label: 'Government stability', impact: metrics.cabinetApproval > 60 ? 'STRONG' : metrics.cabinetApproval > 40 ? 'MODERATE' : 'WEAK' },
                { label: 'Coup risk', impact: metrics.cabinetApproval < 30 ? 'HIGH' : 'LOW' },
                { label: 'Policy implementation', impact: metrics.cabinetApproval > 50 ? 'EFFECTIVE' : 'HINDERED' }
              ]}
            />

            <MetricDetailCard
              icon={<Vote className="h-5 w-5" />}
              title="Election Countdown"
              value={metrics.electionTimer}
              suffix=" turns"
              description="Time until next mandatory election cycle"
              breakdown={[
                { label: 'Democracy requirement', impact: 'ACTIVE' },
                { label: 'Campaign pressure', impact: metrics.electionTimer < 3 ? 'HIGH' : 'NORMAL' },
                { label: 'Policy constraints', impact: metrics.electionTimer < 5 ? 'INCREASED' : 'NORMAL' }
              ]}
            />
          </TabsContent>

          <TabsContent value="effects" className="space-y-4">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">Production Effects</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Base Production</span>
                  <span className="font-mono text-emerald-300">{production}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Morale Multiplier</span>
                  <span className="font-mono text-cyan-100">× {productionMultiplier.toFixed(2)}</span>
                </div>
                <div className="h-px bg-cyan-500/20" />
                <div className="flex justify-between items-center text-lg">
                  <span className="text-cyan-300 font-semibold">Effective Production</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round(production * productionMultiplier)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">Military Effects</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Base Recruitment Rate</span>
                  <span className="font-mono text-emerald-300">100%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Morale Modifier</span>
                  <span className="font-mono text-cyan-100">{(recruitmentModifier * 100).toFixed(0)}%</span>
                </div>
                <div className="h-px bg-cyan-500/20" />
                <div className="flex justify-between items-center">
                  <span className="text-cyan-200">Combat Effectiveness</span>
                  <Badge variant={metrics.morale > 60 ? 'default' : 'destructive'}>
                    {metrics.morale > 70 ? 'EXCELLENT' : metrics.morale > 50 ? 'GOOD' : metrics.morale > 30 ? 'POOR' : 'CRITICAL'}
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <RiskAssessment 
              metrics={metrics} 
              instability={instability}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface StabilityOverviewProps {
  metrics: GovernanceMetrics;
  instability: number;
}

function StabilityOverview({ metrics, instability }: StabilityOverviewProps) {
  const overallStability = (
    metrics.morale * 0.4 + 
    metrics.publicOpinion * 0.3 + 
    metrics.cabinetApproval * 0.3 - 
    instability * 0.5
  );
  
  const stabilityPercent = Math.max(0, Math.min(100, overallStability));
  
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-cyan-500/30 p-4">
      <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Overall Political Stability
      </h3>
      <Progress value={stabilityPercent} className="h-4 mb-2" />
      <div className="flex justify-between text-sm">
        <span className="text-cyan-200">Stability Index</span>
        <span className={`font-mono font-semibold ${
          stabilityPercent > 70 ? 'text-emerald-400' : 
          stabilityPercent > 40 ? 'text-yellow-400' : 
          'text-red-400'
        }`}>
          {stabilityPercent.toFixed(1)}%
        </span>
      </div>
    </Card>
  );
}

interface MetricDetailCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  suffix?: string;
  description: string;
  breakdown: Array<{ label: string; impact: string }>;
}

function MetricDetailCard({ icon, title, value, suffix = '%', description, breakdown }: MetricDetailCardProps) {
  const color = value >= 70 ? 'text-emerald-400' : value >= 50 ? 'text-cyan-300' : value >= 30 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <Card className="bg-slate-900/50 border-cyan-500/20 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-cyan-400">{icon}</div>
          <h4 className="text-base font-semibold text-cyan-300">{title}</h4>
        </div>
        <span className={`text-2xl font-mono font-bold ${color}`}>
          {suffix === '%' ? Math.round(value) : value}{suffix}
        </span>
      </div>
      <p className="text-sm text-cyan-200/70 mb-3">{description}</p>
      <Progress value={value} className="h-2 mb-3" />
      <div className="space-y-2">
        {breakdown.map((item, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-cyan-300/80">{item.label}</span>
            <Badge variant="outline" className="text-xs">
              {item.impact}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface EffectCardProps {
  label: string;
  value: string;
  description: string;
  trend: 'positive' | 'negative' | 'neutral';
}

function EffectCard({ label, value, description, trend }: EffectCardProps) {
  const trendIcon = trend === 'positive' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                     trend === 'negative' ? <TrendingDown className="h-4 w-4 text-red-400" /> : null;
  
  return (
    <div className="p-3 bg-slate-950/50 border border-cyan-500/10 rounded">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-cyan-300">{label}</span>
        {trendIcon}
      </div>
      <div className="text-2xl font-mono font-bold text-cyan-100">{value}</div>
      <div className="text-xs text-cyan-400/60 mt-1">{description}</div>
    </div>
  );
}

interface RiskAssessmentProps {
  metrics: GovernanceMetrics;
  instability: number;
}

function RiskAssessment({ metrics, instability }: RiskAssessmentProps) {
  const risks = [
    {
      title: 'Regime Change Risk',
      level: instability > 75 ? 'CRITICAL' : instability > 60 ? 'HIGH' : instability > 40 ? 'MODERATE' : 'LOW',
      description: instability > 75 
        ? 'Imminent danger of coup or revolution. Take immediate action!'
        : instability > 60 
        ? 'Political instability reaching dangerous levels'
        : 'Normal political fluctuations',
      severity: instability > 75 ? 'critical' : instability > 60 ? 'high' : instability > 40 ? 'medium' : 'low'
    },
    {
      title: 'Mass Protests Risk',
      level: metrics.publicOpinion < 30 ? 'CRITICAL' : metrics.publicOpinion < 45 ? 'HIGH' : 'LOW',
      description: metrics.publicOpinion < 30 
        ? 'Widespread civil unrest and protests likely'
        : metrics.publicOpinion < 45 
        ? 'Growing public dissatisfaction'
        : 'Public largely supportive',
      severity: metrics.publicOpinion < 30 ? 'critical' : metrics.publicOpinion < 45 ? 'high' : 'low'
    },
    {
      title: 'Military Coup Risk',
      level: metrics.cabinetApproval < 30 && metrics.morale < 30 ? 'CRITICAL' : metrics.cabinetApproval < 40 ? 'MODERATE' : 'LOW',
      description: metrics.cabinetApproval < 30 && metrics.morale < 30
        ? 'Military loyalty questionable. Coup possible!'
        : metrics.cabinetApproval < 40
        ? 'Political elite growing restless'
        : 'Cabinet maintains confidence',
      severity: metrics.cabinetApproval < 30 && metrics.morale < 30 ? 'critical' : metrics.cabinetApproval < 40 ? 'medium' : 'low'
    },
    {
      title: 'Economic Collapse Risk',
      level: metrics.morale < 30 ? 'HIGH' : metrics.morale < 50 ? 'MODERATE' : 'LOW',
      description: metrics.morale < 30
        ? 'Productivity crisis. Production severely impacted'
        : metrics.morale < 50
        ? 'Worker morale affecting efficiency'
        : 'Economy functioning normally',
      severity: metrics.morale < 30 ? 'high' : metrics.morale < 50 ? 'medium' : 'low'
    }
  ];

  return (
    <div className="space-y-3">
      {risks.map((risk, i) => (
        <Card 
          key={i}
          className={`p-4 ${
            risk.severity === 'critical' ? 'bg-red-950/30 border-red-500/40' :
            risk.severity === 'high' ? 'bg-orange-950/30 border-orange-500/40' :
            risk.severity === 'medium' ? 'bg-yellow-950/30 border-yellow-500/40' :
            'bg-slate-900/50 border-cyan-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${
                risk.severity === 'critical' ? 'text-red-400 animate-pulse' :
                risk.severity === 'high' ? 'text-orange-400' :
                risk.severity === 'medium' ? 'text-yellow-400' :
                'text-emerald-400'
              }`} />
              <h4 className="font-semibold text-cyan-200">{risk.title}</h4>
            </div>
            <Badge 
              variant="outline"
              className={
                risk.severity === 'critical' ? 'border-red-400 text-red-400' :
                risk.severity === 'high' ? 'border-orange-400 text-orange-400' :
                risk.severity === 'medium' ? 'border-yellow-400 text-yellow-400' :
                'border-emerald-400 text-emerald-400'
              }
            >
              {risk.level}
            </Badge>
          </div>
          <p className="text-sm text-cyan-200/80">{risk.description}</p>
        </Card>
      ))}
    </div>
  );
}
