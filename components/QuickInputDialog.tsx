function DurationInput({
  type,
  onLog,
}: {
  type: LogType;
  onLog: (value: number) => void;
}) {
  const presets = type.config.presetValues || ["15", "30", "45", "60"];

  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map((mins) => (
        <Button
          key={mins}
          variant="outline"
          onClick={() => onLog(parseInt(mins))}
        >
          {mins} mins
        </Button>
      ))}
      {type.config.allowCustom && <CustomDurationInput onLog={onLog} />}
    </div>
  );
}

function ActivityInput({
  type,
  onLog,
}: {
  type: LogType;
  onLog: (value: string) => void;
}) {
  const activities = type.config.presetValues || [];

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <Button
          key={activity}
          variant="outline"
          className="w-full justify-start"
          onClick={() => onLog(activity)}
        >
          {activity}
        </Button>
      ))}
    </div>
  );
}
