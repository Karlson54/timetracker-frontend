export function getAgencyLogo(agencyId: number): string {
  const map: Record<number, string> = {
    1: '/images/logos/groupm.png',
    2: '/images/logos/mediacom.png',
    3: '/images/logos/mindshare.png',
    4: '/images/logos/wavemaker.png',
  }
  return map[agencyId] ?? '/images/logos/groupm.png'
}