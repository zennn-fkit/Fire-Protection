import EnergyChart from './EnergyChart';
import UltrasonicSensorCard from './UltrasonicSensorCard';

/** Satu kartu gabung: grafik realtime + strip tangki hydrant. */
export default function MonitoringRealtimePanel({
  energyHistory,
  waterDistance,
  maxTankCm = 200,
  chartTitle = 'Monitoring Realtime 1',
}) {
  const hasChart = energyHistory?.length > 0;

  return (
    <div
      className="card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasChart ? 'minmax(0, 1fr) minmax(240px, 32%)' : '1fr',
          gap: hasChart ? 16 : 0,
          alignItems: 'stretch',
        }}
      >
        {hasChart && (
          <EnergyChart
            embedded
            data={energyHistory}
            title={chartTitle}
            initialMetric="kw"
            chartHeight={148}
          />
        )}

        <UltrasonicSensorCard
          variant="strip"
          embedded
          distanceCm={waterDistance !== null ? waterDistance : maxTankCm * 0.313}
          maxDistanceCm={maxTankCm}
          title="Tangki Hydrant"
        />
      </div>
    </div>
  );
}
