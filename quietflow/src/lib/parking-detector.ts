import { 
  ParkingLot, 
  ParkingLotOccupancy, 
  BusinessParkingAnalytics, 
  BusinessBusyComparison,
  VehicleType,
  ParkingLotOccupancyHistory,
  ParkingLotGeometry,
  BusinessLocation
} from '@/types';

/**
 * Parking Lot Vehicle Detection Engine
 * 
 * Detects vehicles in parking lots using multiple sources:
 * - Camera-based computer vision (from authorized cameras)
 * - Sensor data (IoT sensors, ground loops)
 * - Satellite imagery analysis
 * - Simulation fallback for lots without sensors
 */

interface DetectionResult {
  parkingLotId: string;
  businessId: string;
  timestamp: string;
  occupiedSpaces: number;
  totalSpaces: number;
  occupancyRate: number;
  vehiclesByType: Record<string, number>;
  entryRate: number;
  exitRate: number;
  source: 'camera' | 'sensor' | 'satellite' | 'simulation' | 'mixed';
  confidence: number;
  avgDwellMinutes: number;
  rows?: Array<{
    rowId: string;
    spaces: number;
    occupied: number;
    vehicles: Array<{ type: string; lat: number; lng: number }>;
  }>;
}

export class ParkingLotDetector {
  private static instance: ParkingLotDetector;
  private occupancyHistory: Map<string, Array<any>> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  static getInstance(): ParkingLotDetector {
    if (!ParkingLotDetector.instance) {
      ParkingLotDetector.instance = new ParkingLotDetector();
    }
    return ParkingLotDetector.instance;
  }

  /**
   * Detect current occupancy for a parking lot using available data sources
   */
  async detectOccupancy(parkingLot: ParkingLot): Promise<DetectionResult> {
    const businessId = parkingLot.businessId;
    
    // Try camera-based detection first
    const cameraResult = await this.detectFromCameras(parkingLot);
    const cameraConfidence = cameraResult.confidence ?? 0;
    if (cameraConfidence > 0.7) {
      return this.buildResult(parkingLot, cameraResult, 'camera');
    }
    
    // Try sensor data
    const sensorResult = await this.detectFromSensors(parkingLot);
    const sensorConfidence = sensorResult.confidence ?? 0;
    if (sensorConfidence > 0.6) {
      return this.buildResult(parkingLot, sensorResult, 'sensor');
    }
    
    // Try satellite imagery
    const satelliteResult = await this.detectFromSatellite(parkingLot);
    const satelliteConfidence = satelliteResult.confidence ?? 0;
    if (satelliteConfidence > 0.5) {
      return this.buildResult(parkingLot, satelliteResult, 'satellite');
    }
    
    // Fallback to simulation
    const simResult = this.simulateOccupancy(parkingLot);
    return this.buildResult(parkingLot, simResult, 'simulation');
  }

  /**
   * Detect from authorized cameras
   */
  private async detectFromCameras(parkingLot: ParkingLot): Promise<Partial<DetectionResult>> {
    // In production, this would call the camera API to get vehicle detections
    // For now, simulate based on nearby cameras
    return {
      occupiedSpaces: 0,
      totalSpaces: 0,
      occupancyRate: 0,
      vehiclesByType: { car: 0, suv: 0, truck: 0, motorcycle: 0, van: 0 },
      entryRate: 0,
      exitRate: 0,
      source: 'camera',
      confidence: 0.3 // Low confidence without real camera integration
    };
  }

  /**
   * Detect from IoT sensors (ground loops, etc.)
   */
  private async detectFromSensors(parkingLot: ParkingLot): Promise<Partial<DetectionResult>> {
    // In production, this would query IoT sensor APIs
    return {
      occupiedSpaces: 0,
      totalSpaces: 0,
      occupancyRate: 0,
      vehiclesByType: { car: 0, suv: 0, truck: 0, motorcycle: 0, van: 0 },
      entryRate: 0,
      exitRate: 0,
      source: 'sensor',
      confidence: 0.4
    };
  }

  /**
   * Detect from satellite imagery (periodic snapshots)
   */
  private async detectFromSatellite(parkingLot: ParkingLot): Promise<Partial<DetectionResult>> {
    // In production, this would analyze satellite/aerial imagery
    return {
      occupiedSpaces: 0,
      totalSpaces: 0,
      occupancyRate: 0,
      vehiclesByType: { car: 0, suv: 0, truck: 0, motorcycle: 0, van: 0 },
      entryRate: 0,
      exitRate: 0,
      source: 'satellite',
      confidence: 0.5
    };
  }

