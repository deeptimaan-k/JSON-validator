export const DEFAULT_VALUE = [{ index: 0, regex: " " }];

export interface NormalizationResult {
  normalized: any;
  changes: {
    added: string[];
    removed: string[];
  };
}

/**
 * Recursively normalizes user data based on a template and tracks changes.
 */
export function normalizeJsonWithChanges(template: any, data: any, path: string = ""): NormalizationResult {
  const added: string[] = [];
  const removed: string[] = [];

  // If template is an object (and not an array)
  if (typeof template === "object" && template !== null && !Array.isArray(template)) {
    const result: any = {};
    const dataKeys = data && typeof data === "object" ? Object.keys(data) : [];
    const templateKeys = Object.keys(template);

    // Find removed keys (in data but not in template)
    for (const key of dataKeys) {
      if (!(key in template)) {
        removed.push(path ? `${path}.${key}` : key);
      }
    }

    for (const key of templateKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (data && key in data) {
        // Key exists in data, recurse
        const subResult = normalizeJsonWithChanges(template[key], data[key], currentPath);
        result[key] = subResult.normalized;
        added.push(...subResult.changes.added);
        removed.push(...subResult.changes.removed);
      } else {
        // Key missing in data, use template structure
        added.push(currentPath);
        if (Array.isArray(template[key])) {
          result[key] = JSON.parse(JSON.stringify(DEFAULT_VALUE));
        } else if (typeof template[key] === "object" && template[key] !== null) {
          const subResult = normalizeJsonWithChanges(template[key], {}, currentPath);
          result[key] = subResult.normalized;
          // Note: added keys are already handled by the recursive call
          added.push(...subResult.changes.added);
        } else {
          result[key] = template[key];
        }
      }
    }

    return { normalized: result, changes: { added, removed } };
  }

  // If template is an array
  if (Array.isArray(template)) {
    if (Array.isArray(data) && data.length > 0) {
      return { normalized: data, changes: { added, removed } };
    } else {
      added.push(path);
      return { normalized: JSON.parse(JSON.stringify(DEFAULT_VALUE)), changes: { added, removed } };
    }
  }

  // Primitive types or base case
  return { normalized: data !== undefined ? data : template, changes: { added, removed } };
}
