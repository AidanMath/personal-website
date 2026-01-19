export interface SunsetConfig {
  sunX: number;
  sunY: number;
  sunRadius: number;
  horizonY: number;
  viewportHeight: number;
}

export class SunsetColorService {
  private config!: SunsetConfig;
  private waveSeed1 = 0;
  private waveSeed2 = 0;
  private waveSeed3 = 0;

  // Sky colors - from horizon (bright) to top (dark)
  private readonly skyBands = [
    '#FFFDE7',  // Pale yellow (horizon)
    '#FFF9C4',  // Light yellow
    '#FFEB3B',  // Yellow
    '#FFC107',  // Amber
    '#FF9800',  // Orange
    '#FF5722',  // Deep orange
    '#E64A19',  // Burnt orange
    '#FF7043',  // Coral
    '#EC407A',  // Pink
    '#E91E63',  // Hot pink
    '#9C27B0',  // Purple
    '#7B1FA2',  // Deep purple
    '#512DA8',  // Indigo
    '#311B92',  // Deep indigo
    '#1A237E',  // Navy
    '#0D1B4C',  // Dark navy
    '#050A18',  // Near black
  ];

  // Ocean colors - proper ocean blues from surface to deep
  private readonly oceanBands = [
    '#1E88E5',  // Bright blue (surface catching light)
    '#1976D2',  // Medium blue
    '#1565C0',  // Deeper blue
    '#0D47A1',  // Dark blue
    '#0A3D91',  // Navy blue
    '#083378',  // Deep navy
    '#062960',  // Darker navy
    '#041E48',  // Very dark blue
    '#021430',  // Near black blue
    '#010A18',  // Deep ocean
  ];

  initialize(viewportWidth: number, viewportHeight: number): SunsetConfig {
    this.waveSeed1 = Math.random() * 1000;
    this.waveSeed2 = Math.random() * 1000;
    this.waveSeed3 = Math.random() * 1000;

    this.config = {
      horizonY: viewportHeight * 0.42,
      sunX: viewportWidth * (0.3 + Math.random() * 0.4),
      sunY: viewportHeight * 0.42,
      sunRadius: 45 + Math.random() * 15,
      viewportHeight,
    };

    return this.config;
  }

  getConfig(): SunsetConfig {
    return this.config;
  }

  getColorAt(x: number, y: number): string {
    const waveOffset = this.calculateWaveOffset(x);
    const distToSun = this.calculateDistanceToSun(x, y);

    // Check if inside sun
    if (distToSun < this.config.sunRadius) {
      return this.getSunColor(distToSun);
    }

    // Determine if sky or ocean with wavy horizon
    const horizonWithWave = this.config.horizonY + waveOffset * 0.3;
    const isOcean = y > horizonWithWave;

    return isOcean
      ? this.getOceanColor(y, waveOffset)
      : this.getSkyColor(y, waveOffset, distToSun);
  }

  private calculateWaveOffset(x: number): number {
    const wave1 = Math.sin((x + this.waveSeed1) * 0.008) * 25;
    const wave2 = Math.sin((x + this.waveSeed2) * 0.015) * 15;
    const wave3 = Math.sin((x + this.waveSeed3) * 0.004) * 35;
    return wave1 + wave2 + wave3;
  }

  private calculateDistanceToSun(x: number, y: number): number {
    const dx = x - this.config.sunX;
    const dy = y - this.config.sunY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSunColor(distToSun: number): string {
    const gradient = distToSun / this.config.sunRadius;
    const r = Math.random();

    if (gradient < 0.3) {
      return r > 0.9 ? '#FFFEF0' : '#FFFFFF';
    } else if (gradient < 0.5) {
      return r > 0.8 ? '#FFFFF0' : '#FFFDE7';
    } else if (gradient < 0.7) {
      return r > 0.7 ? '#FFEB3B' : '#FFC107';
    } else if (gradient < 0.85) {
      return r > 0.6 ? '#FFA000' : '#FF8F00';
    } else {
      return r > 0.5 ? '#FF6F00' : '#E65100';
    }
  }

  private getSkyColor(y: number, waveOffset: number, distToSun: number): string {
    const verticalPos = y / this.config.horizonY;
    const adjustedPos = verticalPos + (waveOffset / this.config.horizonY) * 0.5;

    // Sun glow influence
    const sunGlowRadius = this.config.sunRadius * 4;
    const sunInfluence = distToSun < sunGlowRadius
      ? Math.pow(1 - distToSun / sunGlowRadius, 2) * 0.4
      : 0;

    const bandProgress = Math.max(0, Math.min(1, 1 - adjustedPos + sunInfluence));
    let bandIndex = Math.floor((1 - bandProgress) * this.skyBands.length);

    // Random blending
    if (Math.random() < 0.15) {
      bandIndex += Math.random() > 0.5 ? 1 : -1;
    }

    return this.skyBands[Math.max(0, Math.min(this.skyBands.length - 1, bandIndex))];
  }

  private getOceanColor(y: number, waveOffset: number): string {
    const depthBelowHorizon = y - this.config.horizonY;
    const maxDepth = this.config.viewportHeight * 2.5;
    const depthProgress = Math.min(depthBelowHorizon / maxDepth, 1);
    const adjustedDepth = depthProgress + (waveOffset / maxDepth) * 0.3;

    let bandIndex = Math.floor(adjustedDepth * this.oceanBands.length);

    // Random blending
    if (Math.random() < 0.18) {
      bandIndex += Math.random() > 0.5 ? 1 : -1;
    }

    return this.oceanBands[Math.max(0, Math.min(this.oceanBands.length - 1, bandIndex))];
  }
}
