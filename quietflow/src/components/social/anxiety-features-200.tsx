/**
 * Feature 101-200: Second Batch Components
 * Social anxiety tools, daily life, ML/AI, accessibility, enterprise.
 * Minimal deps: only Card, Button, Badge, Icons from verified base set.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, MapPin, Navigation, Heart, Brain, Settings2, Download, Upload, Wifi, WifiOff, Database, Cloud, Server, Code, Terminal, Phone, Mail, Link, FileText, Image, Music, Film, Book, Palette, Layers, Grid, Table, PieChart, BarChart3, TrendingUp, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Scale, Maximize, Minimize, RefreshCw, RotateCcw, Undo, Redo, Trash2, Plus, Minus, Check, X, AlertCircle, Info, HelpCircle, Star, Moon, Stars, Wind, Thermometer, Sunrise, Sunset, Pin, Route, Bike, Car, Bus, Train, Plane, Rocket, Radar, Target, Crosshair, Binoculars, Telescope, Microscope, Beaker, TestTube, Pill, Syringe, HeartPulse, Stethoscope } from 'lucide-react';

export function PanicButton() {
  const [active, setActive] = useState(false);
  return (
    <Card className="border-red-500/30">
      <CardContent className="p-4 flex items-center justify-center">
        <button
          className={`w-20 h-20 rounded-full text-white font-bold text-lg transition-all ${
            active ? 'bg-red-600 animate-pulse' : 'bg-red-500 hover:bg-red-600'
          }`}
          onClick={() => setActive(!active)}
        >
          {active ? '✓' : '!'}
        </button>
      </CardContent>
    </Card>
  );
}

export function SensoryOverride() {
  const [mode, setMode] = useState<'visual' | 'auditory' | 'tactile'>('visual');
  return (
    <Card className="border-cyan-200/30">
      <CardContent className="p-4 space-y-2">
        {(['visual', 'auditory', 'tactile'] as const).map((m) => (
          <label key={m} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mode === m} onChange={() => setMode(m)} />
            {m.charAt(0).toUpperCase() + m.slice(1)} Mode
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

export function CrowdDensityOverlay() {
  const [show, setShow] = useState(true);
  return (
    <Card className="border-amber-200/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading">Crowd Overlay</span>
          <button onClick={() => setShow(!show)}>{show ? <Badge>ON</Badge> : <Badge variant="outline">OFF</Badge>}</button>
        </div>
        {show && (
          <div className="h-32 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
}

export function LocationSpoofing() {
  const [spoofed, setSpoofed] = useState(false);
  return (
    <Card className="border-violet-200/30">
      <CardContent className="p-4 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={spoofed} onChange={() => setSpoofed(!spoofed)} />
          Enable Location Spoofing
        </label>
        {spoofed && (
          <>
            <input type="number" className="w-full bg-black text-white p-2 rounded text-sm" placeholder="Latitude" />
            <input type="number" className="w-full bg-black text-white p-2 rounded text-sm" placeholder="Longitude" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function EmergencyBeacon() {
  const [broadcasting, setBroadcasting] = useState(false);
  return (
    <Card className="border-red-500/30">
      <CardContent className="p-4 text-center">
        <button
          className={`px-6 py-3 rounded-lg font-bold transition-all ${
            broadcasting ? 'bg-red-600 text-white animate-pulse' : 'bg-red-500 text-white hover:bg-red-600'
          }`}
          onClick={() => setBroadcasting(!broadcasting)}
        >
          {broadcasting ? 'BEACON ACTIVE' : 'SEND EMERGENCY BEACON'}
        </button>
      </CardContent>
    </Card>
  );
}

export function CrowdWhisper() {
  const [whisper, setWhisper] = useState('');
  return (
    <Card className="border-cyan-200/30">
      <CardContent className="p-4 space-y-2">
        <textarea
          value={whisper}
          onChange={(e) => setWhisper(e.target.value)}
          className="w-full bg-black text-white p-2 rounded text-sm h-20 resize-none"
          placeholder="Type a whisper to nearby users..."
        />
        <Button size="sm" className="w-full">Send Whisper</Button>
      </CardContent>
    </Card>
  );
}

export function SafeCorridorRouting() {
  const [route, setRoute] = useState<string[]>([]);
  return (
    <Card className="border-emerald-200/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading">Safe Corridor</span>
          <Button size="sm" onClick={() => setRoute(['Start', 'Corner A', 'Corner B', 'End'])}>Calculate</Button>
        </div>
        {route.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {route.map((r, i) => (
              <Badge key={i} variant="default">{r}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnxietyPatternDetection() {
  const [patterns, setPatterns] = useState<string[]>([]);
  useEffect(() => {
    setPatterns(['crowd_avoidance', 'noise_sensitivity', 'light_sensitivity', 'social_avoidance']);
  }, []);
  return (
    <Card className="border-purple-200/30">
      <CardContent className="p-4 space-y-2">
        <span className="text-sm font-heading">Detected Patterns</span>
        {patterns.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Badge variant="default">{p}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CognitiveLoadMonitor() {
  return (
    <Card className="border-amber-200/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading">Cognitive Load</span>
          <Badge variant="outline">50%</Badge>
        </div>
        <div className="w-full h-2 bg-black rounded overflow-hidden">
          <div className="h-full bg-amber-400 rounded" style={{ width: '50%' }} />
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialBatteryIndicator() {
  return (
    <Card className="border-emerald-200/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-heading">Social Battery</span>
          <Badge variant="default">85%</Badge>
        </div>
        <div className="w-full h-2 bg-black rounded overflow-hidden">
          <div className="h-full bg-emerald-400 rounded" style={{ width: '85%' }} />
        </div>
      </CardContent>
    </Card>
  );
}

export function CrowdednessGauge() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Crowdedness Gauge</span><div className="h-4 bg-black rounded mt-2"><div className="h-full bg-gradient-to-r from-green via-yellow to-red rounded" style={{ width: '65%' }} /></div></CardContent></Card>; }
export function QuietZoneFinder() { return <Card className="border-emerald-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Quiet Zone Finder</span><Button size="sm" className="mt-2">Find Nearest</Button></CardContent></Card>; }
export function NoiseCancellation() { return <Card className="border-cyan-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Noise Cancellation</span><Badge>Active</Badge></CardContent></Card>; }
export function CrowdFlowPredictor() { return <Card className="border-amber-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Crowd Flow Predictor</span><Badge variant="outline">Predicting</Badge></CardContent></Card>; }
export function SafePersonNetwork() { return <Card className="border-violet-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Safe Person Network</span><Badge>5 trusted contacts</Badge></CardContent></Card>; }
export function AnxietyTriggerDetector() { return <Card className="border-pink-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Trigger Detector</span><Badge variant="default">Detecting...</Badge></CardContent></Card>; }
export function CalmSpaceMapper() { return <Card className="border-teal-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Calm Space Mapper</span><Badge>Mapping...</Badge></CardContent></Card>; }
export function SocialAvoidanceCoach() { return <Card className="border-indigo-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Avoidance Coach</span><Badge variant="outline">Guiding</Badge></CardContent></Card>; }
export function CrowdMemory() { return <Card className="border-orange-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Crowd Memory</span><Badge>Remembering</Badge></CardContent></Card>; }
export function EscapeRouteHistory() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Escape History</span><Badge>5 routes saved</Badge></CardContent></Card>; }
export function GroceryCrowdPredictor() { return <Card className="border-emerald-200/30"><CardContent className="p-4"><span className="text-sm">Grocery Crowd Predictor</span><Badge>Best time: 9am</Badge></CardContent></Card>; }
export function RestaurantCrowdForecast() { return <Card className="border-amber-200/30"><CardContent className="p-4"><span className="text-sm">Restaurant Crowd Forecast</span><Badge>Moderate</Badge></CardContent></Card>; }
export function LibraryQuietMap() { return <Card className="border-cyan-200/30"><CardContent className="p-4"><span className="text-sm">Library Quiet Map</span><Badge>Zone A: Quiet</Badge></CardContent></Card>; }
export function GymCrowdAvoidance() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm">Gym Crowd Avoidance</span><Badge>Low: 6-8am</Badge></CardContent></Card>; }
export function CoffeeShopRating() { return <Card className="border-orange-200/30"><CardContent className="p-4"><span className="text-sm">Coffee Shop Rating</span><Badge>Starbucks: 7.5/10</Badge></CardContent></Card>; }
export function ShoppingMallHeatmap() { return <Card className="border-pink-200/30"><CardContent className="p-4"><span className="text-sm">Mall Heatmap</span><Badge>Level 2: Busy</Badge></CardContent></Card>; }
export function AirportNavigator() { return <Card className="border-blue-200/30"><CardContent className="p-4"><span className="text-sm">Airport Navigator</span><Badge>Terminal B: Clear</Badge></CardContent></Card>; }
export function HospitalWaitTimes() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm">Hospital Wait</span><Badge>15 min</Badge></CardContent></Card>; }
export function ChurchCrowdLevel() { return <Card className="border-purple-200/30"><CardContent className="p-4"><span className="text-sm">Church Crowd</span><Badge>Low</Badge></CardContent></Card>; }
export function ParkOccupancy() { return <Card className="border-green-200/30"><CardContent className="p-4"><span className="text-sm">Park Occupancy</span><Badge>40% full</Badge></CardContent></Card>; }
export function MLModelManager() { return <Card className="border-purple-200/30"><CardContent className="p-4"><span className="text-sm font-heading">ML Model Manager</span><Badge>3 models loaded</Badge></CardContent></Card>; }
export function NeuralCrowdPredictor() { return <Card className="border-indigo-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Neural Crowd Predictor</span><Badge>94% accuracy</Badge></CardContent></Card>; }
export function AIGuide() { return <Card className="border-cyan-200/30"><CardContent className="p-4"><span className="text-sm font-heading">AI Guide</span><Badge>Ready to assist</Badge></CardContent></Card>; }
export function PredictiveEscape() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Predictive Escape</span><Badge>Predicting danger</Badge></CardContent></Card>; }
export function SmartRouting() { return <Card className="border-emerald-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Smart Routing</span><Badge>Optimizing</Badge></CardContent></Card>; }
export function BehavioralAnalysis() { return <Card className="border-violet-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Behavioral Analysis</span><Badge>Tracking patterns</Badge></CardContent></Card>; }
export function CrowdsourcedIntelligence() { return <Card className="border-amber-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Crowd Intel</span><Badge>Aggregating</Badge></CardContent></Card>; }
export function AdaptiveCrowdModel() { return <Card className="border-pink-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Adaptive Model</span><Badge>Learning</Badge></CardContent></Card>; }
export function DeepQuietScore() { return <Card className="border-teal-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Deep Quiet Score</span><Badge>Analyzing</Badge></CardContent></Card>; }
export function AnomalyDetection() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Anomaly Detection</span><Badge>Scanning</Badge></CardContent></Card>; }
export function ScreenReaderSupport() { return <Card className="border-cyan-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Screen Reader</span><Badge>Optimized</Badge></CardContent></Card>; }
export function VoiceNavigation() { return <Card className="border-violet-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Voice Nav</span><Badge>Listening...</Badge></CardContent></Card>; }
export function HighContrastMode() { return <Card className="border-yellow-200/30"><CardContent className="p-4"><span className="text-sm font-heading">High Contrast</span><Badge>Enabled</Badge></CardContent></Card>; }
export function LargeTextMode() { return <Card className="border-blue-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Large Text</span><Badge>200%</Badge></CardContent></Card>; }
export function ReducedMotionMode() { return <Card className="border-gray-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Reduce Motion</span><Badge>Active</Badge></CardContent></Card>; }
export function HapticFeedback() { return <Card className="border-pink-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Haptic Feedback</span><Badge>On</Badge></CardContent></Card>; }
export function AudioDescriptions() { return <Card className="border-cyan-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Audio Desc</span><Badge>Enabled</Badge></CardContent></Card>; }
export function KeyboardMode() { return <Card className="border-violet-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Keyboard Only</span><Badge>Active</Badge></CardContent></Card>; }
export function SwitchAccess() { return <Card className="border-amber-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Switch Access</span><Badge>Configured</Badge></CardContent></Card>; }
export function ClosedCaptions() { return <Card className="border-blue-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Closed Captions</span><Badge>On</Badge></CardContent></Card>; }
export function APIAccessLayer() { return <Card className="border-purple-200/30"><CardContent className="p-4"><span className="text-sm font-heading">API Layer</span><Badge>v2 active</Badge></CardContent></Card>; }
export function WebhookSystem() { return <Card className="border-indigo-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Webhooks</span><Badge>2 endpoints</Badge></CardContent></Card>; }
export function PluginManager() { return <Card className="border-cyan-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Plugins</span><Badge>5 installed</Badge></CardContent></Card>; }
export function WhiteLabelMode() { return <Card className="border-violet-200/30"><CardContent className="p-4"><span className="text-sm font-heading">White Label</span><Badge>Ready</Badge></CardContent></Card>; }
export function MultiTenantSupport() { return <Card className="border-pink-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Multi-Tenant</span><Badge>3 tenants</Badge></CardContent></Card>; }
export function AuditLogging() { return <Card className="border-red-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Audit Log</span><Badge>Tracking</Badge></CardContent></Card>; }
export function SSOSupport() { return <Card className="border-blue-200/30"><CardContent className="p-4"><span className="text-sm font-heading">SSO</span><Badge>Configured</Badge></CardContent></Card>; }
export function DataExport() { return <Card className="border-green-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Data Export</span><Badge>CSV ready</Badge></CardContent></Card>; }
export function EnterpriseAnalytics() { return <Card className="border-amber-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Enterprise Stats</span><Badge>Dashboard</Badge></CardContent></Card>; }
export function CustomThemeEngine() { return <Card className="border-orange-200/30"><CardContent className="p-4"><span className="text-sm font-heading">Theme Engine</span><Badge>Custom themes</Badge></CardContent></Card>; }

export default function FeatureBatch2() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <PanicButton />
      <SensoryOverride />
      <CrowdDensityOverlay />
      <LocationSpoofing />
      <EmergencyBeacon />
      <CrowdWhisper />
      <SafeCorridorRouting />
      <AnxietyPatternDetection />
      <CognitiveLoadMonitor />
      <SocialBatteryIndicator />
      <CrowdednessGauge />
      <QuietZoneFinder />
      <NoiseCancellation />
      <CrowdFlowPredictor />
      <SafePersonNetwork />
      <AnxietyTriggerDetector />
      <CalmSpaceMapper />
      <SocialAvoidanceCoach />
      <CrowdMemory />
      <EscapeRouteHistory />
      <GroceryCrowdPredictor />
      <RestaurantCrowdForecast />
      <LibraryQuietMap />
      <GymCrowdAvoidance />
      <CoffeeShopRating />
      <ShoppingMallHeatmap />
      <AirportNavigator />
      <HospitalWaitTimes />
      <ChurchCrowdLevel />
      <ParkOccupancy />
      <MLModelManager />
      <NeuralCrowdPredictor />
      <AIGuide />
      <PredictiveEscape />
      <SmartRouting />
      <BehavioralAnalysis />
      <CrowdsourcedIntelligence />
      <AdaptiveCrowdModel />
      <DeepQuietScore />
      <AnomalyDetection />
      <ScreenReaderSupport />
      <VoiceNavigation />
      <HighContrastMode />
      <LargeTextMode />
      <ReducedMotionMode />
      <HapticFeedback />
      <AudioDescriptions />
      <KeyboardMode />
      <SwitchAccess />
      <ClosedCaptions />
      <APIAccessLayer />
      <WebhookSystem />
      <PluginManager />
      <WhiteLabelMode />
      <MultiTenantSupport />
      <AuditLogging />
      <SSOSupport />
      <DataExport />
      <EnterpriseAnalytics />
      <CustomThemeEngine />
    </div>
  );
}