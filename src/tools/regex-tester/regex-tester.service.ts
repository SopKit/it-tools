interface RegExpGroupIndices {
  [name: string]: [number, number] | undefined
}
interface RegExpIndices extends Array<[number, number] | undefined> {
  groups?: RegExpGroupIndices
}
interface RegExpExecArrayWithIndices extends RegExpExecArray {
  indices?: RegExpIndices
}
interface GroupCapture {
  name: string
  value: string
  start: number
  end: number
};

export function matchRegex(regex: string, text: string, flags: string) {
  // if (regex === '' || text === '') {
  //   return [];
  // }

  let lastIndex = -1;
  const re = new RegExp(regex, flags);
  const results = [];
  let match = re.exec(text) as RegExpExecArrayWithIndices | null;
  while (match !== null) {
    if (re.lastIndex === lastIndex || match[0] === '') {
      break;
    }
    const indices = match.indices;
    const captures: Array<GroupCapture> = [];
    Object.entries(match).forEach(([captureName, captureValue]) => {
      if (captureName !== '0' && /^\d+$/.test(captureName) && captureValue !== undefined) {
        const span = indices?.[Number(captureName)];
        captures.push({
          name: captureName,
          value: captureValue,
          start: span?.[0] ?? -1,
          end: span?.[1] ?? -1,
        });
      }
    });
    const groups: Array<GroupCapture> = [];
    Object.entries(match.groups || {}).forEach(([groupName, groupValue]) => {
      if (groupValue !== undefined) {
        const span = indices?.groups?.[groupName];
        groups.push({
          name: groupName,
          value: groupValue,
          start: span?.[0] ?? -1,
          end: span?.[1] ?? -1,
        });
      }
    });
    results.push({
      index: match.index,
      value: match[0],
      captures,
      groups,
    });
    lastIndex = re.lastIndex;
    match = re.exec(text) as RegExpExecArrayWithIndices | null;
  }
  return results;
}
