const configuredFileSize = Number(import.meta.env.VITE_FILEWIZ_MAX_FILE_SIZE_MB);

export const FREE_PLAN = Object.freeze({
  id: 'free',
  label: 'Free',
  maxFileSizeMb: Number.isFinite(configuredFileSize) && configuredFileSize > 0 ? configuredFileSize : 50,
  monthlyRuns: null,
  batch: false,
});

export const FILEWIZ_PLANS = Object.freeze({ free: FREE_PLAN });
