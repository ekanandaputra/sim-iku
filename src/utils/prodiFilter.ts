export interface MinimalProdi {
  id: string;
  code: string;
  name: string;
  level: string;
}

export function getLevelFromText(text: string): string | null {
  // Matches D2, D3, D4, S2, etc. (case insensitive)
  const regex = /(?:^|[^a-zA-Z0-9])([dDsS]\d+)(?:$|[^a-zA-Z0-9])/;
  const match = text.match(regex);
  return match ? match[1].toUpperCase() : null;
}

export function getComponentLevel(
  code: string,
  name: string,
  parent?: { code: string; name: string } | null
): string | null {
  // 1. Check code
  let level = getLevelFromText(code);
  if (level) return level;

  // 2. Check name
  level = getLevelFromText(name);
  if (level) return level;

  // 3. Check parent if available
  if (parent) {
    level = getLevelFromText(parent.code);
    if (level) return level;

    level = getLevelFromText(parent.name);
    if (level) return level;
  }

  return null;
}

export function filterProdisByComponent(
  prodis: MinimalProdi[],
  componentCode: string,
  componentName: string,
  parent?: { code: string; name: string } | null
): MinimalProdi[] {
  const level = getComponentLevel(componentCode, componentName, parent);
  if (!level) {
    return prodis; // No level detected, return all prodis
  }

  // Filter prodis whose Level field exactly matches the component's detected level
  return prodis.filter((prodi) => {
    // Exact check on the new prodi.level field first
    if (prodi.level && prodi.level.toUpperCase() === level) {
      return true;
    }
    // Fallback to name/code level detection if level is not set
    const prodiLevel = getLevelFromText(prodi.code) || getLevelFromText(prodi.name);
    return prodiLevel === level;
  });
}
