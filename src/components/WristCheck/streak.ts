import { defineStrings } from '../../i18n';

/** Paliers de la série de portage et des photos. Garder identiques à private.wear_streak() (migration du 02/11). */
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 180, 365] as const;
export const PHOTO_MILESTONES = [10, 50, 100, 250] as const;

export const STREAK_STRINGS = defineStrings({
  badge: {
    7: 'Une semaine', 14: 'Deux semaines', 30: 'Un mois', 50: 'Cinquante jours', 100: 'Cent jours', 180: 'Six mois', 365: 'Une année',
  } as Record<number, string>,
  short: { 7: '1 sem.', 14: '2 sem.', 30: '1 mois', 50: '50 j', 100: '100 j', 180: '6 mois', 365: '1 an' } as Record<number, string>,
  photoBadge: (n: number) => `${n} wrist shots`,
  days: (n: number) => `${n} jour${n > 1 ? 's' : ''}`,
  series: (n: number) => `Série de ${n} jour${n > 1 ? 's' : ''}`,
  doneToday: 'Wrist Check fait aujourd’hui',
  openToday: 'Notez la montre du jour pour la prolonger.',
  firstDay: 'Notez votre première montre : votre série démarre aujourd’hui.',
  paused: (n: number) => `Votre série de ${n} jours est en pause. Relancez-la dès aujourd’hui : chaque jour compte.`,
  pausedShort: 'Série en pause : relancez-la aujourd’hui',
  catchUp: (n: number) => n > 1 ? 'Hier et avant-hier ne sont pas notés : vous pouvez encore les rattraper.' : 'Un jour n’est pas noté : vous pouvez encore le rattraper.',
  catchUpBtn: 'Rattraper',
  next: (m: number, left: number) => `Prochain palier : ${m} jours, encore ${left}`,
  best: (n: number) => `Meilleure série : ${n} jours`,
  allDone: 'Tous les paliers sont atteints. Chapeau.',
  celebrate: (n: number, label: string) => `Bravo, ${n} jours d’affilée ! Badge « ${label} » débloqué.`,
  celebratePhoto: (n: number) => `Bravo, ${n} wrist shots ! Badge débloqué.`,
  kept: (n: number) => `Wrist Check noté. Série de ${n} jour${n > 1 ? 's' : ''}.`,
  start: 'Départ',
  tileTitle: 'Ma série',
  toNext: (left: number, label: string) => left <= 1 ? `Plus qu’un jour avant « ${label} »` : `Plus que ${left} jours avant « ${label} »`,
  daysInRow: 'jours d’affilée',
  dayInRow: 'jour d’affilée',
}, {
  badge: {
    7: 'One week', 14: 'Two weeks', 30: 'One month', 50: 'Fifty days', 100: 'A hundred days', 180: 'Six months', 365: 'One year',
  } as Record<number, string>,
  short: { 7: '1 wk', 14: '2 wks', 30: '1 mo', 50: '50 d', 100: '100 d', 180: '6 mo', 365: '1 yr' } as Record<number, string>,
  photoBadge: (n: number) => `${n} wrist shots`,
  days: (n: number) => `${n} day${n > 1 ? 's' : ''}`,
  series: (n: number) => `${n}-day streak`,
  doneToday: 'Wrist Check done today',
  openToday: 'Log today’s watch to keep it going.',
  firstDay: 'Log your first watch: your streak starts today.',
  paused: (n: number) => `Your ${n}-day streak is on pause. Restart it today: every day counts.`,
  pausedShort: 'Streak on pause: restart it today',
  catchUp: (n: number) => n > 1 ? 'Yesterday and the day before aren’t logged: you can still catch up.' : 'One day isn’t logged: you can still catch up.',
  catchUpBtn: 'Catch up',
  next: (m: number, left: number) => `Next milestone: ${m} days, ${left} to go`,
  best: (n: number) => `Best streak: ${n} days`,
  allDone: 'Every milestone reached. Hats off.',
  celebrate: (n: number, label: string) => `Well done, ${n} days in a row! “${label}” badge unlocked.`,
  celebratePhoto: (n: number) => `Well done, ${n} wrist shots! Badge unlocked.`,
  kept: (n: number) => `Wrist Check logged. ${n}-day streak.`,
  start: 'Start',
  tileTitle: 'My streak',
  toNext: (left: number, label: string) => left <= 1 ? `One more day to “${label}”` : `${left} more days to “${label}”`,
  daysInRow: 'days in a row',
  dayInRow: 'day in a row',
});