  /**
   * Fallback simulation based on historical patterns
   */
  private simulateOccupancy(parkingLot: ParkingLot): Partial<DetectionResult> {
    const totalSpaces = parkingLot.totalSpaces || 100;
    const currentOccupancy = parkingLot.currentOccupancy;
    
    if (currentOccupancy) {
      // Add some variation to existing occupancy
      const variation = (Math.random() - 0.5) * 0.1;
      const newRate = Math.max(0.05, Math.min(0.95, currentOccupancy.occupancyRate + variation));
      const occupied = Math.round(parkingLot.totalSpaces * newRate);
      
      return {
        occupiedSpaces: occupied,
        totalSpaces: parkingLot.totalSpaces,
        occupancyRate: newRate,
        vehiclesByType: this.distributeByType(occupied),
        entryRate: Math.floor(occupied * 0.5),
        exitRate: Math.floor(occupied * 0.4),
        avgDwellMinutes: 30 + Math.random() * 40,
        source: 'simulation',
        confidence: 0.6
      };
    }
    
    // First time - initialize with time-of-day pattern
    const hour = new Date().getHours();
    const baseRate = this.getTimeOfDayOccupancy();
    const occupied = Math.round(parkingLot.totalSpaces * baseRate);
    
    return {
      occupiedSpaces: occupied,
      totalSpaces: parkingLot.totalSpaces,
      occupancyRate: baseRate,
      vehiclesByType: this.distributeByType(occupied),
      entryRate: Math.floor(occupied * 0.5),
      exitRate: Math.floor(occupied * 0.4),
      avgDwellMinutes: 25 + Math.random() * 30,
      source: 'simulation',
      confidence: 0.5
    };
  }

  private getTimeOfDayOccupancy(): number {
    const hour = new Date().getHours();
    // Typical grocery/store pattern
    if (hour >= 6 && hour < 8) return 0.15 + Math.random() * 0.1;   // Early morning
    if (hour >= 8 && hour < 11) return 0.4 + Math.random() * 0.2;    // Morning rush
    if (hour >= 11 && hour < 14) return 0.6 + Math.random() * 0.2;   // Lunch peak
    if (hour >= 14 && hour < 17) return 0.45 + Math.random() * 0.2;  // Afternoon
    if (hour >= 17 && hour < 20) return 0.7 + Math.random() * 0.2;   // Evening peak
    if (hour >= 20 && hour < 22) return 0.4 + Math.random() * 0.2;   // Evening
    return 0.1 + Math.random() * 0.1; // Night
  }

  private distributeByType(total: number): Record<string, number> {
    const car = Math.round(total * 0.55);
    const suv = Math.round(total * 0.25);
    const truck = Math.round(total * 0.10);
    const motorcycle = Math.round(total * 0.03);
    const van = total - (Math.round(total * 0.55) + Math.round(total * 0.25) + Math.round(total * 0.10) + Math.round(total * 0.03));
    return { car, suv: Math.max(0, suv), truck: Math.max(0, truck), motorcycle: Math.max(0, motorcycle), van: Math.max(0, van) };
  }

  private buildResult(parkingLot: ParkingLot, detection: Partial<DetectionResult>, source: string): DetectionResult {
    const occupied = detection.occupiedSpaces || Math.round(parkingLot.totalSpaces * (detection.occupancyRate || 0));
    const total = parkingLot.totalSpaces;
    const vacant = parkingLot.totalSpaces - occupied;
    
    // Update history
    this.addToHistory(parkingLot.id, {
      timestamp: new Date().toISOString(),
      occupiedSpaces: detection.occupiedSpaces || 0,
      totalSpaces: parkingLot.totalSpaces,
      occupancyRate: detection.occupancyRate || 0,
      vehicleCount: detection.vehiclesByType ? Object.values(detection.vehiclesByType).reduce((a, b) => a + b, 0) : 0,
      source: detection.source || 'unknown'
    });

    // Calculate entry/exit rates
    const entryRate = detection.entryRate || Math.floor(Math.random() * 20) + 5;
    const exitRate = detection.exitRate || Math.floor(Math.random() * 20) + 5;

    return {
      parkingLotId: parkingLot.id,
      businessId: parkingLot.businessId,
      timestamp: new Date().toISOString(),
      occupiedSpaces: detection.occupiedSpaces || 0,
      totalSpaces: parkingLot.totalSpaces,
      occupancyRate: detection.occupancyRate || 0,
      vehiclesByType: detection.vehiclesByType || { car: 0, suv: 0, truck: 0, motorcycle: 0, van: 0 },
      entryRate: detection.entryRate || Math.floor(Math.random() * 20) + 5,
      exitRate: detection.exitRate || Math.floor(Math.random() * 20) + 5,
      source: detection.source || 'mixed',
      confidence: detection.confidence || 0.5,
      avgDwellMinutes: detection.avgDwellMinutes || 25 + Math.random() * 40
    };
  }

