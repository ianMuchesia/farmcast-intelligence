import {
  Sun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudLightning,
  LucideIcon,
} from 'lucide-react';

export interface ConditionDisplay {
  icon: LucideIcon;
  label: string;
  severity: 'clear' | 'cloudy' | 'rain' | 'storm';
}

export function getConditionDisplay(codeStr: string | number): ConditionDisplay {
  const code = typeof codeStr === 'string' ? parseInt(codeStr, 10) : codeStr;

  switch (code) {
    case 1000:
      return { icon: Sun, label: 'Clear', severity: 'clear' };
    case 1003:
      return { icon: Cloud, label: 'Partly Cloudy', severity: 'cloudy' };
    case 1006:
      return { icon: Cloud, label: 'Cloudy', severity: 'cloudy' };
    case 1009:
    case 1030:
      return { icon: CloudFog, label: 'Overcast', severity: 'cloudy' };
    case 1063:
    case 1150:
    case 1153:
    case 1180:
    case 1183:
      return { icon: CloudRain, label: 'Light Rain', severity: 'rain' };
    case 1186:
    case 1189:
    case 1192:
    case 1195:
      return { icon: CloudRain, label: 'Rain', severity: 'rain' };
    case 1087:
    case 1273:
    case 1276:
      return { icon: CloudLightning, label: 'Thunderstorm', severity: 'storm' };
    default:
      return { icon: Cloud, label: 'Unknown', severity: 'cloudy' };
  }
}
