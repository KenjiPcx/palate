import type React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TasteProfile } from '@/types';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import colors from '@/constants/colors';

interface TasteProfileRadarProps {
  tasteProfile: TasteProfile;
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export const TasteProfileRadar: React.FC<TasteProfileRadarProps> = ({
  tasteProfile,
  size = 200,
  showLabels = true,
  showValues = false,
}) => {
  const center = size / 2;
  const radius = size * 0.4;
  
  // Calculate points for the taste profile polygon
  const getPoint = (angle: number, value: number) => {
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return { x, y };
  };
  
  const angles = [
    0,                  // Sweet (right)
    Math.PI / 3,        // Salty (top right)
    2 * Math.PI / 3,    // Sour (top left)
    Math.PI,            // Bitter (left)
    4 * Math.PI / 3,    // Umami (bottom left)
    5 * Math.PI / 3,    // Spicy (bottom right)
  ];
  
  const values = [
    tasteProfile.sweet,
    tasteProfile.salty,
    tasteProfile.sour,
    tasteProfile.bitter,
    tasteProfile.umami,
    tasteProfile.spicy,
  ];
  
  const points = angles.map((angle, index) => getPoint(angle, values[index]));
  
  const polygonPoints = points.map(point => `${point.x},${point.y}`).join(' ');
  
  // Calculate points for the background grid
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background grid */}
        {gridLevels.map((level) => (
          <Polygon
            key={`grid-${level}`}
            points={angles.map(angle => {
              const point = getPoint(angle, level);
              return `${point.x},${point.y}`;
            }).join(' ')}
            fill="none"
            stroke={colors.border}
            strokeWidth="0.5"
          />
        ))}
        
        {/* Axis lines */}
        {angles.map((angle, index) => (
          <Line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke={colors.border}
            strokeWidth="0.5"
          />
        ))}
        
        {/* Taste profile polygon */}
        <Polygon
          points={polygonPoints}
          fill={`${colors.primary}40`}
          stroke={colors.primary}
          strokeWidth="2"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={colors.primary}
          />
        ))}
        
        {/* Labels */}
        {showLabels && (
          <>
            <SvgText x={center + radius * 1.1} y={center} fontSize="12" textAnchor="start" fill={colors.text}>Sweet</SvgText>
            <SvgText x={center + radius * 0.6} y={center - radius * 0.6} fontSize="12" textAnchor="middle" fill={colors.text}>Salty</SvgText>
            <SvgText x={center - radius * 0.6} y={center - radius * 0.6} fontSize="12" textAnchor="middle" fill={colors.text}>Sour</SvgText>
            <SvgText x={center - radius * 1.1} y={center} fontSize="12" textAnchor="end" fill={colors.text}>Bitter</SvgText>
            <SvgText x={center - radius * 0.6} y={center + radius * 0.6} fontSize="12" textAnchor="middle" fill={colors.text}>Umami</SvgText>
            <SvgText x={center + radius * 0.6} y={center + radius * 0.6} fontSize="12" textAnchor="middle" fill={colors.text}>Spicy</SvgText>
          </>
        )}
      </Svg>
      
      {showValues && (
        <View style={styles.valuesContainer}>
          <Text style={styles.valueText}>Sweet: {Math.round(tasteProfile.sweet * 10)}</Text>
          <Text style={styles.valueText}>Salty: {Math.round(tasteProfile.salty * 10)}</Text>
          <Text style={styles.valueText}>Sour: {Math.round(tasteProfile.sour * 10)}</Text>
          <Text style={styles.valueText}>Bitter: {Math.round(tasteProfile.bitter * 10)}</Text>
          <Text style={styles.valueText}>Umami: {Math.round(tasteProfile.umami * 10)}</Text>
          <Text style={styles.valueText}>Spicy: {Math.round(tasteProfile.spicy * 10)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuesContainer: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 12,
    color: colors.textLight,
  },
});