  /**
   * Add to occupancy history
   */
  private addToHistory(parkingLotId: string, record: any): void {
    const history = this.occupancyHistory.get(parkingLotId) || [];
    history.push(record);
    // Keep last 1000 records
    if (history.length > 1000) history.shift();
    this.occupancyHistory.set(parkingLotId, history);
  }

  /**
   * Get occupancy history for a parking lot
   */
  getHistory(parkingLotId: string): Array<any> {
    return this.occupancyHistory.get(parkingLotId) || [];
  }

  /**
   * Start real-time updates for a parking lot
   */
  startRealtimeUpdates(parkingLot: ParkingLot, callback: (result: DetectionResult) => void): void {
    if (this.updateIntervals.has(parkingLot.id)) return;
    
    const interval = setInterval(async () => {
      const result = await this.detectOccupancy(parkingLot);
      callback(result);
    }, 30000); // Every 30 seconds
    
    this.updateIntervals.set(parkingLot.id, interval);
  }

  /**
   * Stop real-time updates
   */
  stopRealtimeUpdates(parkingLotId: string): void {
    const interval = this.updateIntervals.get(parkingLotId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(parkingLotId);
    }
  }
}

/**
 * Business Analytics Engine
 * Computes busy-ness scores, compares to averages, provides recommendations
 */
export class BusinessAnalyticsEngine {
  private static instance: BusinessAnalyticsEngine;
  private parkingDetector: ParkingLotDetector;
  
  static getInstance(): BusinessAnalyticsEngine {
    if (!BusinessAnalyticsEngine.instance) {
      BusinessAnalyticsEngine.instance = new BusinessAnalyticsEngine();
    }
    return BusinessAnalyticsEngine.instance;
  }

  constructor() {
    this.parkingDetector = ParkingLotDetector.getInstance();
  }

  /**
   * Compute comprehensive analytics for a business
   */
  async computeAnalytics(business: BusinessLocation): Promise<BusinessParkingAnalytics> {
    if (!business.parkingLot) {
      throw new Error('Business has no parking lot');
    }

    // Get current occupancy
    const occupancy = await this.parkingDetector.detectOccupancy(business.parkingLot);
    
    // Get historical data
    const history = this.parkingDetector.getHistory(business.parkingLot!.id);
    
    // Calculate average for current time
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const avgForTime = this.calculateAverageForTime(occupancy.parkingLotId, hour, dayOfWeek);
    
    // Compute busy score (0-100)
    const busyScore = this.computeBusyScore(occupancy.occupancyRate, avgForTime);
    const busyLevel = this.getDensityLevel(busyScore);
    
    // Generate predictions
    const predictions = this.generatePredictions(occupancy, avgForTime);
    
    // Build comparison
    const comparison = await this.compareToCategory(business);
    
    return {
      businessId: occupancy.businessId,
      businessName: '', // Will be filled by caller
      category: 'grocery' as any, // Will be filled by caller
      lat: 0, // Will be filled by caller
      lng: 0, // Will be filled by caller
      currentOccupancy: occupancy.occupancyRate,
      currentVehicleCount: occupancy.occupiedSpaces,
      totalSpaces: occupancy.totalSpaces,
      averageOccupancyForTime: avgForTime,
      occupancyVsAverage: occupancy.occupancyRate - avgForTime,
      hourlyTrend: this.generateHourlyTrend(occupancy.parkingLotId),
      dailyTrend: this.generateDailyTrend(occupancy.parkingLotId),
      busyScore: this.computeBusyScore(occupancy.occupancyRate, avgForTime),
      busyLevel: this.getDensityLevel(this.computeBusyScore(occupancy.occupancyRate, avgForTime)),
      predictedOccupancyNextHour: this.predictNextHour(occupancy),
      predictedPeakTime: this.predictPeakTime(),
      predictedPeakOccupancy: 0.85,
      estimatedWaitMinutes: this.estimateWaitMinutes(occupancy.occupancyRate),
      recommendedVisitTime: this.getRecommendedTime(),
      lastUpdated: new Date().toISOString(),
      dataSource: 'mixed',
      confidence: 0.75
    };
  }

