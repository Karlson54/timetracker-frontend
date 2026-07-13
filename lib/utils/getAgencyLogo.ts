export function getAgencyLogo(agencyId: number, theme: 'light' | 'dark' = 'light'): string {
  const map: Record<number, string> = {
    1: '/images/logos/light/groupm.png',
    2: '/images/logos/light/mediacom.png',
    3: '/images/logos/light/mindshare.png',
    4: '/images/logos/light/wavemaker.png',
  }
  const fileName = map[agencyId] ?? map[1]
  return theme === 'dark' ? fileName : fileName.replace('/logos/light/', '/logos/dark/')
}