  /**
   * Compare business to category average
   */
  async compareToCategory(business: BusinessLocation): Promise<BusinessBusyComparison[]> {
    // In production, this would query all businesses in the same category
    // For now, return mock comparisons
    return [
      {
        businessId: business.id,
        businessName: business.name,
        category: business.category,
        currentOccupancy: 0,
        averageOccupancy: 0.4,
        percentileRank: 50,
        distanceFromUser: 0,
        isOpen: true,
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  private calculateAverageForTime(parkingLotId: string, hour: number, dayOfWeek: number): number {
    const history = this.parkingDetector.getHistory(parkingLotId);
    const relevant = history.filter(r => {
      const date = new Date(r.timestamp);
      return date.getHours() === hour && date.getDay() === dayOfWeek;
    });
    
    if (relevant.length === 0) return this.getTimeOfDayOccupancy();
    
    const sum = relevant.reduce((sum, r) => sum + r.occupancyRate, 0);
    return sum / relevant.length;
  }

  private getTimeOfDayOccupancy(): number {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 8) return 0.15;
    if (hour >= 8 && hour < 11) return 0.45;
    if (hour >= 11 && hour < 14) return 0.65;
    if (hour >= 14 && hour < 17) return 0.5;
    if (hour >= 17 && hour < 20) return 0.75;
    if (hour >= 20 && hour < 22) return 0.45;
    return 0.1;
  }

  private computeBusyScore(currentOccupancy: number, averageForTime: number): number {
    // 0-100 scale: 100 = extremely busy
    const diff = currentOccupancy - this.getTimeOfDayOccupancy();
    const base = Math.max(0, Math.min(100, 50 + diff * 100));
    return Math.min(100, Math.max(0, base));
  }

  private getDensityLevel(score: number): 'green' | 'yellow' | 'orange' | 'red' | 'purple' {
    if (score <= 20) return 'green';
    if (score <= 40) return 'yellow';
    if (score <= 60) return 'orange';
    if (score <= 80) return 'red';
    return 'purple';
  }

  private getTimeOfDayOccupancyForHour(hour: number): number {
    if (hour >= 6 && hour < 8) return 0.15;
    if (hour >= 8 && hour < 11) return 0.45;
    if (hour >= 11 && hour < 14) return 0.65;
    if (hour >= 14 && hour < 17) return 0.5;
    if (hour >= 17 && hour < 20) return 0.75;
    if (hour >= 20 && hour < 22) return 0.45;
    return 0.1;
  }

  private generatePredictions(occupancy: any, avgForTime: number): any {
    return {
      nextHour: Math.min(1, Math.max(0, occupancy.occupancyRate + (Math.random() - 0.5) * 0.15)),
      peakTime: this.predictPeakTime(),
      peakOccupancy: 0.85
    };
  }

  private generateHourlyTrend(parkingLotId: string): Array<{ hour: number; occupancy: number; vehicleCount: number }> {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      occupancy: this.getTimeOfDayOccupancyForHour(i) + (Math.random() - 0.5) * 0.1,
      vehicleCount: Math.round(100 * (this.getTimeOfDayOccupancyForHour(i) + (Math.random() - 0.5) * 0.1))
    }));
  }

  private generateDailyTrend(parkingLotId: string): Array<{ day: string; avgOccupancy: number; peakOccupancy: number }> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => ({
      day: d,
      avgOccupancy: 0.4 + Math.random() * 0.2,
      peakOccupancy: 0.7 + Math.random() * 0.2
    }));
  }

  private predictNextHour(occupancy: any): number {
    const current = occupancy.occupancyRate;
    const trend = (Math.random() - 0.5) * 0.15;
    return Math.max(0, Math.min(1, current + trend));
  }

  private predictPeakTime(): string {
    const now = new Date();
    const peakHour = 17; // 5 PM typical peak
    const peak = new Date(now);
    peak.setHours(peakHour, 0, 0, 0);
    if (peak < now) peak.setDate(peak.getDate() + 1);
    return peak.toISOString();
  }

  private estimateWaitMinutes(occupancy: number): number {
    if (occupancy < 0.3) return 0;
    if (occupancy < 0.5) return 2;
    if (occupancy < 0.7) return 5;
    if (occupancy < 0.85) return 10;
    return 15;
  }

  private getRecommendedTime(): string {
    const now = new Date();
    const nextQuiet = new Date(now);
    nextQuiet.setHours(6, 0, 0, 0); // 6 AM
    if (nextQuiet < now) nextQuiet.setDate(nextQuiet.getDate() + 1);
    return nextQuiet.toISOString();
  }
}